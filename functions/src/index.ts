import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const checkDueTasksAndNotify = onSchedule("every 1 minutes", async () => {
  const now = new Date();
  let notifiedCount = 0;

  try {
    // --- START notifications ---
    const startSnapshot = await db.collectionGroup("tasks")
      .where("status", "==", "pending")
      .where("notifiedStart", "==", false)
      .get();

    for (const doc of startSnapshot.docs) {
      const task = doc.data();
      const taskStartTime = new Date(task.startTime);

      if (taskStartTime <= now) {
        const userId = doc.ref.parent.parent?.id;
        if (userId) {
          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.data();

          if (userData && userData.fcmToken) {
            const payload = {
              notification: {
                title: "Time to focus!",
                body: `Your task "${task.title}" starts now. Let's get to work!`,
              },
              token: userData.fcmToken,
            };

            try {
              await messaging.send(payload);
              console.log(`Successfully sent start notification for task ${task.title}`);
              await doc.ref.update({notifiedStart: true});
              notifiedCount++;
            } catch (error) {
              console.error(`Failed to send start notification for task ${doc.id}:`, error);
            }
          }
        }
      }
    }

    // --- END notifications ---
    const endSnapshot = await db.collectionGroup("tasks")
      .where("notifiedEnd", "==", false)
      .get();

    for (const doc of endSnapshot.docs) {
      const task = doc.data();
      const taskEndTime = new Date(task.endTime);

      if (taskEndTime <= now && task.status !== "completed") {
        const userId = doc.ref.parent.parent?.id;
        if (userId) {
          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.data();

          if (userData && userData.fcmToken) {
            const payload = {
              notification: {
                title: "Time's up!",
                body: `Your task "${task.title}" has ended. Mark it complete if you're done!`,
              },
              token: userData.fcmToken,
            };

            try {
              await messaging.send(payload);
              console.log(`Successfully sent end notification for task ${task.title}`);
              await doc.ref.update({notifiedEnd: true});
              notifiedCount++;
            } catch (error) {
              console.error(`Failed to send end notification for task ${doc.id}:`, error);
            }
          }
        }
      }
    }

    if (notifiedCount === 0) {
      console.log("No tasks to notify right now.");
    }
  } catch (error) {
    console.error("Error running the scheduled task checker:", error);
  }
});
