// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyBM3e39QRd-lJ7-vZjq3TaQaZ1uxRlNECo",
    authDomain: "weatherapp-b2cf7.firebaseapp.com",
    databaseURL: "https://weatherapp-b2cf7-default-rtdb.firebaseio.com",
    projectId: "weatherapp-b2cf7",
    storageBucket: "weatherapp-b2cf7.firebasestorage.app",
    messagingSenderId: "994911421184",
    appId: "1:994911421184:web:48f270d04d2589155329e5",
    measurementId: "G-V8ML3D3N5G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

export default app;
