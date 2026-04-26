import { Task } from '../types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    // Try service worker notification first (works in background)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        });
      }).catch(() => {
        // Fallback to regular notification
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        });
      });
    } else {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options,
      });
    }
  }
};

// Register for push notifications (for background delivery)
export const registerPushNotifications = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('Push subscription not available without VAPID keys');
    }
    
    return !!subscription;
  } catch (e) {
    console.error('Push registration failed:', e);
    return false;
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