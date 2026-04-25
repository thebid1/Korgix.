import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';
import { FilterTabs } from './FilterTabs';
import { getTodayString, isTaskActive, isTaskOverdue } from '../utils/time';
import { Plus } from 'lucide-react';

type Filter = 'today' | 'upcoming' | 'done' | 'all';

interface TaskListViewProps {
  onAdd: () => void;
}

export const TaskListView = ({ onAdd }: TaskListViewProps) => {
  const { todayTasks, loadToday, selectedDate, setSelectedDate } = useTaskStore();
  const [filter, setFilter] = useState<Filter>('today');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedDate(getTodayString());
  }, []);

  useEffect(() => {
    loadToday().then(() => setIsLoading(false));
  }, [selectedDate]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return todayTasks.filter(t => {
          const taskDate = t.date;
          return taskDate === getTodayString();
        });
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
    <div className="min-h-screen pb-28 px-5 pt-6">
      {/* Header */}
      <header className="mb-6">
        <p className="text-[11px] font-bold tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
          {dayName}, {dateStr}
        </p>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          FocusFlow
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {totalToday === 0 
            ? 'No tasks today — give your day a shape.' 
            : `${completedToday} of ${totalToday} done today`
          }
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="mb-6">
        <FilterTabs active={filter} onChange={setFilter} counts={counts} />
      </div>

      {/* Section Label */}
      {filteredTasks.length > 0 && (
        <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          {filter === 'today' ? 'Today' : filter === 'upcoming' ? 'Upcoming' : filter === 'done' ? 'Completed' : 'All Tasks'}
        </p>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <div>
          {filteredTasks.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i} />
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={onAdd}
        className="fixed bottom-6 right-5 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 z-40"
        style={{ 
          background: 'var(--accent)',
          boxShadow: '0 4px 20px rgba(48, 209, 88, 0.35)',
        }}
      >
        <Plus size={24} color="#000" strokeWidth={2.5} />
      </button>
    </div>
  );
};
