import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, ArrowUpFromLine } from 'lucide-react';

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isInStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true;
};

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem('korgix-install-dismissed') === 'true') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroid(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (isIOS()) setShowIOS(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDismiss = () => {
    setShowAndroid(false);
    setShowIOS(false);
    setDismissed(true);
    localStorage.setItem('korgix-install-dismissed', 'true');
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowAndroid(false);
    setDeferredPrompt(null);
  };

  if (isInStandaloneMode() || dismissed) return null;

  if (showIOS) {
    return (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleDismiss} />
        <div className="relative w-full max-w-sm rounded-3xl p-6 animate-slide-up" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <button onClick={handleDismiss} className="absolute top-4 right-4 p-2 rounded-full" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <ArrowUpFromLine size={28} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Install Korgix</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Add to your home screen for the best experience</p>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--bg)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-elevated)' }}>
                <Share size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tap the Share button</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>At the bottom of Safari</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--bg)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--surface-elevated)' }}>
                <PlusSquare size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Select "Add to Home Screen"</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>From the share sheet</p>
              </div>
            </div>
          </div>
          <button onClick={handleDismiss} className="w-full py-3.5 rounded-2xl text-sm font-semibold active:scale-95" style={{ background: 'var(--accent)', color: '#000' }}>
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (showAndroid) {
    return (
      <div className="px-5 pt-4 animate-fade-in">
        <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Download size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Install Korgix</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Works offline, always ready</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAndroidInstall} className="text-xs font-bold px-4 py-2.5 rounded-full active:scale-95" style={{ background: 'var(--accent)', color: '#000' }}>
              Install
            </button>
            <button onClick={handleDismiss} className="p-2 rounded-full" style={{ color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};