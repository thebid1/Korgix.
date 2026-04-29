import { useState, useEffect } from 'react';
import { TaskListView } from './components/TaskListView';
import { AddTaskView } from './components/AddTaskView';
import { Onboarding } from './components/Onboarding';
import { useTaskScheduler } from './hooks/useTaskScheduler';
import { InstallPrompt } from './components/InstallPrompt';
import { requestNotificationPermission } from './utils/notifications';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useTaskStore } from './stores/taskStore';

type Page = 'loading' | 'onboarding' | 'list' | 'add';

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true;
};

function App() {
  const [page, setPage] = useState<Page>('loading');
  const [animatingOut, setAnimatingOut] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const loadToday = useTaskStore((state) => state.loadToday);

  useEffect(() => {
    setIsInstalled(isInStandaloneMode());
    const mq = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches || (window.navigator as any).standalone === true);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setPage('list');
        loadToday();
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

  // NOT INSTALLED: Show ONLY install prompt, block everything
  if (!isInstalled) {
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
      {page === 'list' && <TaskListView onAdd={goToAdd} user={user} />}
      {page === 'add' && (
        <div className={`fixed inset-0 z-50 ${animatingOut ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <AddTaskView onClose={goToList} />
        </div>
      )}
    </div>
  );
}

export default App;