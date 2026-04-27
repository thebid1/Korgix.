import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task } from '../types';
import { auth, db } from '../firebase'; // Import Firebase
import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

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
        const userId = auth.currentUser?.uid;
        if (!userId) {
          set({ todayTasks: [], error: 'User not logged in' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const { selectedDate } = get();
          
          // Query Firestore for tasks belonging to this user on the selected date
          const tasksRef = collection(db, 'users', userId, 'tasks');
          const q = query(tasksRef, where('date', '==', selectedDate));
          const querySnapshot = await getDocs(q);
          
          const tasks: Task[] = [];
          querySnapshot.forEach((doc) => {
            tasks.push(doc.data() as Task);
          });

          // Sort by start time locally
          tasks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          
          set({ todayTasks: tasks, isLoading: false });
        } catch (err) {
          set({ error: (err as Error).message, isLoading: false });
        }
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

        const taskRef = doc(db, 'users', userId, 'tasks', newTask.id);
        await setDoc(taskRef, newTask);
        
        await get().loadToday();
      },

      updateTask: async (id, updates) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        const taskRef = doc(db, 'users', userId, 'tasks', id);
        await updateDoc(taskRef, updates);
        
        await get().loadToday();
      },

      deleteTask: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not logged in');

        const taskRef = doc(db, 'users', userId, 'tasks', id);
        await deleteDoc(taskRef);
        
        await get().loadToday();
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