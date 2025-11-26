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
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    
    // Initialize Firebase services
    const db = firebase.firestore();
    const auth = firebase.auth();
    
    // إعدادات Firestore
    db.settings({
        timestampsInSnapshots: true
    });
    
    // اختبار الاتصال
    db.collection('channels').limit(1).get()
        .then(() => console.log('Firestore connection successful'))
        .catch(error => console.error('Firestore connection failed:', error));
        
} catch (error) {
    console.error("Firebase initialization error:", error);
}
