import { useState, useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { Task, RecurrencePattern } from '../types';
import { X, Clock, Bell, RotateCw, Trash2 } from 'lucide-react';
import { getRecurrenceLabel } from '../utils/recurrence';

interface EditTaskViewProps {
  task: Task;
  onClose: () => void;
  onOpenRecurrence?: (
    current: RecurrencePattern | null | undefined,
    callback: (pattern: RecurrencePattern | null) => void
  ) => void;
}

export const EditTaskView = ({ task, onClose, onOpenRecurrence }: EditTaskViewProps) => {
  const [title, setTitle] = useState(task.title);
  const [startTime, setStartTime] = useState(task.startTime);
  const [endTime, setEndTime] = useState(task.endTime);
  const [notes, setNotes] = useState(task.description || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrencePattern | null | undefined>(task.recurrence);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const generateFirstInstance = useTaskStore((s) => s.generateFirstInstance);

  // Convert ISO string to datetime-local format
  const formatForInput = (isoString: string) => {
    const date = new Date(isoString);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleSubmit = async () => {
    setError('');
    
    // Prevent editing individual instances of recurring tasks
    if (task.parentTaskId) {
      setError('Cannot edit individual recurring task instances. Edit the parent recurring task instead.');
      return;
    }

    if (!title.trim()) {
      setError('What do you want to focus on?');
      return;
    }
    if (!startTime || !endTime) {
      setError('Set start and end times');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      setError('End time must come after start');
      return;
    }
    if ((end.getTime() - start.getTime()) / (1000 * 60 * 60) > 24) {
      setError('Keep it under 24 hours');
      return;
    }

    setIsSubmitting(true);
    try {
      const wasRecurring = !!task.isRecurringParent;
      const isNowRecurring = !!recurrence && recurrence.type !== 'none';

      const updates: Partial<Task> = {
        title: title.trim(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        description: notes.trim() || null,
        recurrence: recurrence,
        isRecurringParent: isNowRecurring,
      };

      await updateTask(task.id, updates);

      if (!wasRecurring && isNowRecurring) {
        await generateFirstInstance({ ...task, ...updates, id: task.id } as Task);
      }

      onClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    // Prevent deleting individual instances of recurring tasks
    if (task.parentTaskId) {
      setError('Cannot delete individual recurring task instances. Delete the parent recurring task instead.');
      setShowDeleteConfirm(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteTask(task.id);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const duration =
    startTime && endTime
      ? Math.max(0, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000))
      : 0;
  const durationLabel =
    duration >= 60 ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}` : `${duration}m`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: 'var(--surface)' }}
        >
          <X size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {task.parentTaskId ? 'View instance' : 'Edit task'}
        </h2>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || isSubmitting || !!task.parentTaskId}
          className="text-sm font-semibold px-4 py-2 rounded-full active:scale-95 disabled:opacity-30"
          style={{
            background: title.trim() && !isSubmitting && !task.parentTaskId ? 'var(--accent)' : 'var(--surface)',
            color: title.trim() && !isSubmitting && !task.parentTaskId ? 'var(--inverse-text)' : 'var(--text-muted)',
          }}
        >
          {isSubmitting ? '...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {task.parentTaskId && (
          <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
            <p className="text-sm font-medium">
              ℹ️ This is a recurring task instance. Edit the parent recurring task to make changes.
            </p>
          </div>
        )}
        <div className="mb-6">
          <label className="text-[11px] font-bold tracking-widest uppercase mb-3 block" style={{ color: 'var(--text-muted)' }}>
            What do you want to focus on?
          </label>
          <input
            disabled={!!task.parentTaskId}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Draft launch announcement"
            autoFocus
            className="w-full text-lg font-medium placeholder:font-normal bg-transparent outline-none pb-3 disabled:opacity-50"
            style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}
            onFocus={(e) => (e.target.style.borderBottomColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderBottomColor = 'var(--border)')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Starts
            </label>
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: 'var(--surface)' }}>
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                disabled={!!task.parentTaskId}
                type="datetime-local"
                value={formatForInput(startTime)}
                onChange={(e) => setStartTime(new Date(e.target.value).toISOString())}
                className="bg-transparent text-sm font-medium outline-none flex-1 min-w-0 disabled:opacity-50"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Ends
            </label>
            <div className="flex items-center gap-2 px-3 py-3 rounded-xl" style={{ background: 'var(--surface)' }}>
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                disabled={!!task.parentTaskId}
                type="datetime-local"
                value={formatForInput(endTime)}
                onChange={(e) => setEndTime(new Date(e.target.value).toISOString())}
                className="bg-transparent text-sm font-medium outline-none flex-1 min-w-0 disabled:opacity-50"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Duration
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {duration > 0 ? durationLabel : '—'}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
            Repeat
          </label>
          <button
            type="button"
            disabled={!!task.parentTaskId}
            onClick={() => {
              if (onOpenRecurrence) {
                onOpenRecurrence(recurrence, (pattern) => {
                  setRecurrence(pattern);
                });
              }
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--surface)', color: 'var(--text)' }}
          >
            <div className="flex items-center gap-2">
              <RotateCw size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-medium">{getRecurrenceLabel(recurrence)}</span>
            </div>
          </button>
        </div>

        <div className="mb-6">
          <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
            Notes
          </label>
          <textarea
            disabled={!!task.parentTaskId}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you want to remember"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none disabled:opacity-50"
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid transparent' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'transparent')}
          />
        </div>

        {error && <p className="text-sm font-medium mb-4 animate-shake" style={{ color: 'var(--danger)' }}>{error}</p>}

        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6" style={{ background: 'var(--surface)' }}>
          <Bell size={14} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You'll get a notification when this task starts.</p>
        </div>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={!!task.parentTaskId}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl active:scale-95 disabled:opacity-30"
          style={{ background: 'var(--surface)', color: task.parentTaskId ? 'var(--text-muted)' : 'var(--danger)' }}
        >
          <Trash2 size={16} />
          <span className="text-sm font-semibold">{task.parentTaskId ? 'Cannot delete instance' : 'Delete task'}</span>
        </button>

        {showDeleteConfirm && (
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--surface)' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--text)' }}>
              Are you sure you want to delete this task?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-3 rounded-xl text-sm font-semibold active:scale-95"
                style={{ background: 'var(--bg)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-3 rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-30"
                style={{ background: 'var(--danger)', color: 'var(--inverse-text)' }}
              >
                {isSubmitting ? '...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
