// Firebase configuration
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
try {
    console.log("Initializing Firebase...");
    
    // Check if Firebase is already initialized
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    } else {
        console.log("Firebase already initialized");
    }
    
    // Initialize Firebase services
    const db = firebase.firestore();
    const auth = firebase.auth();
    
    // Firestore settings
    db.settings({
        timestampsInSnapshots: true
    });
    
    console.log("Firebase services initialized successfully");
    console.log("Database:", db ? "✓ Available" : "✗ Not available");
    console.log("Auth:", auth ? "✓ Available" : "✗ Not available");
    
    // Make services globally available
    window.db = db;
    window.auth = auth;
    
} catch (error) {
    console.error("Firebase initialization error:", error);
}
