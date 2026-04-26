import { useEffect, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { scheduleTaskNotifications, showNotification, cancelAllNotifications } from '../utils/notifications';
import { isPast, isFuture } from 'date-fns';

const SCHEDULE_INTERVAL = 30000;

export const useTaskScheduler = () => {
  const { todayTasks, updateTask } = useTaskStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastCheckRef = useRef<number>(Date.now());

  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();
      const lastCheck = new Date(lastCheckRef.current);

      todayTasks.forEach((task) => {
        const start = new Date(task.startTime);
        const end = new Date(task.endTime);

        // CATCH-UP: If app was closed and reopened, check if we missed notifications
        if (task.status === 'pending' && isPast(start)) {
          // Task should have started while app was closed
          if (isFuture(end)) {
            updateTask(task.id, { status: 'in-progress' });
            if (!task.notifiedStart) {
              showNotification(`🔔 Starting: ${task.title}`, {
                body: 'Your focus block is live!',
                tag: `start-${task.id}`,
              });
              updateTask(task.id, { notifiedStart: true });
            }
          } else {
            // Task already ended while closed
            updateTask(task.id, { status: 'missed' });
            if (!task.notifiedEnd) {
              showNotification(`⏰ Missed: ${task.title}`, {
                body: 'This task ended while you were away.',
                tag: `end-${task.id}`,
              });
              updateTask(task.id, { notifiedEnd: true });
            }
          }
          return;
        }

        // Normal real-time transitions
        if (task.status === 'pending' && isPast(start) && isFuture(end)) {
          updateTask(task.id, { status: 'in-progress' });
          if (!task.notifiedStart) {
            showNotification(`🔔 Starting: ${task.title}`, {
              body: 'Time to work on your task!',
              tag: `start-${task.id}`,
            });
            updateTask(task.id, { notifiedStart: true });
          }
        }

        if ((task.status === 'pending' || task.status === 'in-progress') && isPast(end)) {
          updateTask(task.id, { status: 'missed' });
          if (!task.notifiedEnd) {
            showNotification(`⏰ Time's up: ${task.title}`, {
              body: 'Your allocated time has ended. Mark complete if done!',
              tag: `end-${task.id}`,
            });
            updateTask(task.id, { notifiedEnd: true });
          }
        }
      });

      lastCheckRef.current = Date.now();
    };

    cancelAllNotifications();
    todayTasks
      .filter((t) => t.status === 'pending')
      .forEach(scheduleTaskNotifications);

    // Immediate check with catch-up logic
    checkTasks();
    intervalRef.current = setInterval(checkTasks, SCHEDULE_INTERVAL);

    // Visibility change: catch up when tab becomes visible
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkTasks();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [todayTasks]);
};