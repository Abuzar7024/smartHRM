// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFT_NjLFhDOOVjzAFBnMJSz8ZORfx3sG8",
  authDomain: "smarthr-96738.firebaseapp.com",
  projectId: "smarthr-96738",
  storageBucket: "smarthr-96738.firebasestorage.app",
  messagingSenderId: "545226072346",
  appId: "1:545226072346:web:f461d3e294a67c2e3f4ca3",
  measurementId: "G-E02J52Q54Z"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize analytics only on client side
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, storage, analytics };
