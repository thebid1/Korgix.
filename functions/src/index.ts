import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const END_NOTIFICATION_BUFFER_MINUTES = 2;
const MISS_GRACE_PERIOD_MINUTES = 5;

export const checkDueTasksAndNotify = onSchedule("every 1 minutes", async () => {
  const now = new Date();
  const bufferMs = END_NOTIFICATION_BUFFER_MINUTES * 60 * 1000;
  let notifiedCount = 0;
  let markedMissedCount = 0;

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
              console.log(`[START] Sent notification for task "${task.title}"`);
              await doc.ref.update({notifiedStart: true});
              notifiedCount++;
            } catch (error) {
              console.error(`[START] Failed to send notification for task ${doc.id}:`, error);
            }
          }
        }
      }
    }

    // --- END warning notifications (sent a few minutes before the task ends) ---
    const endWarningSnapshot = await db.collectionGroup("tasks")
      .where("status", "in", ["pending", "in-progress"])
      .where("notifiedEnd", "==", false)
      .get();

    for (const doc of endWarningSnapshot.docs) {
      const task = doc.data();
      const taskEndTime = new Date(task.endTime);
      const warningTime = new Date(taskEndTime.getTime() - bufferMs);

      if (warningTime <= now) {
        const userId = doc.ref.parent.parent?.id;
        if (userId) {
          const userDoc = await db.collection("users").doc(userId).get();
          const userData = userDoc.data();

          if (userData && userData.fcmToken) {
            const payload = {
              notification: {
                title: "Time's almost up!",
                body: `Your task "${task.title}" ends in ${END_NOTIFICATION_BUFFER_MINUTES} minutes. Mark it complete if you're done!`,
              },
              token: userData.fcmToken,
            };

            try {
              await messaging.send(payload);
              console.log(`[END WARNING] Sent notification for task "${task.title}"`);
              await doc.ref.update({notifiedEnd: true});
              notifiedCount++;
            } catch (error) {
              console.error(`[END WARNING] Failed to send notification for task ${doc.id}:`, error);
            }
          }
        }
      }
    }

    // --- Mark tasks as missed after a grace period past the end time ---
    const overdueSnapshot = await db.collectionGroup("tasks")
      .where("status", "in", ["pending", "in-progress"])
      .get();

    for (const doc of overdueSnapshot.docs) {
      const task = doc.data();
      const taskEndTime = new Date(task.endTime);
      const missedTime = new Date(taskEndTime.getTime() + MISS_GRACE_PERIOD_MINUTES * 60 * 1000);

      if (missedTime <= now) {
        try {
          await doc.ref.update({status: "missed", notifiedEnd: true});
          console.log(`[MISSED] Marked task "${task.title}" as missed after ${MISS_GRACE_PERIOD_MINUTES}min grace`);
          markedMissedCount++;
        } catch (error) {
          console.error(`[MISSED] Failed to mark task ${doc.id} as missed:`, error);
        }
      }
    }

    if (notifiedCount === 0 && markedMissedCount === 0) {
      console.log("No tasks to notify or mark right now.");
    } else {
      console.log(`Notified: ${notifiedCount}, Marked missed: ${markedMissedCount}`);
    }
  } catch (error) {
    console.error("Error running the scheduled task checker:", error);
  }
});
