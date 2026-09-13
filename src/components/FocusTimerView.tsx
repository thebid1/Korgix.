import { useEffect, useMemo, useState } from 'react';
import { X, Check, Timer } from 'lucide-react';
import { useFocusStore } from '../stores/focusStore';
import { useTaskStore } from '../stores/taskStore';
import { formatTime, getDurationMinutes } from '../utils/time';

interface FocusTimerViewProps {
  onClose: () => void;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export const FocusTimerView = ({ onClose }: FocusTimerViewProps) => {
  const focusTaskId = useFocusStore((s) => s.focusTaskId);
  const todayTasks = useTaskStore((s) => s.todayTasks) || [];
  const allTasks = useTaskStore((s) => s.allTasks) || [];
  const markComplete = useTaskStore((s) => s.markComplete);

  const task = useMemo(
    () => todayTasks.find((t) => t.id === focusTaskId) ?? allTasks.find((t) => t.id === focusTaskId),
    [todayTasks, allTasks, focusTaskId]
  );

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>This task can't be found.</p>
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold active:scale-95" style={{ background: 'var(--surface)', color: 'var(--text)' }}>
          Close
        </button>
      </div>
    );
  }

  const startMs = new Date(task.startTime).getTime();
  const endMs = new Date(task.endTime).getTime();
  const totalMs = Math.max(1, endMs - startMs);
  const remainingMs = Math.max(0, endMs - now);
  const remainingFraction = Math.min(1, Math.max(0, remainingMs / totalMs));
  const isTimeUp = remainingMs <= 0;

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const countdown = hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  const ringColor = isTimeUp
    ? 'var(--danger)'
    : remainingFraction < 0.15
      ? 'var(--warning)'
      : 'var(--accent)';

  const size = 280;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - remainingFraction);

  const durationMinutes = getDurationMinutes(task.startTime, task.endTime);
  const durationLabel = durationMinutes >= 60
    ? `${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 ? ` ${durationMinutes % 60}m` : ''}`
    : `${durationMinutes}m`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: 'var(--surface)' }}
          aria-label="Close timer"
        >
          <X size={20} style={{ color: 'var(--text)' }} />
        </button>
        <div className="flex items-center gap-2">
          <Timer size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            FOCUS
          </span>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          Now focusing
        </p>
        <h1 className="text-2xl font-bold text-center mb-8 leading-tight" style={{ color: 'var(--text)' }}>
          {task.title}
        </h1>

        <div className="relative mb-8" style={{ width: size, height: size }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, var(--accent-dim), transparent 70%)' }}
          />
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--surface-elevated)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-mono font-bold tabular-nums ${isTimeUp ? 'animate-blink' : ''}`}
              style={{
                color: isTimeUp ? 'var(--danger)' : 'var(--text)',
                fontSize: countdown.length > 5 ? 48 : 56,
                lineHeight: 1,
              }}
            >
              {countdown}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm mb-12" style={{ color: 'var(--text-secondary)' }}>
          <span>{formatTime(task.startTime)}</span>
          <span style={{ color: 'var(--text-muted)' }}>–</span>
          <span>{formatTime(task.endTime)}</span>
          <span
            className="px-2 py-0.5 rounded-full text-[11px] font-bold"
            style={{ background: 'var(--surface)', color: 'var(--accent)' }}
          >
            {durationLabel}
          </span>
        </div>

        <button
          onClick={() => {
            markComplete(task.id);
            onClose();
          }}
          className="w-full max-w-xs py-3.5 rounded-2xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
          style={{
            background: 'var(--accent)',
            color: 'var(--inverse-text)',
            boxShadow: '0 4px 20px rgba(48, 209, 88, 0.35)',
          }}
        >
          <Check size={20} />
          {isTimeUp ? 'Mark complete' : 'Complete task'}
        </button>
        <button
          onClick={onClose}
          className="mt-3 text-sm font-semibold py-2 px-4 rounded-xl transition-all active:scale-95"
          style={{ color: 'var(--text-muted)' }}
        >
          Keep working in background
        </button>
      </div>
    </div>
  );
};
