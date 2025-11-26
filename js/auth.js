import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// Authentication system
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.setupAuthListener();
    }

    // Setup authentication state listener
    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.isAuthenticated = true;
                this.currentUser = user;
                localStorage.setItem('adminAuth', 'true');
                console.log('User is signed in:', user.email);
            } else {
                this.isAuthenticated = false;
                this.currentUser = null;
                localStorage.removeItem('adminAuth');
                console.log('User is signed out');
            }
        });
    }

    // Firebase authentication
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.isAuthenticated = true;
            this.currentUser = userCredential.user;
            localStorage.setItem('adminAuth', 'true');
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'البريد الإلكتروني غير صحيح';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'المستخدم غير موجود';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'كلمة المرور غير صحيحة';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'محاولات تسجيل دخول كثيرة، حاول لاحقاً';
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async logout() {
        try {
            await signOut(auth);
            this.isAuthenticated = false;
            this.currentUser = null;
            localStorage.removeItem('adminAuth');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    checkAuth() {
        const storedAuth = localStorage.getItem('adminAuth');
        this.isAuthenticated = storedAuth === 'true' && auth.currentUser !== null;
        return this.isAuthenticated;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global auth instance
const authManager = new AuthManager();

export { authManager };
