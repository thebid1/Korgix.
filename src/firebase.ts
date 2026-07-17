import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { getMessaging, onMessage } from 'firebase/messaging';

// Read configuration from Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Messaging (only if supported)
let messagingInstance: any = null;
if ('serviceWorker' in navigator && 'PushManager' in window) {
  try {
    messagingInstance = getMessaging(app);
    console.log('✅ Firebase Messaging initialized');
    
    // Handle foreground messages
    onMessage(messagingInstance, (payload) => {
      console.log('📩 Message received in foreground:', payload);
      if (payload.notification) {
        new Notification(payload.notification.title || 'Korgix', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/app/icons/Korgix.png',
          badge: '/app/icons/Korgix.png',
          tag: payload.data?.tag || 'fcm-default',
          requireInteraction: true,
          data: payload.data,
        });
      }
    });
  } catch (err) {
    console.error('❌ Messaging initialization failed:', err);
  }
}

export const messaging = messagingInstance;