import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PWAUpdateState {
  autoUpdate: boolean;
  needRefresh: boolean;
  offlineReady: boolean;
  checking: boolean;
  lastChecked: string | null;

  setAutoUpdate: (value: boolean) => void;
  setNeedRefresh: (value: boolean) => void;
  setOfflineReady: (value: boolean) => void;
  setChecking: (value: boolean) => void;
  setLastChecked: (value: string | null) => void;
}

export const usePWAUpdateStore = create<PWAUpdateState>()(
  persist(
    (set) => ({
      autoUpdate: true,
      needRefresh: false,
      offlineReady: false,
      checking: false,
      lastChecked: null,

      setAutoUpdate: (value) => set({ autoUpdate: value }),
      setNeedRefresh: (value) => set({ needRefresh: value }),
      setOfflineReady: (value) => set({ offlineReady: value }),
      setChecking: (value) => set({ checking: value }),
      setLastChecked: (value) => set({ lastChecked: value }),
    }),
    {
      name: 'korgix-pwa-update',
      partialize: (state) => ({ autoUpdate: state.autoUpdate }),
    }
  )
);
