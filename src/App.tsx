import { useState, useEffect } from 'react';
import { TaskListView } from './components/TaskListView';
import { AnalyticsView } from './components/AnalyticsView';
import { AddTaskView } from './components/AddTaskView';
import { EditTaskView } from './components/EditTaskView';
import { RecurrenceModal } from './components/RecurrenceModal';
import { Onboarding } from './components/Onboarding';
import { useTaskScheduler } from './hooks/useTaskScheduler'; 
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { InstallPrompt } from './components/InstallPrompt';
import { NotificationPermission } from './components/NotificationPermission';
import { SettingsView } from './components/SettingsView';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useTaskStore } from './stores/taskStore';
import { useThemeStore } from './stores/themeStore';
import { requestFCMPermission } from './utils/fcm';
import { Task, RecurrencePattern } from './types';

type Page = 'loading' | 'onboarding' | 'list' | 'analytics' | 'add' | 'edit' | 'settings';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true;
};

// NEW: Helper function to detect mobile devices (Phones & Tablets)
const isMobileDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  // Checks for Android, iOS, and other mobile operating systems
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
};

function App() {
  const [page, setPage] = useState<Page>('loading');
  const [animatingOut, setAnimatingOut] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  // NEW: State to hold device type
  const [isMobile] = useState(isMobileDevice()); 
  const [installDismissed, setInstallDismissed] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrenceCallback, setRecurrenceCallback] = useState<((pattern: RecurrencePattern | null) => void) | null>(null);
  const [recurrenceInitial, setRecurrenceInitial] = useState<RecurrencePattern | null | undefined>(null);
  const loadToday = useTaskStore((state) => state.loadToday);
  const { checkForUpdate, updateNow } = usePWAUpdate();

  // Parse PWA shortcut / share target query params once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const sharedTitle = params.get('title') || params.get('text') || '';
    const sharedUrl = params.get('url') || '';

    if (action === 'add') {
      setPage('add');
    }

    // If a share target provided text, pre-fill is handled inside AddTaskView via URL params
    if (sharedTitle || sharedUrl) {
      setPage('add');
    }
  }, []);

  useEffect(() => {
    setIsInstalled(isInStandaloneMode());
    const mq = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches || (window.navigator as any).standalone === true);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Re-apply theme when the system preference changes while in 'system' mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const { theme, applyTheme } = useThemeStore.getState();
      if (theme === 'system') applyTheme();
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Note: NotificationPermission component handles the UI prompt

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setPage('list');
        loadToday();
        // Initialize FCM for push notifications after auth
        requestFCMPermission().catch(err => console.log('FCM setup:', err));
      } else {
        setPage('onboarding');
      }
    });
    return () => unsubscribe();
  }, [loadToday]);

  const goToAdd = () => {
    setAnimatingOut(false);
    setPage('add');
  };

  const goToAnalytics = () => {
    setAnimatingOut(false);
    setPage('analytics');
  };

  const goToSettings = () => {
    setAnimatingOut(false);
    setPage('settings');
  };

  const goToEdit = (task: Task) => {
    setEditingTask(task);
    setAnimatingOut(false);
    setPage('edit');
  };

  const goToList = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setPage('list');
      setEditingTask(null);
      setAnimatingOut(false);
    }, 250);
  };

  const handleOpenRecurrence = (
    initial: RecurrencePattern | null | undefined,
    callback: (pattern: RecurrencePattern | null) => void
  ) => {
    setRecurrenceInitial(initial);
    setRecurrenceCallback(() => callback);
    setShowRecurrenceModal(true);
  };

  const handleCloseRecurrence = (pattern: RecurrencePattern | null) => {
    if (recurrenceCallback) {
      recurrenceCallback(pattern);
    }
    setShowRecurrenceModal(false);
  };

  // UPDATED: Show install prompt ONLY if it's a mobile device AND it's not installed
  // and the user hasn't already accepted/dismissed the native prompt this session.
  if (isMobile && !isInstalled && !installDismissed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Korgix</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Plan your day. Stay on track.
          </p>
        </div>
        <InstallPrompt onInstall={() => setInstallDismissed(true)} />
      </div>
    );
  }

  if (page === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {page === 'onboarding' && <Onboarding onComplete={() => setPage('list')} />}
      {page === 'list' && (
        <>
          <NotificationPermission />
          <TaskListView onAdd={goToAdd} onEdit={goToEdit} onAnalytics={goToAnalytics} onSettings={goToSettings} user={user} />
        </>
      )}
      {page === 'analytics' && (
        <div className={`fixed inset-0 z-50 ${animatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <AnalyticsView onBack={goToList} />
        </div>
      )}
      {page === 'add' && (
        <div className={`fixed inset-0 z-50 ${animatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <AddTaskView 
            onClose={goToList}
            onOpenRecurrence={(callback) => handleOpenRecurrence(null, callback)}
          />
        </div>
      )}
      {page === 'edit' && editingTask && (
        <div className={`fixed inset-0 z-50 ${animatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <EditTaskView 
            task={editingTask}
            onClose={goToList}
            onOpenRecurrence={(initial, callback) => handleOpenRecurrence(initial, callback)}
          />
        </div>
      )}
      {page === 'settings' && (
        <div className={`fixed inset-0 z-50 ${animatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <SettingsView
            onBack={goToList}
            onCheckUpdate={checkForUpdate}
            onUpdateNow={updateNow}
          />
        </div>
      )}
      {showRecurrenceModal && (
        <div className={`fixed inset-0 z-50 ${animatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <RecurrenceModal
            initial={recurrenceInitial}
            onSelect={handleCloseRecurrence}
            onClose={() => setShowRecurrenceModal(false)}
          />
        </div>
      )}
    </div>
  );
}

export default App;