import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// IMPORTANT: Fill in your real Firebase credentials below
const firebaseConfig = {
  apiKey: "AIzaSyCKKXnprBnL2JmPjmCixfEYJjVGWahnKnE",
  authDomain: "allplay-se.firebaseapp.com",
  projectId: "allplay-se",
  storageBucket: "allplay-se.firebasestorage.app",
  messagingSenderId: "489338885498",
  appId: "1:489338885498:web:0028c82da13fefbb9297dc"
};

const app = initializeApp(firebaseConfig);

let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (e) {
    console.warn('Firebase Messaging kunde inte initieras:', e);
  }
}

export { messaging, getToken, onMessage };
export default app;