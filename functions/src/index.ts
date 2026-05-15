import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

export const checkDueTasksAndNotify = onSchedule("every 1 minutes", async () => {
  const now = new Date();
  try {
    const tasksSnapshot = await db.collectionGroup("tasks")
      .where("status", "==", "pending")
      .where("notifiedStart", "==", false)
      .get();

    if (tasksSnapshot.empty) {
      console.log("No pending tasks to notify right now.");
      return;
    }

    for (const doc of tasksSnapshot.docs) {
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
              console.log(`Successfully sent notification for task ${task.title}`);
              await doc.ref.update({notifiedStart: true});
            } catch (error) {
              console.error(`Failed to send notification for task ${doc.id}:`, error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error running the scheduled task checker:", error);
  }
});
