import { useState, useEffect } from 'react';

export const InstallPrompt = () => {
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    }
  }, []);

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
          {/* For Android, you can usually trigger the native browser install prompt if you captured the beforeinstallprompt event */}
          <button className="w-full py-3 rounded-lg font-bold" style={{ background: 'var(--accent)', color: 'var(--inverse-text)' }}>
            Install Korgix
          </button>
        </div>
      )}
    </div>
  );
};