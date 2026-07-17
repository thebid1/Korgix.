import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface InstallPromptProps {
  onInstall?: () => void;
}

export const InstallPrompt = ({ onInstall }: InstallPromptProps) => {
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      onInstall?.();
    }

    setDeferredPrompt(null);
  };

  const canInstall = os === 'android' && deferredPrompt !== null;

  return (
    <div className="p-6 rounded-2xl text-center" style={{ background: 'var(--surface)' }}>
      <h2 className="text-xl font-bold mb-4">App Installation Required</h2>
      
      {os === 'ios' ? (
        <div className="space-y-4">
          <p>To use Korgix on your iPhone, you must add it to your Home Screen.</p>
          <div className="p-4 rounded-lg text-left text-sm" style={{ background: 'var(--surface-light)', color: 'var(--text)' }}>
            <p>1. Tap the <strong>Share</strong> button at the bottom of Safari (the square with an arrow pointing up).</p>
            <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
            <p>3. Open Korgix from your new home screen icon!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p>For the best experience and background notifications, please install the app.</p>
          <button
            onClick={handleInstall}
            disabled={!canInstall}
            className="w-full py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{ background: 'var(--accent)', color: 'var(--inverse-text)' }}
          >
            {canInstall ? 'Install Korgix' : 'Install available from browser menu'}
          </button>
        </div>
      )}
    </div>
  );
};
