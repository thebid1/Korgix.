import { useState, useEffect } from 'react';
import { TaskListView } from './components/TaskListView';
import { AddTaskView } from './components/AddTaskView';
import { Onboarding } from './components/Onboarding';
import { useTaskScheduler } from './hooks/useTaskScheduler';
import { NotificationPermission } from './components/NotificationPermission';
import { InstallPrompt } from './components/InstallPrompt';

// Firebase & Store imports
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { useTaskStore } from './stores/taskStore';

type Page = 'loading' | 'onboarding' | 'list' | 'add';

function App() {
  useTaskScheduler();
  const [page, setPage] = useState<Page>('loading');
  const [animatingOut, setAnimatingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Bring in loadToday from our updated Firebase-backed store
  const loadToday = useTaskStore((state) => state.loadToday);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setPage('list');
        // Fetch tasks from Firebase as soon as they log in
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

  if (page === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <img src="/icons/Korgix.png" alt="Loading..." className="w-16 h-16 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <NotificationPermission />
      <InstallPrompt />

      {page === 'onboarding' && (
        <Onboarding onComplete={() => setPage('list')} />
      )}

      {page === 'list' && (
        <TaskListView onAdd={goToAdd} />
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