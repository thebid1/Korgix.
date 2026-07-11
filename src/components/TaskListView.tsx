import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useTaskScheduler } from '../hooks/useTaskScheduler';
import { TaskCard } from './TaskCard';
import { TaskDetail } from './TaskDetail';
import { EmptyState } from './EmptyState';
import { FilterTabs } from './FilterTabs';
import { getTodayString } from '../utils/time';
import { Plus, BarChart3 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { Task } from '../types';

type Filter = 'today' | 'upcoming' | 'done' | 'all';

interface TaskListViewProps {
  onAdd: () => void;
  onEdit?: (task: Task) => void;
  onAnalytics?: () => void;
  user: any;
}

export const TaskListView = ({ onAdd, onEdit, onAnalytics, user }: TaskListViewProps) => {
  const { todayTasks, subscribeToTasks, selectedDate, setSelectedDate, isLoading } = useTaskStore();
  const [filter, setFilter] = useState<Filter>('today');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Initialize task scheduler for automatic status transitions
  useTaskScheduler();

  useEffect(() => {
    setSelectedDate(getTodayString());
    subscribeToTasks();
    
    return () => {
      const unsub = useTaskStore.getState().unsubscribe;
      if (unsub) unsub();
    };
  }, [selectedDate, user?.uid]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return todayTasks.filter(t => t.date === getTodayString());
      case 'upcoming':
        return todayTasks.filter(t => t.status === 'pending' && new Date(t.startTime) > now);
      case 'done':
        return todayTasks.filter(t => t.status === 'completed');
      case 'all':
      default:
        return todayTasks;
    }
  }, [todayTasks, filter]);

  const counts = useMemo(() => ({
    today: todayTasks.filter(t => t.date === getTodayString()).length,
    upcoming: todayTasks.filter(t => t.status === 'pending' && new Date(t.startTime) > new Date()).length,
    done: todayTasks.filter(t => t.status === 'completed').length,
    all: todayTasks.length,
  }), [todayTasks]);

  const completedToday = todayTasks.filter(t => t.status === 'completed' && t.date === getTodayString()).length;
  const totalToday = todayTasks.filter(t => t.date === getTodayString()).length;

  const dayName = new Date().toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
  const dateStr = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' }).toUpperCase();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 px-5" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
      <header className="mb-6 pt-4">
        <p className="text-[11px] font-bold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
          {dayName}, {dateStr}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Korgix</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            {onAnalytics && (
              <button
                onClick={onAnalytics}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
                style={{ background: 'var(--surface)' }}
              >
                <BarChart3 size={20} style={{ color: 'var(--text)' }} />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {totalToday === 0 ? 'No tasks today — give your day a shape.' : `${completedToday} of ${totalToday} done today`}
        </p>
      </header>

      <div className="mb-6">
        <FilterTabs active={filter} onChange={setFilter} counts={counts} />
      </div>

      {filteredTasks.length > 0 && (
        <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          {filter === 'today' ? 'Today' : filter === 'upcoming' ? 'Upcoming' : filter === 'done' ? 'Completed' : 'All Tasks'}
        </p>
      )}

      {filteredTasks.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <div>
          {filteredTasks.map((task, i) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="cursor-pointer mb-3"
            >
              <TaskCard task={task} index={i} onEdit={onEdit} />
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} onEdit={onEdit} />
      )}

      <button
        onClick={onAdd}
        className="fixed right-5 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 z-40 no-select"
        style={{ 
          background: 'var(--accent)',
          bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))',
          boxShadow: '0 4px 20px rgba(48, 209, 88, 0.35)',
        }}
      >
        <Plus size={24} color="var(--inverse-text)" strokeWidth={2.5} />
      </button>
    </div>
  );
};