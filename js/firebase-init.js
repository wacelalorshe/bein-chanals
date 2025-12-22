// ============================================
// 🔥 firebase-init.js - تهيئة موحدة لـ Firebase
// ============================================
// ⚠️ هذا الملف يعمل مرة واحدة فقط لتجنب التهيئة المزدوجة
// ============================================

// 🎯 **الجزء 1: إعدادات الاتصال بـ Firebase**
// ℹ️ هذه بيانات الاتصال بمشروعك على Firebase
const FIREBASE_SETTINGS = {
    apiKey: "AIzaSyAkgEiYYlmpMe0NLewulheovlTQMz5C980",          // 🔑 مفتاح API
    authDomain: "bein-42f9e.firebaseapp.com",                  // 🌐 مجال المصادقة
    projectId: "bein-42f9e",                                   // 🆔 معرف المشروع
    storageBucket: "bein-42f9e.firebasestorage.app",           // 📦 سلة التخزين
    messagingSenderId: "143741167050",                         // 📱 معرف المرسل
    appId: "1:143741167050:web:922d3a0cddb40f67b21b33",        // 📲 معرف التطبيق
    measurementId: "G-JH198SKCFS"                              // 📊 معرف القياس
};

// ============================================
// 🎯 **الجزء 2: دوال التهيئة الرئيسية**
// ============================================

// 🔧 **الدالة: initializeFirebaseApp()**
// 📝 **الوصف**: تهيئة Firebase مرة واحدة فقط
// 🎯 **الاستخدام**: تمنع التهيئة المزدوجة التي تسبب الأخطاء
// 📍 **المكان**: يتم استدعاؤها عند بدء أي صفحة تستخدم Firebase
function initializeFirebaseApp() {
    try {
        console.log("🔍 التحقق من وجود مكتبة Firebase...");
        
        // ❌ **التحقق 1: إذا كانت مكتبة Firebase غير محملة**
        if (typeof firebase === 'undefined') {
            console.error("❌ خطأ: مكتبة Firebase غير محملة!");
            showErrorMessage("مكتبة الاتصال بقاعدة البيانات غير محملة. يرجى تحديث الصفحة.");
            return null;
        }
        
        // ✅ **التحقق 2: إذا كان Firebase مهيأ مسبقاً**
        if (firebase.apps.length > 0) {
            console.log("✅ تم تهيئة Firebase مسبقاً، استخدام التطبيق الموجود");
            return firebase.apps[0];
        }
        
        // 🚀 **التهيئة الفعلية لـ Firebase**
        console.log("🚀 بدء تهيئة Firebase لأول مرة...");
        const firebaseApp = firebase.initializeApp(FIREBASE_SETTINGS);
        
        // 📊 **إعداد قاعدة البيانات Firestore**
        window.firestoreDB = firebase.firestore(firebaseApp);
        
        // 🔐 **إعداد نظام المصادقة Firebase Auth**
        window.firebaseAuth = firebase.auth(firebaseApp);
        
        // ⚡ **إعدادات لتحسين الأداء**
        if (window.firestoreDB.settings) {
            window.firestoreDB.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
        }
        
        console.log("✅ تم تهيئة Firebase بنجاح!");
        return firebaseApp;
        
    } catch (error) {
        // ❌ **معالجة الأخطاء**
        console.error("❌ خطأ في تهيئة Firebase:", error);
        showErrorMessage("حدث خطأ في الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت.");
        return null;
    }
}

// ============================================
// 🎯 **الجزء 3: دوال مساعدة للوصول إلى Firebase**
// ============================================

// 📊 **الدالة: getFirebaseDatabase()**
// 📝 **الوصف**: إرجاع كائن قاعدة البيانات Firestore
// 🎯 **الاستخدام**: عند الحاجة لقراءة أو كتابة بيانات
// 📍 **المكان**: أي صفحة تريد الوصول إلى قاعدة البيانات
function getFirebaseDatabase() {
    if (!window.firestoreDB) {
        console.log("⚠️ قاعدة البيانات غير مهيأة، جاري التهيئة...");
        initializeFirebaseApp();
    }
    return window.firestoreDB;
}

// 🔐 **الدالة: getFirebaseAuthentication()**
// 📝 **الوصف**: إرجاع كائن المصادقة Firebase Auth
// 🎯 **الاستخدام**: عند تسجيل الدخول أو تسجيل الخروج
// 📍 **المكان**: صفحات المصادقة والتحكم
function getFirebaseAuthentication() {
    if (!window.firebaseAuth) {
        console.log("⚠️ نظام المصادقة غير مهيأ، جاري التهيئة...");
        initializeFirebaseApp();
    }
    return window.firebaseAuth;
}

// 🔍 **الدالة: checkFirebaseConnection()**
// 📝 **الوصف**: اختبار اتصال Firebase
// 🎯 **الاستخدام**: التحقق من عمل قاعدة البيانات
// 📍 **المكان**: صفحات الإدارة والتحكم
function checkFirebaseConnection() {
    return new Promise((resolve) => {
        const db = getFirebaseDatabase();
        if (!db) {
            resolve(false);
            return;
        }
        
        // اختبار بسيط للاتصال
        db.collection('test').doc('test').get()
            .then(() => resolve(true))
            .catch(() => resolve(false));
    });
}

// ============================================
// 🎯 **الجزء 4: دوال عرض الرسائل**
// ============================================

// 💬 **الدالة: showErrorMessage()**
// 📝 **الوصف**: عرض رسالة خطأ للمستخدم
// 🎯 **الاستخدام**: عند حدوث خطأ في الاتصال
// 📍 **المكان**: جميع صفحات التطبيق
function showErrorMessage(message) {
    // إنشاء عنصر الرسالة
    const errorDiv = document.createElement('div');
    errorDiv.className = 'firebase-error-message';
    errorDiv.innerHTML = `
        <i class="uil uil-exclamation-triangle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">✕</button>
    `;
    
    // إضافة إلى الصفحة
    document.body.appendChild(errorDiv);
    
    // إزالة بعد 5 ثواني
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// 💬 **الدالة: showSuccessMessage()**
// 📝 **الوصف**: عرض رسالة نجاح للمستخدم
// 🎯 **الاستخدام**: عند نجاح عملية الاتصال
// 📍 **المكان**: صفحات الإدارة والتحكم
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'firebase-success-message';
    successDiv.innerHTML = `
        <i class="uil uil-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">✕</button>
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

// ============================================
// 🎯 **الجزء 5: جعل الدوال متاحة عالمياً**
// ============================================

// 🌐 **تصدير الدوال للاستخدام في جميع الصفحات**
window.FirebaseHelper = {
    // 🔧 دوال التهيئة
    initialize: initializeFirebaseApp,
    getDatabase: getFirebaseDatabase,
    getAuth: getFirebaseAuthentication,
    checkConnection: checkFirebaseConnection,
    
    // 💬 دوال الرسائل
    showError: showErrorMessage,
    showSuccess: showSuccessMessage,
    
    // ⚙️ الإعدادات
    config: FIREBASE_SETTINGS
};

// ============================================
// 🎯 **الجزء 6: التهيئة التلقائية عند تحميل الصفحة**
// ============================================

// ⏰ **الحدث: DOMContentLoaded**
// 📝 **الوصف**: تشغيل عند تحميل الصفحة بالكامل
// 🎯 **الاستخدام**: تهيئة Firebase تلقائياً
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 تم تحميل الصفحة، جاري تهيئة Firebase...");
    
    // تهيئة Firebase بعد ثانيتين للتأكد من تحميل المكتبة
    setTimeout(() => {
        const app = initializeFirebaseApp();
        if (app) {
            console.log("✅ جاهز للاتصال بقاعدة البيانات!");
        }
    }, 2000);
});

// ============================================
// 📝 **ملاحظات مهمة:**
// 1. هذا الملف يجب أن يحمل قبل أي ملف آخر يستخدم Firebase
// 2. لا تقم بتعديل إعدادات FIREBASE_SETTINGS إلا إذا تغير مشروعك
// 3. لاستخدام الدوال في صفحة HTML: window.FirebaseHelper.اسم_الدالة()
// ============================================
