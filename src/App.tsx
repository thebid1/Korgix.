import { useState } from 'react';
import { TaskListView } from './components/TaskListView';
import { AddTaskView } from './components/AddTaskView';
import { useTaskScheduler } from './hooks/useTaskScheduler';
import { NotificationPermission } from './components/NotificationPermission';
import { InstallPrompt } from './components/InstallPrompt';

type Page = 'list' | 'add';

function App() {
  useTaskScheduler();
  const [page, setPage] = useState<Page>('list');
  const [animatingOut, setAnimatingOut] = useState(false);

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

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <NotificationPermission />
      <InstallPrompt />

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
