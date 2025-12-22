// js/firebase-config.js
console.log("تهيئة Firebase...");

// تكوين Firebase - يجب أن يكون مطابقًا لجميع الصفحات
const firebaseConfig = {
    apiKey: "AIzaSyAkgEiYYlmpMe0NLewulheovlTQMz5C980",
    authDomain: "bein-42f9e.firebaseapp.com",
    projectId: "bein-42f9e",
    storageBucket: "bein-42f9e.firebasestorage.app",
    messagingSenderId: "143741167050",
    appId: "1:143741167050:web:922d3a0cddb40f67b21b33",
    measurementId: "G-JH198SKCFS"
};

// تهيئة واحدة موحدة لجميع الصفحات
function initializeFirebaseOnce() {
    try {
        // تجنب التهيئة المزدوجة
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK غير محمل!");
            return null;
        }
        
        // إذا تمت التهيئة مسبقاً، استخدم التطبيق الموجود
        if (firebase.apps.length > 0) {
            console.log("✅ Firebase مهيأ مسبقاً");
            return firebase.apps[0];
        }
        
        // التهيئة الأولى والوحيدة
        console.log("🚀 تهيئة Firebase لأول مرة...");
        const app = firebase.initializeApp(firebaseConfig);
        
        // جعل Firestore و Auth متاحين عالمياً
        window.firestoreDB = firebase.firestore(app);
        window.firebaseAuth = firebase.auth(app);
        
        console.log("✅ تم تهيئة Firebase بنجاح");
        return app;
        
    } catch (error) {
        console.error("❌ خطأ في تهيئة Firebase:", error);
        return null;
    }
}

// دالة للحصول على قاعدة البيانات
function getFirebaseDB() {
    if (!window.firestoreDB) {
        initializeFirebaseOnce();
    }
    return window.firestoreDB;
}

// دالة للحصول على نظام المصادقة
function getFirebaseAuth() {
    if (!window.firebaseAuth) {
        initializeFirebaseOnce();
    }
    return window.firebaseAuth;
}

// جعل الدوال متاحة عالمياً
window.initializeFirebase = initializeFirebaseOnce;
window.getFirebaseDB = getFirebaseDB;
window.getFirebaseAuth = getFirebaseAuth;

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 جاري تهيئة Firebase...");
    initializeFirebaseOnce();
});