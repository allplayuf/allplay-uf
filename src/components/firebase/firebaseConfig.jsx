/**
 * Firebase Configuration
 * 
 * Replace these placeholder values with your actual Firebase project credentials.
 * Get them from: Firebase Console → Project Settings → General → Your apps → Web app
 */

import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

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
export const VAPID_KEY = "YOUR_VAPID_KEY";

const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = getMessaging(app);
  console.log('[Firebase] Messaging initialized');
} catch (e) {
  console.warn('[Firebase] Messaging not supported in this browser:', e.message);
}

export { app, messaging };