import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window.navigator as any).standalone;

const isAndroid = () =>
  /android/i.test(navigator.userAgent);

const isInStandaloneMode = () =>
  (window.navigator as any).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return; // Already installed, show nothing

    // Android: wait for browser prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show manual instructions
    if (isIOS()) setShowIOS(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowAndroid(false);
    setDeferredPrompt(null);
  };

  if (showIOS) return (
    <div className="px-5 pt-4 animate-fade-in">
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Share size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Install Korgix</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Works offline, no browser chrome</p>
            </div>
          </div>
          <button onClick={() => setShowIOS(false)} className="p-1" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
          Tap <span className="font-bold px-1" style={{ color: 'var(--accent)' }}>Share ↑</span> then
          <span className="font-bold px-1" style={{ color: 'var(--accent)' }}>"Add to Home Screen"</span>
        </div>
      </div>
    </div>
  );

  if (showAndroid) return (
    <div className="px-5 pt-3 animate-fade-in">
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <Download size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Install Korgix</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Works offline, always ready</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAndroidInstall}
            className="text-xs font-bold px-3.5 py-2 rounded-full active:scale-95"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            Install
          </button>
          <button onClick={() => setShowAndroid(false)} className="p-2" style={{ color: 'var(--text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return null;
};