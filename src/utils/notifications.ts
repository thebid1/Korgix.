import { Task } from '../types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      ...options,
    });
  }
};

const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>[]>();

const formatTimeShort = (iso: string) => {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const scheduleTaskNotifications = (task: Task) => {
  cancelTaskNotifications(task.id);

  const timeouts: ReturnType<typeof setTimeout>[] = [];
  const now = Date.now();
  const startTime = new Date(task.startTime).getTime();
  const endTime = new Date(task.endTime).getTime();

  if (!task.notifiedStart && startTime > now) {
    const startDelay = startTime - now;
    const timeout = setTimeout(() => {
      showNotification(`🔔 Task Starting: ${task.title}`, {
        body: `Allocated: ${formatTimeShort(task.startTime)} - ${formatTimeShort(task.endTime)}`,
        tag: `start-${task.id}`,
        requireInteraction: true,
      });
    }, startDelay);
    timeouts.push(timeout);
  }

  if (!task.notifiedEnd && endTime > now && task.status !== 'completed') {
    const endDelay = endTime - now;
    const timeout = setTimeout(() => {
      showNotification(`⏰ Time's Up: ${task.title}`, {
        body: 'Your allocated time has ended. Mark complete if done!',
        tag: `end-${task.id}`,
        requireInteraction: true,
      });
    }, endDelay);
    timeouts.push(timeout);
  }

  scheduledTimeouts.set(task.id, timeouts);
};

export const cancelTaskNotifications = (taskId: string) => {
  const timeouts = scheduledTimeouts.get(taskId);
  if (timeouts) {
    timeouts.forEach(clearTimeout);
    scheduledTimeouts.delete(taskId);
  }
};

export const cancelAllNotifications = () => {
  scheduledTimeouts.forEach((timeouts) => timeouts.forEach(clearTimeout));
  scheduledTimeouts.clear();
};
