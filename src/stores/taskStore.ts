import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';
import * as db from '../db/indexedDB';

interface TaskState {
  todayTasks: Task[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;

  loadToday: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'notifiedStart' | 'notifiedEnd'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  markComplete: (id: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      todayTasks: [],
      selectedDate: getTodayString(),
      isLoading: false,
      error: null,

      loadToday: async () => {
        set({ isLoading: true, error: null });
        try {
          const { selectedDate } = get();
          const tasks = await db.getTasksByDate(selectedDate);
          tasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          set({ todayTasks: tasks, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      addTask: async (taskData) => {
        const newTask: Task = {
          id: crypto.randomUUID(),
          ...taskData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          notifiedStart: false,
          notifiedEnd: false,
        };
        await db.addTask(newTask);
        await get().loadToday();
      },

      updateTask: async (id, updates) => {
        await db.updateTask(id, updates);
        await get().loadToday();
      },

      deleteTask: async (id) => {
        await db.deleteTask(id);
        await get().loadToday();
      },

      markComplete: async (id) => {
        await db.updateTask(id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
        await get().loadToday();
      },

      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'korgix-ui',
      partialize: (state) => ({ selectedDate: state.selectedDate }),
    }
  )
);
