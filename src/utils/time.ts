import { format, isPast, isFuture, differenceInMinutes } from 'date-fns';

export const formatTime = (iso: string) =>
  format(new Date(iso), 'h:mm a');

export const formatDate = (iso: string) =>
  format(new Date(iso), 'MMM d, yyyy');

export const formatDateShort = (iso: string) =>
  format(new Date(iso), 'MMM d');

export const getDateString = (iso: string) =>
  iso.split('T')[0];

export const getTodayString = () =>
  new Date().toISOString().split('T')[0];

export const isTaskActive = (task: { startTime: string; endTime: string; status: string }) => {
  const now = new Date();
  const start = new Date(task.startTime);
  const end = new Date(task.endTime);
  return isPast(start) && isFuture(end) && task.status !== 'completed';
};

export const isTaskOverdue = (task: { endTime: string; status: string }) => {
  return isPast(new Date(task.endTime)) && task.status !== 'completed';
};

export const getDurationMinutes = (start: string, end: string) =>
  differenceInMinutes(new Date(end), new Date(start));

export const getTimeGroup = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
};
