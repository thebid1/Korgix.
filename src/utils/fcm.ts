import { messaging } from '../firebase';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getToken, isSupported } from 'firebase/messaging';

/**
 * Request FCM token and store it in Firestore
 * Call this after user authenticates
 */
export const initializeFCM = async (): Promise<string | null> => {
  console.log('🔔 initializeFCM starting...');
  console.log('messaging:', messaging);
  console.log('Notification permission:', Notification.permission);
  console.log('VAPID key:', import.meta.env.VITE_FIREBASE_VAPID_KEY ? '✅ Set' : '❌ MISSING');
  
  if (!messaging) {
    console.error('❌ FCM not available in this browser');
    return null;
  }

  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
    console.error('❌ VAPID key not set! Add VITE_FIREBASE_VAPID_KEY to .env');
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    console.error('❌ FCM not supported in this browser');
    return null;
  }

  try {
    console.log('📍 Getting FCM token...');
    
    // Reuse the existing app service worker so Firebase does not register a
    // second one at the same scope.
    const serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    });

    if (!token) {
      console.warn('⚠️ No token returned - user may need to grant permission');
      return null;
    }

    console.log('✅ Token received:', token.slice(0, 20) + '...');
    console.log('👤 Current user:', auth.currentUser?.uid);

    if (auth.currentUser) {
      // Save token to Firestore under user's document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      console.log('💾 Saving to Firestore:', userRef.path);
      
      await setDoc(
        userRef,
        {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log('✅ FCM token saved successfully!');
      return token;
    } else {
      console.warn('⚠️ No authenticated user');
    }
  } catch (error: any) {
    console.error('❌ Failed to initialize FCM:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }

  return null;
};

/**
 * Request notification permission (shows browser prompt)
 */
export const requestFCMPermission = async (): Promise<boolean> => {
  if (!messaging) return false;

  try {
    // If already granted, just initialize FCM
    if (Notification.permission === 'granted') {
      await initializeFCM();
      return true;
    }
    
    // Only request if not already decided
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await initializeFCM();
        return true;
      }
    }
  } catch (error) {
    console.error('Permission request failed:', error);
  }

  return false;
};
