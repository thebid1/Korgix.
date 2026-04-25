export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'missed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  notifiedStart: boolean;
  notifiedEnd: boolean;
}

export interface DayPlan {
  date: string;
  tasks: Task[];
  completedCount: number;
  totalAllocatedMinutes: number;
}
