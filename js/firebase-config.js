// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkgEiYYlmpMe0NLewulheovlTQMz5C980",
  authDomain: "bein-42f9e.firebaseapp.com",
  projectId: "bein-42f9e",
  storageBucket: "bein-42f9e.firebasestorage.app",
  messagingSenderId: "143741167050",
  appId: "1:143741167050:web:922d3a0cddb40f67b21b33",
  measurementId: "G-JH198SKCFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);

// Export the services for use in other files
export { app, db, auth };
