import { useState, useEffect, useMemo } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { Task } from '../types';
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Clock,
  Target,
} from 'lucide-react';
import { formatTime } from '../utils/time';

type TimeRange = 'day' | 'week' | 'month' | '30days' | 'year';

interface AnalyticsViewProps {
  onBack: () => void;
}

interface DataPoint {
  label: string;
  completed: number;
  missed: number;
}

export const AnalyticsView = ({ onBack }: AnalyticsViewProps) => {
  const { allTasks, loadAllTasks, isLoading } = useTaskStore();
  const [range, setRange] = useState<TimeRange>('month');

  useEffect(() => {
    loadAllTasks();
  }, [loadAllTasks]);

  const { label, chartData, tasksInRange, stats } = useMemo(() => {
    const now = new Date();

    let s = new Date(now);
    s.setHours(0, 0, 0, 0);
    let e = new Date(now);
    e.setHours(23, 59, 59, 999);
    let periodLabel = '';

    switch (range) {
      case 'day':
        periodLabel = 'Today';
        break;
      case 'week': {
        s.setDate(s.getDate() - 6);
        periodLabel = 'Last 7 Days';
        break;
      }
      case 'month': {
        s = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
        break;
      }
      case '30days': {
        s.setDate(s.getDate() - 29);
        periodLabel = 'Last 30 Days';
        break;
      }
      case 'year': {
        s = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        periodLabel = 'Last 12 Months';
        break;
      }
    }

    const inRange = (allTasks || []).filter((t) => {
      const tStart = new Date(t.startTime).getTime();
      return (
        tStart >= s.getTime() &&
        tStart <= e.getTime() &&
        (t.status === 'completed' || t.status === 'missed')
      );
    });

    const total = inRange.length;
    const completed = inRange.filter((t) => t.status === 'completed').length;
    const missed = inRange.filter((t) => t.status === 'missed').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const data: DataPoint[] = [];

    if (range === 'day') {
      data.push({ label: 'Today', completed, missed });
    } else if (range === 'week' || range === '30days') {
      const days = range === 'week' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayTasks = inRange.filter((t) => t.date === dStr);
        const c = dayTasks.filter((t) => t.status === 'completed').length;
        const m = dayTasks.filter((t) => t.status === 'missed').length;
        const labelText =
          i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'narrow' });
        data.push({ label: labelText, completed: c, missed: m });
      }
    } else if (range === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTasks = inRange.filter((t) => t.date === dStr);
        const c = dayTasks.filter((t) => t.status === 'completed').length;
        const m = dayTasks.filter((t) => t.status === 'missed').length;
        data.push({ label: String(d), completed: c, missed: m });
      }
    } else if (range === 'year') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const monthTasks = inRange.filter((t) => t.date.startsWith(monthStr));
        const c = monthTasks.filter((t) => t.status === 'completed').length;
        const m = monthTasks.filter((t) => t.status === 'missed').length;
        data.push({
          label: d.toLocaleDateString(undefined, { month: 'short' }),
          completed: c,
          missed: m,
        });
      }
    }

    return {
      label: periodLabel,
      chartData: data,
      tasksInRange: inRange,
      stats: { total, completed, missed, rate },
    };
  }, [allTasks, range]);

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map((d) => Math.max(d.completed, d.missed)), 1);
  }, [chartData]);

  const sortedTasks = useMemo(() => {
    return [...tasksInRange].sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'completed' ? -1 : 1;
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }, [tasksInRange]);

  const rangeTabs: { key: TimeRange; label: string }[] = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: '7 Days' },
    { key: 'month', label: 'Month' },
    { key: '30days', label: '30 Days' },
    { key: 'year', label: '1 Year' },
  ];

  if (isLoading && (!allTasks || allTasks.length === 0)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-8 px-5 animate-fade-in"
      style={{
        background: 'var(--bg)',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
      }}
    >
      {/* Header */}
      <header className="flex items-center gap-3 mb-6 pt-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
          style={{ background: 'var(--surface)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Analytics
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </p>
        </div>
      </header>

      {/* Range Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {rangeTabs.map((tab) => {
          const isActive = range === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setRange(tab.key)}
              className="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all active:scale-95"
              style={{
                background: isActive ? '#ffffff' : 'var(--surface)',
                color: isActive ? '#000000' : '#ffffff',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Target size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Total
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {stats.total}
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Rate
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            {stats.rate}%
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Completed
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
            {stats.completed}
          </p>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={16} style={{ color: 'var(--danger)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Missed
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>
            {stats.missed}
          </p>
        </div>
      </div>

      {/* Chart */}
      {range !== 'day' && stats.total > 0 && (
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Overview
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Done
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Missed
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-44">
            {chartData.map((d, i) => (
              <div key={d.label + i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div className="w-full flex items-end gap-[1px] h-36">
                  <div
                    className="flex-1 rounded-t-[2px] transition-all"
                    style={{
                      height: `${maxValue > 0 ? (d.completed / maxValue) * 100 : 0}%`,
                      background: 'var(--accent)',
                      minHeight: d.completed > 0 ? 3 : 0,
                    }}
                  />
                  <div
                    className="flex-1 rounded-t-[2px] transition-all"
                    style={{
                      height: `${maxValue > 0 ? (d.missed / maxValue) * 100 : 0}%`,
                      background: 'var(--danger)',
                      minHeight: d.missed > 0 ? 3 : 0,
                    }}
                  />
                </div>
                <span
                  className="text-[9px] font-medium truncate w-full text-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {range === 'month' && i % 5 !== 0 && i !== chartData.length - 1
                    ? ''
                    : d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {range === 'day' && stats.total > 0 && (
        <div
          className="rounded-2xl p-6 mb-6 flex items-center justify-around"
          style={{ background: 'var(--surface)' }}
        >
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ background: 'var(--accent-dim)' }}
            >
              <CheckCircle2 size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              {stats.completed}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Completed
            </p>
          </div>
          <div className="w-px h-16" style={{ background: 'var(--border)' }} />
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2"
              style={{ background: 'rgba(255,69,58,0.12)' }}
            >
              <XCircle size={28} style={{ color: 'var(--danger)' }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>
              {stats.missed}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Missed
            </p>
          </div>
        </div>
      )}

      {/* Task List */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Tasks ({sortedTasks.length})
        </h2>
        {sortedTasks.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)' }}>
            <BarChart3 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              No completed or missed tasks
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Tasks will appear here once finished
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTasks.map((task, i) => (
              <div
                key={task.id}
                className="rounded-2xl p-4 flex items-center gap-3 animate-slide-up"
                style={{
                  background: 'var(--surface)',
                  animationDelay: `${i * 30}ms`,
                  opacity: 0,
                }}
              >
                <div
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{
                    background: task.status === 'completed' ? 'var(--accent)' : 'var(--danger)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <Calendar size={11} />
                    <span>{task.date}</span>
                    <Clock size={11} />
                    <span>
                      {formatTime(task.startTime)} – {formatTime(task.endTime)}
                    </span>
                  </div>
                </div>
                <div
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                  style={{
                    background:
                      task.status === 'completed'
                        ? 'var(--accent-dim)'
                        : 'rgba(255,69,58,0.12)',
                    color: task.status === 'completed' ? 'var(--accent)' : 'var(--danger)',
                  }}
                >
                  {task.status === 'completed' ? 'Done' : 'Missed'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
