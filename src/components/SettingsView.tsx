import { useEffect } from 'react';
import { ArrowLeft, RefreshCw, Download, CheckCircle2, Smartphone, Moon, Info } from 'lucide-react';
import { usePWAUpdateStore } from '../stores/pwaUpdateStore';
import { ThemeToggle } from './ThemeToggle';
import { Toggle } from './Toggle';
import { formatDate, formatTime } from '../utils/time';

interface SettingsViewProps {
  onBack: () => void;
  onCheckUpdate: () => Promise<void>;
  onUpdateNow: () => void;
}

export const SettingsView = ({ onBack, onCheckUpdate, onUpdateNow }: SettingsViewProps) => {
  const {
    autoUpdate,
    needRefresh,
    offlineReady,
    checking,
    lastChecked,
    setAutoUpdate,
  } = usePWAUpdateStore();

  // Clear the update badge once the user opens Settings.
  useEffect(() => {
    if (needRefresh) return;
  }, [needRefresh]);

  const statusText = needRefresh
    ? 'Update available'
    : checking
    ? 'Checking for updates...'
    : offlineReady
    ? 'App ready for offline use'
    : 'Up to date';

  const statusIcon = needRefresh ? (
    <Download size={16} style={{ color: 'var(--accent)' }} />
  ) : checking ? (
    <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--info)' }} />
  ) : offlineReady ? (
    <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
  ) : (
    <CheckCircle2 size={16} style={{ color: 'var(--text-muted)' }} />
  );

  const buildDate = __BUILD_TIME__ ? new Date(__BUILD_TIME__) : null;

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
            Settings
          </h1>
        </div>
      </header>

      {/* App Updates */}
      <section className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Smartphone size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            App Updates
          </h2>
        </div>

        <div
          className="flex items-center justify-between p-3 rounded-xl mb-3"
          style={{ background: 'var(--bg)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Auto-update
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Install updates automatically in the background
            </p>
          </div>
          <Toggle checked={autoUpdate} onChange={setAutoUpdate} label="Auto-update app" />
        </div>

        <div
          className="flex items-center justify-between p-3 rounded-xl mb-3"
          style={{ background: 'var(--bg)' }}
        >
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {statusText}
            </span>
          </div>
          {needRefresh && (
            <button
              onClick={onUpdateNow}
              className="text-xs font-bold px-3 py-1.5 rounded-full active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--inverse-text)' }}
            >
              Update now
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {lastChecked
              ? `Last checked ${formatDate(lastChecked)} at ${formatTime(lastChecked)}`
              : 'Not checked yet'}
          </p>
          <button
            onClick={onCheckUpdate}
            disabled={checking}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--surface-light)', color: 'var(--text)' }}
          >
            <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
            Check now
          </button>
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Moon size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Appearance
          </h2>
        </div>
        <ThemeToggle showLabel />
      </section>

      {/* About */}
      <section className="rounded-2xl p-4" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Info size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            About
          </h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Version</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{__APP_VERSION__}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Built</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {buildDate
                ? `${formatDate(buildDate.toISOString())} at ${formatTime(buildDate.toISOString())}`
                : '—'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
