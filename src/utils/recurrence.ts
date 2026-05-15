import { RecurrencePattern, Task } from '../types';

/**
 * Generate future instances of a recurring task
 * Generates instances for the next 12 months from the task date
 */
export const generateRecurringInstances = (
  parentTask: Task,
  recurrence: RecurrencePattern,
  maxDaysAhead: number = 365
): Task[] => {
  if (recurrence.type === 'none' || !recurrence) return [];

  const instances: Task[] = [];
  const startDate = new Date(parentTask.startTime);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + maxDaysAhead);

  let currentDate = new Date(startDate);
  let instanceCount = 0;
  const maxInstances = 500; // Prevent infinite loops

  while (currentDate <= endDate && instanceCount < maxInstances) {
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
    };

    instances.push(instance);

    // Calculate next occurrence
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

    currentDate = nextDate;
    instanceCount++;
  }

  return instances;
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
