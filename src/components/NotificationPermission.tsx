import { useState, useEffect } from 'react';
import { requestNotificationPermission } from '../utils/notifications';
import { Bell, X } from 'lucide-react';

export const NotificationPermission = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShow(true);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) setShow(false);
  };

  if (!show) return null;

  return (
    <div className="px-5 pt-4 animate-fade-in">
      <div 
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-dim)' }}
          >
            <Bell size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Stay on track</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Enable alerts for task start & end</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnable}
            className="text-xs font-bold px-3.5 py-2 rounded-full transition-all active:scale-95"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Allow
          </button>
          <button
            onClick={() => setShow(false)}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
