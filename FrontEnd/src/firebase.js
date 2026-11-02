import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId'];
export const isFirebaseConfigured = requiredConfig.every(
    key => Boolean(firebaseConfig[key])
);

const app = isFirebaseConfigured
    ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig))
    : null;

export const firebaseAuth = app ? getAuth(app) : null;
