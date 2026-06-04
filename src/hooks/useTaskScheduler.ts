import { useEffect, useRef, useCallback } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { scheduleTaskNotifications, showNotification, cancelAllNotifications } from '../utils/notifications';
import { isPast, isFuture } from 'date-fns';

const SCHEDULE_INTERVAL = 30000;

export const useTaskScheduler = () => {
  const todayTasks = useTaskStore((s) => s.todayTasks);
  const updateTask = useTaskStore((s) => s.updateTask);
  const markMissed = useTaskStore((s) => s.markMissed);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const tasksRef = useRef(todayTasks);
  const updateRef = useRef(updateTask);
  const missedRef = useRef(markMissed);

  // Keep refs in sync without triggering re-renders
  tasksRef.current = todayTasks;
  updateRef.current = updateTask;
  missedRef.current = markMissed;

  const checkTasks = useCallback(() => {
    const tasks = tasksRef.current;
    const update = updateRef.current;
    const markMissed = missedRef.current;

    tasks.forEach((task) => {
      const start = new Date(task.startTime);
      const end = new Date(task.endTime);

      // Start transition: pending → in-progress (or missed if already past end)
      if (task.status === 'pending' && isPast(start)) {
        if (isFuture(end)) {
          update(task.id, { status: 'in-progress' });
          if (!task.notifiedStart) {
            showNotification(`🔔 Starting: ${task.title}`, { body: 'Your focus block is live!', tag: `start-${task.id}` });
            update(task.id, { notifiedStart: true });
          }
        } else {
          if (!task.notifiedEnd) {
            showNotification(`⏰ Missed: ${task.title}`, { body: 'This task ended while you were away.', tag: `end-${task.id}` });
          }
          markMissed(task.id);
        }
        return;
      }

      // Normal transitions
      if (task.status === 'pending' && isPast(start) && isFuture(end)) {
        update(task.id, { status: 'in-progress' });
        if (!task.notifiedStart) {
          showNotification(`🔔 Starting: ${task.title}`, { body: 'Time to work!', tag: `start-${task.id}` });
          update(task.id, { notifiedStart: true });
        }
      }

      if ((task.status === 'pending' || task.status === 'in-progress') && isPast(end)) {
        if (!task.notifiedEnd) {
          showNotification(`⏰ Time's up: ${task.title}`, { body: 'Mark complete if done!', tag: `end-${task.id}` });
        }
        markMissed(task.id);
      }
    });
  }, []); // Empty deps — uses refs

  // Mount: start interval once
  useEffect(() => {
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
  }, []); // Run once on mount

  // Re-schedule notifications when tasks change (but don't restart interval)
  useEffect(() => {
    cancelAllNotifications();
    // Schedule for pending and in-progress tasks (exclude completed/missed)
    todayTasks
      .filter((t) => t.status === 'pending' || t.status === 'in-progress')
      .forEach(scheduleTaskNotifications);
  }, [todayTasks]);
};