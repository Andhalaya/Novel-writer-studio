// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTqINgCXOqZYf5Y0i-NkBpPq76MCjfzCY",
  authDomain: "novel-writer-9fe0b.firebaseapp.com",
  projectId: "novel-writer-9fe0b",
  storageBucket: "novel-writer-9fe0b.firebasestorage.app",
  messagingSenderId: "869294343586",
  appId: "1:869294343586:web:d82f8a933d7354b5819efb",
  measurementId: "G-8039W7XRNS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
const analytics = getAnalytics(app);