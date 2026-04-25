import { useEffect, useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { scheduleTaskNotifications, showNotification, cancelAllNotifications } from '../utils/notifications';
import { isPast, isFuture } from 'date-fns';

const SCHEDULE_INTERVAL = 30000;

export const useTaskScheduler = () => {
  const { todayTasks, updateTask } = useTaskStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();

      todayTasks.forEach((task) => {
        const start = new Date(task.startTime);
        const end = new Date(task.endTime);

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
    };

    cancelAllNotifications();
    todayTasks
      .filter((t) => t.status === 'pending')
      .forEach(scheduleTaskNotifications);

    checkTasks();
    intervalRef.current = setInterval(checkTasks, SCHEDULE_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkTasks();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [todayTasks]);
};