import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';
import { auth, db } from '../firebase';
import {
  collection, doc, setDoc, updateDoc, deleteDoc, getDoc,
  query, where, getDocs, enableIndexedDbPersistence,
  onSnapshot, orderBy
} from 'firebase/firestore';
import { generateRecurringInstances, generateNextInstance } from '../utils/recurrence';

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
  allTasks: Task[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  loadToday: () => Promise<void>;
  loadAllTasks: () => Promise<void>;
  subscribeToTasks: () => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'notifiedStart' | 'notifiedEnd'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  markComplete: (id: string) => Promise<void>;
  markMissed: (id: string) => Promise<void>;
  generateFirstInstance: (parentTask: Task) => Promise<void>;
  catchUpRecurringTasks: () => Promise<void>;
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
      allTasks: [],
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
          // Fetch tasks from today up to 365 days in the future for upcoming tasks
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 365);
          futureDate.setHours(23, 59, 59, 999);
          
          const q = query(tasksRef, where('startTime', '>=', getTodayMidnightISO()), where('startTime', '<=', futureDate.toISOString()), orderBy('startTime', 'asc'));
          const querySnapshot = await getDocs(q);

          const allTasks: Task[] = [];

          querySnapshot.forEach((docSnap) => {
            const task = { id: docSnap.id, ...docSnap.data() } as Task;
            
            // Skip parent recurring tasks - they're just templates
            if (task.isRecurringParent) {
              return;
            }

            allTasks.push(task);
          });

          // Sort by start time
          allTasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          set({ todayTasks: allTasks, isLoading: false });

          // Silently catch up old recurring instances without showing them in the UI
          await get().catchUpRecurringTasks();
        } catch (err) {
          console.error('loadToday error:', err);
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      loadAllTasks: async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          set({ allTasks: [], error: 'User not logged in' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const tasksRef = collection(db, 'users', userId, 'tasks');
          const pastDate = new Date();
          pastDate.setFullYear(pastDate.getFullYear() - 2);

          const q = query(
            tasksRef,
            where('startTime', '>=', pastDate.toISOString()),
            orderBy('startTime', 'asc')
          );
          const querySnapshot = await getDocs(q);

          const loadedTasks: Task[] = [];

          querySnapshot.forEach((docSnap) => {
            const task = { id: docSnap.id, ...docSnap.data() } as Task;
            if (task.isRecurringParent) {
              return;
            }
            loadedTasks.push(task);
          });

          loadedTasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          set({ allTasks: loadedTasks, isLoading: false });
        } catch (err) {
          console.error('loadAllTasks error:', err);
          set({ error: (err as Error).message, isLoading: false });
        }
      },

      subscribeToTasks: () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const prevUnsub = get().unsubscribe;
        if (prevUnsub) prevUnsub();

        const tasksRef = collection(db, 'users', userId, 'tasks');
        // Fetch tasks from today up to 365 days in the future
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 365);
        futureDate.setHours(23, 59, 59, 999);
        
        const q = query(tasksRef, where('startTime', '>=', getTodayMidnightISO()), where('startTime', '<=', futureDate.toISOString()), orderBy('startTime', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const allTasks: Task[] = [];

          snapshot.forEach((docSnap) => {
            const task = { id: docSnap.id, ...docSnap.data() } as Task;
            
            // Skip parent recurring tasks - they're just templates
            if (task.isRecurringParent) {
              return;
            }

            allTasks.push(task);
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

          // If recurring, create only the first instance
          if (newTask.isRecurringParent && newTask.recurrence && newTask.recurrence.type !== 'none') {
            const instances = generateRecurringInstances(newTask, newTask.recurrence);
            
            // Only create the first instance, next ones will be generated on-demand
            if (instances.length > 0) {
              const firstInstance = instances[0];
              const cleanInstance = Object.fromEntries(
                Object.entries(firstInstance).filter(([_, v]) => v !== undefined)
              );
              const instanceRef = doc(db, 'users', userId, 'tasks', firstInstance.id);
              await setDoc(instanceRef, cleanInstance);
            }
          }
        } catch (err) {
          console.error('addTask error:', err);
          throw err;
        }
      },

      updateTask: async (id, updates) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        try {
          // Update the exact task ID (instance or parent)
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
          // Delete the exact task ID (instance or parent)
          const taskRef = doc(db, 'users', userId, 'tasks', id);
          await deleteDoc(taskRef);
        } catch (err) {
          console.error('deleteTask error:', err);
          throw err;
        }
      },

      markComplete: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        try {
          // First, update the task to completed
          const taskRef = doc(db, 'users', userId, 'tasks', id);
          await updateDoc(taskRef, {
            status: 'completed',
            completedAt: new Date().toISOString(),
          });

          // Check if this is a recurring instance and create the next one
          const taskSnap = await getDoc(taskRef);
          if (taskSnap.exists()) {
            const completedTask = { id: taskSnap.id, ...taskSnap.data() } as Task;
            
            if (completedTask.parentTaskId && completedTask.recurrence && completedTask.recurrence.type !== 'none') {
              // Get the parent task
              const parentRef = doc(db, 'users', userId, 'tasks', completedTask.parentTaskId);
              const parentSnap = await getDoc(parentRef);
              
              if (parentSnap.exists()) {
                const parentTask = { id: parentSnap.id, ...parentSnap.data() } as Task;
                const nextInstance = generateNextInstance(completedTask, parentTask, completedTask.recurrence);
                
                if (nextInstance) {
                  const cleanInstance = Object.fromEntries(
                    Object.entries(nextInstance).filter(([_, v]) => v !== undefined)
                  );
                  const nextRef = doc(db, 'users', userId, 'tasks', nextInstance.id);
                  await setDoc(nextRef, cleanInstance);
                }
              }
            }
          }
        } catch (err) {
          console.error('markComplete error:', err);
          throw err;
        }
      },

      markMissed: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        try {
          const taskRef = doc(db, 'users', userId, 'tasks', id);
          await updateDoc(taskRef, { status: 'missed', notifiedEnd: true });

          const taskSnap = await getDoc(taskRef);
          if (taskSnap.exists()) {
            const missedTask = { id: taskSnap.id, ...taskSnap.data() } as Task;

            if (missedTask.parentTaskId && missedTask.recurrence && missedTask.recurrence.type !== 'none') {
              const parentRef = doc(db, 'users', userId, 'tasks', missedTask.parentTaskId);
              const parentSnap = await getDoc(parentRef);

              if (parentSnap.exists()) {
                const parentTask = { id: parentSnap.id, ...parentSnap.data() } as Task;
                const nextInstance = generateNextInstance(missedTask, parentTask, missedTask.recurrence);

                if (nextInstance) {
                  const cleanInstance = Object.fromEntries(
                    Object.entries(nextInstance).filter(([_, v]) => v !== undefined)
                  );
                  const nextRef = doc(db, 'users', userId, 'tasks', nextInstance.id);
                  await setDoc(nextRef, cleanInstance);
                }
              }
            }
          }
        } catch (err) {
          console.error('markMissed error:', err);
          throw err;
        }
      },

      generateFirstInstance: async (parentTask) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        if (!parentTask.recurrence || parentTask.recurrence.type === 'none') return;

        try {
          const instances = generateRecurringInstances(parentTask, parentTask.recurrence);
          if (instances.length > 0) {
            const firstInstance = instances[0];
            const cleanInstance = Object.fromEntries(
              Object.entries(firstInstance).filter(([_, v]) => v !== undefined)
            );
            const instanceRef = doc(db, 'users', userId, 'tasks', firstInstance.id);
            await setDoc(instanceRef, cleanInstance);
          }
        } catch (err) {
          console.error('generateFirstInstance error:', err);
          throw err;
        }
      },

      catchUpRecurringTasks: async () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        try {
          const tasksRef = collection(db, 'users', userId, 'tasks');
          const q = query(tasksRef, where('status', '==', 'pending'));
          const snapshot = await getDocs(q);

          const now = new Date();
          const missedTasks: Task[] = [];

          snapshot.forEach((docSnap) => {
            const task = { id: docSnap.id, ...docSnap.data() } as Task;
            if (task.parentTaskId && new Date(task.endTime).getTime() < now.getTime()) {
              missedTasks.push(task);
            }
          });

          for (const task of missedTasks) {
            await get().markMissed(task.id);
          }
        } catch (err) {
          console.error('catchUpRecurringTasks error:', err);
        }
      },

      setSelectedDate: (date) => set({ selectedDate: date }),
    }),
    {
      name: 'korgix-ui',
      partialize: (state) => ({ selectedDate: state.selectedDate }),
    }
  )
);
