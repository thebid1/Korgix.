import { useEffect, useRef, useCallback } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { scheduleTaskNotifications, showNotification, cancelAllNotifications } from '../utils/notifications';
import { isPast, isFuture } from 'date-fns';

const SCHEDULE_INTERVAL = 30000;
const END_WARNING_MINUTES = 2;
const END_WARNING_MS = END_WARNING_MINUTES * 60 * 1000;
const MISS_GRACE_MINUTES = 5;
const MISS_GRACE_MS = MISS_GRACE_MINUTES * 60 * 1000;

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
    const now = Date.now();

    tasks.forEach((task) => {
      const start = new Date(task.startTime);
      const end = new Date(task.endTime);
      const warningTime = end.getTime() - END_WARNING_MS;

      // Start transition: pending → in-progress (or warn if already past end)
      if (task.status === 'pending' && isPast(start)) {
        if (isFuture(end)) {
          update(task.id, { status: 'in-progress' });
          if (!task.notifiedStart) {
            showNotification(`🔔 Starting: ${task.title}`, { body: 'Your focus block is live!', tag: `start-${task.id}` });
            update(task.id, { notifiedStart: true });
          }
        } else {
          // Task already ended before the user opened the app — show the warning once.
          if (!task.notifiedEnd) {
            showNotification(`⏰ Time's almost up: ${task.title}`, { body: 'This task already ended. Mark complete if done!', tag: `end-${task.id}` });
            update(task.id, { notifiedEnd: true });
          }
        }
        return;
      }

      // Normal start transition (handles edge case where scheduler missed the first branch)
      if (task.status === 'pending' && isPast(start) && isFuture(end)) {
        update(task.id, { status: 'in-progress' });
        if (!task.notifiedStart) {
          showNotification(`🔔 Starting: ${task.title}`, { body: 'Time to work!', tag: `start-${task.id}` });
          update(task.id, { notifiedStart: true });
        }
      }

      // End warning: notify a few minutes before the task ends
      if (
        (task.status === 'pending' || task.status === 'in-progress') &&
        !task.notifiedEnd &&
        now >= warningTime &&
        now < end.getTime()
      ) {
        showNotification(`⏰ Time's almost up: ${task.title}`, {
          body: `${END_WARNING_MINUTES} minutes left. Mark complete if done!`,
          tag: `end-${task.id}`,
        });
        update(task.id, { notifiedEnd: true });
      }

      // Mark missed only after the grace period has passed
      if (
        (task.status === 'pending' || task.status === 'in-progress') &&
        now >= end.getTime() + MISS_GRACE_MS
      ) {
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
