import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  applyTheme: () => void;
}

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (theme: Theme): 'dark' | 'light' => {
  if (theme === 'system') return getSystemTheme();
  return theme;
};

export const applyThemeAttribute = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      setTheme: (theme) => {
        set({ theme, resolvedTheme: resolveTheme(theme) });
        applyThemeAttribute(theme);
      },

      toggleTheme: () => {
        const current = get().resolvedTheme;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ theme: next, resolvedTheme: next });
        applyThemeAttribute(next);
      },

      applyTheme: () => {
        applyThemeAttribute(get().theme);
      },
    }),
    {
      name: 'korgix-theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolved = resolveTheme(state.theme);
          state.resolvedTheme = resolved;
          applyThemeAttribute(state.theme);
        }
      },
    }
  )
);
