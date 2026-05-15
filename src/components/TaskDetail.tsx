import { Task } from '../types';
import { useTaskStore } from '../stores/taskStore';
import { X, Check, Trash2, Clock, AlignLeft, Pencil } from 'lucide-react';
import { formatTime, formatDate } from '../utils/time';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

export const TaskDetail = ({ task, onClose, onEdit }: TaskDetailProps) => {
  const { markComplete, deleteTask } = useTaskStore();

  const statusColors = {
    pending: '#0a84ff',
    'in-progress': '#ff9f0a',
    completed: '#30d158',
    missed: '#ff453a',
  };

  const statusLabels = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    completed: 'Completed',
    missed: 'Missed',
  };

  const isDone = task.status === 'completed';

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-slide-up">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full rounded-t-3xl p-6 animate-slide-up"
        style={{ background: 'var(--surface)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full transition-all active:scale-90"
          style={{ background: 'var(--surface-light)' }}
        >
          <X size={20} style={{ color: 'var(--text)' }} />
        </button>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: statusColors[task.status] }}
          />
          <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {statusLabels[task.status]}
          </span>
        </div>

        {/* Title */}
        <h2
          className={`text-2xl font-bold mb-4 leading-tight ${isDone ? 'line-through opacity-50' : ''}`}
          style={{ color: 'var(--text)' }}
        >
          {task.title}
        </h2>

        {/* Time info */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: 'var(--surface-light)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {formatTime(task.startTime)} – {formatTime(task.endTime)}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatDate(task.date)}
          </p>
        </div>

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Notes
              </span>
            </div>
            <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {task.description}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!isDone && (
            <button
              onClick={() => {
                markComplete(task.id);
                onClose();
              }}
              className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              <Check size={18} />
              Mark Complete
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => {
                onEdit(task);
                onClose();
              }}
              className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: 'var(--surface-light)', color: 'var(--text)' }}
            >
              <Pencil size={18} />
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex-1 py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
            style={{ background: 'var(--surface-light)', color: 'var(--danger)' }}
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
