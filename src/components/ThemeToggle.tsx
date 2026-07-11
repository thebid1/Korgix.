import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

type Theme = 'dark' | 'light' | 'system';

interface ThemeToggleProps {
  showLabel?: boolean;
  compact?: boolean;
}

export const ThemeToggle = ({ showLabel = false, compact = false }: ThemeToggleProps) => {
  const { theme, setTheme } = useThemeStore();

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'system', label: 'Auto', icon: Monitor },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  if (compact) {
    const active = options.find((o) => o.value === theme) || options[0];
    const Icon = active.icon;
    return (
      <button
        onClick={() => {
          const idx = options.findIndex((o) => o.value === theme);
          const next = options[(idx + 1) % options.length];
          setTheme(next.value);
        }}
        className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
        style={{ background: 'var(--surface)' }}
        aria-label={`Theme: ${active.label}`}
        title={`Theme: ${active.label}`}
      >
        <Icon size={20} style={{ color: 'var(--text)' }} />
      </button>
    );
  }

  return (
    <div
      className="inline-flex items-center rounded-full p-1"
      style={{ background: 'var(--surface)' }}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all active:scale-95"
            style={{
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive ? 'var(--inverse-text)' : 'var(--text-secondary)',
            }}
            aria-pressed={isActive}
          >
            <Icon size={16} />
            {showLabel && <span>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
};
