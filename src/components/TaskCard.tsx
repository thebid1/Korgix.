import { Task } from '../types';
import { useTaskStore } from '../stores/taskStore';
import { Check, ChevronRight, Clock } from 'lucide-react';
import { formatTime, getDurationMinutes } from '../utils/time';
import { useEffect, useState } from 'react';

interface TaskCardProps {
  task: Task;
  index: number;
}

export const TaskCard = ({ task, index }: TaskCardProps) => {
  const { markComplete, deleteTask } = useTaskStore();
  const [countdown, setCountdown] = useState('');

  const statusColors = {
    pending: '#0a84ff',
    'in-progress': '#ff9f0a',
    completed: '#30d158',
    missed: '#ff453a',
  };

  const isDone = task.status === 'completed';
  const duration = getDurationMinutes(task.startTime, task.endTime);
  const durationLabel = duration >= 60 
    ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}` 
    : `${duration}m`;

  useEffect(() => {
    if (task.status !== 'in-progress') return;
    const update = () => {
      const remaining = new Date(task.endTime).getTime() - Date.now();
      if (remaining <= 0) { setCountdown('00:00'); return; }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [task.status, task.endTime]);

  return (
    <div 
      className="rounded-2xl p-4 mb-3 flex items-center gap-3 animate-slide-up transition-all hover:opacity-80"
      style={{ 
        background: 'var(--surface)',
        animationDelay: `${index * 50}ms`,
        opacity: 0,
      }}
    >
      {/* Left border accent */}
      <div 
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ background: statusColors[task.status] }}
      />

      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          !isDone && markComplete(task.id);
        }}
        className="w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all active:scale-90"
        style={{ 
          borderColor: isDone ? 'var(--accent)' : 'var(--border-light)',
          background: isDone ? 'var(--accent)' : 'transparent',
        }}
      >
        {isDone && <Check size={14} color="#000" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold truncate ${isDone ? 'line-through opacity-40' : ''}`} style={{ color: 'var(--text)' }}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          <Clock size={11} />
          <span>{formatTime(task.startTime)} – {formatTime(task.endTime)}</span>
          <span>•</span>
          <span>{durationLabel}</span>
          {task.status === 'in-progress' && (
            <span className="font-mono font-bold ml-1" style={{ color: 'var(--accent)' }}>
              {countdown}
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
    </div>
  );
};
