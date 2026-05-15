export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'missed';
export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'none';

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // For custom: every N days/weeks/months
  unit?: 'days' | 'weeks' | 'months'; // For custom recurrence
  maxInstances?: number; // Number of instances to generate
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  date: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  notifiedStart: boolean;
  notifiedEnd: boolean;
  recurrence?: RecurrencePattern | null;
  isRecurringParent?: boolean; // Marks this as a parent recurring task
  parentTaskId?: string; // Links instances back to parent for recurring tasks
  instanceIndex?: number; // Which instance this is (0-based)
}

export interface DayPlan {
  date: string;
  tasks: Task[];
  completedCount: number;
  totalAllocatedMinutes: number;
}
