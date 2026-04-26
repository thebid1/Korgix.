import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Task } from '../types';

interface KorgixDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'KorgixDB';
const DB_VERSION = 1;

export const initDB = async (): Promise<IDBPDatabase<KorgixDB>> => {
  return openDB<KorgixDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tasks')) {
        const store = db.createObjectStore('tasks', { keyPath: 'id' });
        store.createIndex('by-date', 'date');
      }
    }
  });
};

let dbPromise: Promise<IDBPDatabase<KorgixDB>> | null = null;

const getDB = () => {
  if (!dbPromise) dbPromise = initDB();
  return dbPromise;
};

export const addTask = async (task: Task): Promise<void> => {
  const db = await getDB();
  await db.put('tasks', task);
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
  const db = await getDB();
  const existing = await db.get('tasks', id);
  if (!existing) throw new Error('Task not found');
  await db.put('tasks', { ...existing, ...updates });
};

export const deleteTask = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('tasks', id);
};

export const getTasksByDate = async (date: string): Promise<Task[]> => {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-date', date);
};

export const getAllTasks = async (): Promise<Task[]> => {
  const db = await getDB();
  return db.getAll('tasks');
};
