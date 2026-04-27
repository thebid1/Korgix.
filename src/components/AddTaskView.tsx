import { useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { getDateString } from '../utils/time';
import { X, Clock, Bell } from 'lucide-react';

interface AddTaskViewProps {
  onClose: () => void;
}

export const AddTaskView = ({ onClose }: AddTaskViewProps) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const addTask = useTaskStore((s) => s.addTask);

  const handleSubmit = () => {
    setError('');
    if (!title.trim()) { setError('What do you want to focus on?'); return; }
    if (!startTime || !endTime) { setError('Set start and end times'); return; }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) { setError('End time must come after start'); return; }
    if ((end.getTime() - start.getTime()) / (1000 * 60 * 60) > 24) { setError('Keep it under 24 hours'); return; }

    addTask({
      title: title.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      date: getDateString(start.toISOString()),
      description: notes.trim() || undefined,
    });

    onClose();
  };

  const quickAdd = (minutes: number) => {
    let baseStart: Date;
    
    if (startTime) {
      // Use the already-selected start time
      baseStart = new Date(startTime);
    } else {
      // Default: 1 minute from now
      baseStart = new Date();
      baseStart.setMinutes(baseStart.getMinutes() + 1);
      baseStart.setSeconds(0, 0);
    }
    
    const end = new Date(baseStart.getTime() + minutes * 60000);
    
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const formatForInput = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    if (!startTime) {
      setStartTime(formatForInput(baseStart));
    }
    setEndTime(formatForInput(end));
  };

  const duration = startTime && endTime 
    ? Math.max(0, Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000))
    : 0;
  const durationLabel = duration >= 60 
    ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? ` ${duration % 60}m` : ''}` 
    : `${duration}m`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90"
          style={{ background: 'var(--surface)' }}
        >
          <X size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New task</h2>
        <button 
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="text-sm font-semibold px-4 py-2 rounded-full transition-all active:scale-95 disabled:opacity-30"
          style={{ 
            background: title.trim() ? 'var(--accent)' : 'var(--surface)',
            color: title.trim() ? '#000' : 'var(--text-muted)',
          }}
        >
          Add
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Title */}
        <div className="mb-6">
          <label className="text-[11px] font-bold tracking-widest uppercase mb-3 block" style={{ color: 'var(--text-muted)' }}>
            What do you want to focus on?
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Draft launch announcement"
            autoFocus
            className="w-full text-lg font-medium placeholder:font-normal bg-transparent outline-none pb-3"
            style={{ 
              color: 'var(--text)',
              borderBottom: '1px solid var(--border)',
            }}
            onFocus={(e) => e.target.style.borderBottomColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderBottomColor = 'var(--border)'}
          />
        </div>

        {/* Time Pickers */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Starts
            </label>
            <div 
              className="flex items-center gap-2 px-3 py-3 rounded-xl"
              style={{ background: 'var(--surface)' }}
            >
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none flex-1 min-w-0"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Ends
            </label>
            <div 
              className="flex items-center gap-2 px-3 py-3 rounded-xl"
              style={{ background: 'var(--surface)' }}
            >
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-transparent text-sm font-medium outline-none flex-1 min-w-0"
                style={{ color: 'var(--text)' }}
              />
            </div>
          </div>
        </div>

        {/* Duration */}
        <div 
          className="rounded-2xl p-4 mb-6"
          style={{ background: 'var(--surface)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Duration</span>
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {duration > 0 ? durationLabel : '—'}
            </span>
          </div>
          <div className="flex gap-2">
            {[
              { label: '15m', min: 15 },
              { label: '30m', min: 30 },
              { label: '1h', min: 60 },
              { label: '2h', min: 120 },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => quickAdd(opt.min)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ 
                  background: 'var(--bg)',
                  color: 'var(--text)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="text-[11px] font-bold tracking-widest uppercase mb-2 block" style={{ color: 'var(--text-muted)' }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you want to remember"
            rows={3}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ 
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid transparent',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'transparent'}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm font-medium mb-4 animate-shake" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        {/* Info */}
        <div 
          className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
          style={{ background: 'var(--surface)' }}
        >
          <Bell size={14} style={{ color: 'var(--text-muted)' }} />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            You'll get a notification when this task starts.
          </p>
        </div>
      </div>
    </div>
  );
};