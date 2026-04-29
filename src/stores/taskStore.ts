import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';
import { auth, db } from '../firebase';
import { 
  collection, doc, setDoc, updateDoc, deleteDoc, 
  query, where, getDocs, enableIndexedDbPersistence,
  onSnapshot
} from 'firebase/firestore';

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
          const { selectedDate } = get();
          const tasksRef = collection(db, 'users', userId, 'tasks');
          const q = query(tasksRef, where('date', '==', selectedDate));
          const querySnapshot = await getDocs(q);

          const tasks: Task[] = [];
          querySnapshot.forEach((docSnap) => {
            tasks.push({ 
              id: docSnap.id, 
              ...docSnap.data() 
            } as Task);
          });

          tasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          set({ todayTasks: tasks, isLoading: false });
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
        const q = query(tasksRef, where('date', '==', get().selectedDate));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const tasks: Task[] = [];
          snapshot.forEach((docSnap) => {
            tasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
          });
          tasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          set({ todayTasks: tasks, isLoading: false });
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