/**
 * Firebase Configuration (Lazy-loaded)
 * 
 * Replace these placeholder values with your actual Firebase project credentials.
 * Get them from: Firebase Console → Project Settings → General → Your apps → Web app
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// VAPID key for push notifications
// Get it from: Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
export const VAPID_KEY = "BEhDB-55Fu25URHYBsldVjalW_7lPb-8s5fhQstpiLzojjnOI2t_Jp_kPVIskNz_IdvNBVf5HkNNX8P2BNF8iGQ";

let _messaging = null;
let _initPromise = null;

/**
 * Lazily initialize Firebase Messaging.
 * Dynamic import prevents firebase from being bundled eagerly,
 * which avoids duplicate-React issues in Vite.
 */
export async function getFirebaseMessaging() {
  if (_messaging) return _messaging;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getMessaging } = await import('firebase/messaging');
      const app = initializeApp(firebaseConfig);
      _messaging = getMessaging(app);
      console.log('[Firebase] Messaging initialized (lazy)');
      return _messaging;
    } catch (e) {
      console.warn('[Firebase] Messaging not supported:', e.message);
      return null;
    }
  })();

  return _initPromise;
}