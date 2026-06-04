import { RecurrencePattern, Task } from '../types';

/**
 * Calculate the max number of instances based on recurrence type
 */
export const getMaxInstancesForRecurrence = (recurrence: RecurrencePattern): number => {
  switch (recurrence.type) {
    case 'daily':
      return 30; // 30 days
    case 'weekly':
      return 4; // 4 weeks
    case 'monthly':
      return 12; // 12 months
    case 'yearly':
      return 5; // 5 years
    case 'custom':
      // For custom, estimate based on interval
      if (recurrence.unit === 'days') {
        return Math.max(4, Math.ceil(120 / recurrence.interval)); // ~120 days worth
      } else if (recurrence.unit === 'weeks') {
        return Math.max(4, Math.ceil(16 / recurrence.interval)); // ~16 weeks worth
      } else if (recurrence.unit === 'months') {
        return Math.max(4, Math.ceil(36 / recurrence.interval)); // ~36 months worth
      }
      return 10;
    case 'none':
    default:
      return 1;
  }
};

/**
 * Calculate the next occurrence date based on recurrence pattern
 */
export const getNextOccurrenceDate = (currentDate: Date, recurrence: RecurrencePattern): Date => {
  const nextDate = new Date(currentDate);
  
  switch (recurrence.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'custom':
      if (recurrence.unit === 'days') {
        nextDate.setDate(nextDate.getDate() + recurrence.interval);
      } else if (recurrence.unit === 'weeks') {
        nextDate.setDate(nextDate.getDate() + recurrence.interval * 7);
      } else if (recurrence.unit === 'months') {
        nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
      }
      break;
  }
  
  return nextDate;
};

/**
 * Generate future instances of a recurring task
 * Capped based on recurrence type
 */
export const generateRecurringInstances = (
  parentTask: Task,
  recurrence: RecurrencePattern,
  maxDaysAhead: number = 365
): Task[] => {
  if (recurrence.type === 'none' || !recurrence) return [];

  const instances: Task[] = [];
  const startDate = new Date(parentTask.startTime);
  const maxInstances = getMaxInstancesForRecurrence(recurrence);

  let currentDate = new Date(startDate);
  let instanceCount = 0;

  while (instanceCount < maxInstances) {
    // Calculate the time difference from the parent task
    const timeDiffMs = new Date(parentTask.endTime).getTime() - new Date(parentTask.startTime).getTime();

    const instanceStartTime = new Date(currentDate);
    const instanceEndTime = new Date(currentDate);
    instanceEndTime.setTime(instanceEndTime.getTime() + timeDiffMs);

    const instance: Task = {
      ...parentTask,
      id: `${parentTask.id}_${instanceCount}`,
      startTime: instanceStartTime.toISOString(),
      endTime: instanceEndTime.toISOString(),
      date: instanceStartTime.toISOString().split('T')[0],
      parentTaskId: parentTask.id,
      isRecurringParent: false,
      status: 'pending',
      completedAt: undefined,
      notifiedStart: false,
      notifiedEnd: false,
      instanceIndex: instanceCount,
    };

    instances.push(instance);
    currentDate = getNextOccurrenceDate(currentDate, recurrence);
    instanceCount++;
  }

  return instances;
};

/**
 * Generate the next instance after a given one
 */
export const generateNextInstance = (completedInstance: Task, parentTask: Task, recurrence: RecurrencePattern): Task | null => {
  if (recurrence.type === 'none' || !recurrence) return null;
  
  const maxInstances = getMaxInstancesForRecurrence(recurrence);
  const currentIndex = completedInstance.instanceIndex || 0;
  
  // Don't generate if we've reached max
  if (currentIndex + 1 >= maxInstances) return null;

  let nextDate = getNextOccurrenceDate(new Date(completedInstance.startTime), recurrence);

  // Catch-up: skip past occurrences so the next instance is always in the future
  const now = new Date();
  while (nextDate.getTime() <= now.getTime()) {
    nextDate = getNextOccurrenceDate(nextDate, recurrence);
  }

  const timeDiffMs = new Date(parentTask.endTime).getTime() - new Date(parentTask.startTime).getTime();

  const nextEndTime = new Date(nextDate);
  nextEndTime.setTime(nextEndTime.getTime() + timeDiffMs);

  const nextInstance: Task = {
    ...parentTask,
    id: `${parentTask.id}_${currentIndex + 1}`,
    startTime: nextDate.toISOString(),
    endTime: nextEndTime.toISOString(),
    date: nextDate.toISOString().split('T')[0],
    parentTaskId: parentTask.id,
    isRecurringParent: false,
    status: 'pending',
    completedAt: undefined,
    notifiedStart: false,
    notifiedEnd: false,
    instanceIndex: currentIndex + 1,
  };

  return nextInstance;
};

/**
 * Get the readable label for a recurrence pattern
 */
export const getRecurrenceLabel = (recurrence: RecurrencePattern | null | undefined): string => {
  if (!recurrence || recurrence.type === 'none') return 'No repeat';

  switch (recurrence.type) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'monthly':
      return 'Monthly';
    case 'yearly':
      return 'Yearly';
    case 'custom':
      const unit = recurrence.unit === 'days' ? 'day' : recurrence.unit === 'weeks' ? 'week' : 'month';
      return recurrence.interval === 1 ? `Every ${unit}` : `Every ${recurrence.interval} ${unit}s`;
    default:
      return 'No repeat';
  }
};
