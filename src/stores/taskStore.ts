import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';
import { auth, db } from '../firebase';
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  query, where, getDocs, enableIndexedDbPersistence,
  onSnapshot, orderBy
} from 'firebase/firestore';
import { generateRecurringInstances } from '../utils/recurrence';

try {
  enableIndexedDbPersistence(db);
} catch (err: any) {
  if (err.code === 'failed-precondition') {
    console.log('Persistence already enabled in another tab');
  } else if (err.code === 'unimplemented') {
    console.log('Browser does not support offline persistence');
  }
}

interface TaskState {
  todayTasks: Task[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  loadToday: () => Promise<void>;
  subscribeToTasks: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'notifiedStart' | 'notifiedEnd'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  markComplete: (id: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

const getTodayMidnightISO = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      todayTasks: [],
      selectedDate: getTodayString(),
      isLoading: false,
      error: null,
      unsubscribe: null,

      loadToday: async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          set({ todayTasks: [], error: 'User not logged in' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const tasksRef = collection(db, 'users', userId, 'tasks');
          const q = query(tasksRef, where('startTime', '>=', getTodayMidnightISO()), orderBy('startTime', 'asc'));
          const querySnapshot = await getDocs(q);

          const tasks: Task[] = [];
          const recurringTasks: Task[] = [];

          querySnapshot.forEach((docSnap) => {
            const task = { id: docSnap.id, ...docSnap.data() } as Task;
            
            // Skip parent recurring tasks - only include instances
            if (task.isRecurringParent) {
              // Generate instances for recurring tasks
              if (task.recurrence && task.recurrence.type !== 'none') {
                const instances = generateRecurringInstances(task, task.recurrence, 365);
                recurringTasks.push(...instances);
              }
            } else {
              tasks.push(task);
            }
          });

          // Combine and filter to today's tasks
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          const allTasks = [...tasks, ...recurringTasks].filter((task) => {
            const taskStart = new Date(task.startTime);
            return taskStart >= todayStart && taskStart <= todayEnd;
          });

          // Sort by start time
          allTasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          set({ todayTasks: allTasks, isLoading: false });
        } catch (err) {
          console.error('loadToday error:', err);
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      subscribeToTasks: () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const prevUnsub = get().unsubscribe;
        if (prevUnsub) prevUnsub();

        const tasksRef = collection(db, 'users', userId, 'tasks');
        const q = query(tasksRef, where('startTime', '>=', getTodayMidnightISO()), orderBy('startTime', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const tasks: Task[] = [];
          const recurringTasks: Task[] = [];

          snapshot.forEach((docSnap) => {
            const task = { id: docSnap.id, ...docSnap.data() } as Task;
            
            // Skip parent recurring tasks - only include instances
            if (task.isRecurringParent) {
              // Generate instances for recurring tasks
              if (task.recurrence && task.recurrence.type !== 'none') {
                const instances = generateRecurringInstances(task, task.recurrence, 365);
                recurringTasks.push(...instances);
              }
            } else {
              tasks.push(task);
            }
          });

          // Combine and filter to today's tasks
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);

          const allTasks = [...tasks, ...recurringTasks].filter((task) => {
            const taskStart = new Date(task.startTime);
            return taskStart >= todayStart && taskStart <= todayEnd;
          });

          // Sort by start time
          allTasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          set({ todayTasks: allTasks, isLoading: false });
        }, (err) => {
          console.error('Subscription error:', err);
          set({ error: (err as Error).message });
        });

        set({ unsubscribe });
      },

      addTask: async (taskData) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        const newTask: Task = {
          id: crypto.randomUUID(),
          ...taskData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          notifiedStart: false,
          notifiedEnd: false,
          isRecurringParent: taskData.recurrence && taskData.recurrence.type !== 'none' ? true : false,
        };

        try {
          const taskRef = doc(db, 'users', userId, 'tasks', newTask.id);
          const cleanTask = Object.fromEntries(
            Object.entries(newTask).filter(([_, v]) => v !== undefined)
          );
          await setDoc(taskRef, cleanTask);
        } catch (err) {
          console.error('addTask error:', err);
          throw err;
        }
      },

      updateTask: async (id, updates) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        try {
          const taskRef = doc(db, 'users', userId, 'tasks', id);
          const cleanUpdates = Object.fromEntries(
            Object.entries(updates).filter(([_, v]) => v !== undefined)
          );
          await updateDoc(taskRef, cleanUpdates);
        } catch (err) {
          console.error('updateTask error:', err);
          throw err;
        }
      },

      deleteTask: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        try {
          const taskRef = doc(db, 'users', userId, 'tasks', id);
          await deleteDoc(taskRef);
        } catch (err) {
          console.error('deleteTask error:', err);
          throw err;
        }
      },

      markComplete: async (id) => {
        await get().updateTask(id, {
          status: 'completed',
          completedAt: new Date().toISOString(),
        });
      },

      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'korgix-ui',
      partialize: (state) => ({ selectedDate: state.selectedDate }),
    }
  )
);
