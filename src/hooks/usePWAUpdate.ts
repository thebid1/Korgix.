import { useEffect, useRef, useCallback } from 'react';
import { Workbox } from 'workbox-window';
import { usePWAUpdateStore } from '../stores/pwaUpdateStore';

const SW_URL = '/app/sw.js';

interface UsePWAUpdateReturn {
  checkForUpdate: () => Promise<void>;
  updateNow: () => void;
}

export const usePWAUpdate = (): UsePWAUpdateReturn => {
  const wbRef = useRef<Workbox | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const autoUpdateRef = useRef(usePWAUpdateStore.getState().autoUpdate);

  // Keep a live reference to the latest auto-update preference inside event handlers.
  useEffect(
    () => usePWAUpdateStore.subscribe((state) => {
      autoUpdateRef.current = state.autoUpdate;
    }),
    []
  );

  const setNeedRefresh = useCallback((value: boolean) => {
    usePWAUpdateStore.getState().setNeedRefresh(value);
  }, []);

  const setOfflineReady = useCallback((value: boolean) => {
    usePWAUpdateStore.getState().setOfflineReady(value);
  }, []);

  const setChecking = useCallback((value: boolean) => {
    usePWAUpdateStore.getState().setChecking(value);
  }, []);

  const setLastChecked = useCallback((value: string | null) => {
    usePWAUpdateStore.getState().setLastChecked(value);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const wb = new Workbox(SW_URL);
    wbRef.current = wb;

    wb.addEventListener('installed', (event) => {
      if (!event.isUpdate) {
        setOfflineReady(true);
      }
    });

    wb.addEventListener('waiting', () => {
      setNeedRefresh(true);
      if (autoUpdateRef.current) {
        wb.messageSkipWaiting();
      }
    });

    wb.addEventListener('controlling', () => {
      if (autoUpdateRef.current) {
        window.location.reload();
      }
    });

    wb.register()
      .then((registration) => {
        if (registration) {
          registrationRef.current = registration;
        }
      })
      .catch((err) => {
        console.error('PWA service worker registration failed:', err);
      });

    return () => {
      // workbox-window does not provide a cleanup method; the registration persists for the page lifetime.
    };
  }, [setNeedRefresh, setOfflineReady]);

  const checkForUpdate = useCallback(async () => {
    const registration = registrationRef.current;
    if (!registration) return;

    setChecking(true);
    try {
      await registration.update();
      setLastChecked(new Date().toISOString());
    } catch (err) {
      console.error('Update check failed:', err);
    } finally {
      setChecking(false);
    }
  }, [setChecking, setLastChecked]);

  const updateNow = useCallback(() => {
    if (wbRef.current) {
      wbRef.current.messageSkipWaiting();
    }
  }, []);

  return { checkForUpdate, updateNow };
};
