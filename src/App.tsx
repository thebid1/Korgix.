import { useState, useEffect } from 'react';
import { TaskListView } from './components/TaskListView';
import { AddTaskView } from './components/AddTaskView';
import { Onboarding } from './components/Onboarding';
import { useTaskScheduler } from './hooks/useTaskScheduler'; 
import { InstallPrompt } from './components/InstallPrompt';
import { NotificationPermission } from './components/NotificationPermission';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useTaskStore } from './stores/taskStore';
import { requestFCMPermission } from './utils/fcm';

type Page = 'loading' | 'onboarding' | 'list' | 'add';

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
  const loadToday = useTaskStore((state) => state.loadToday);

  useEffect(() => {
    setIsInstalled(isInStandaloneMode());
    const mq = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches || (window.navigator as any).standalone === true);
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

  const goToList = () => {
    setAnimatingOut(true);
    setTimeout(() => {
      setPage('list');
      setAnimatingOut(false);
    }, 250);
  };

  // UPDATED: Show install prompt ONLY if it's a mobile device AND it's not installed
  if (isMobile && !isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--accent)' }}>Korgix</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Plan your day. Stay on track.
          </p>
        </div>
        <InstallPrompt />
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
          <TaskListView onAdd={goToAdd} user={user} />
        </>
      )}
      {page === 'add' && (
        <div className={`fixed inset-0 z-50 ${animatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <AddTaskView onClose={goToList} />
        </div>
      )}
    </div>
  );
}

export default App;