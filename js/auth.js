import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

// Authentication system
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
    }

    // Firebase authentication
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.isAuthenticated = true;
            this.currentUser = userCredential.user;
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminEmail', email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await signOut(auth);
            this.isAuthenticated = false;
            this.currentUser = null;
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminEmail');
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    checkAuth() {
        const storedAuth = localStorage.getItem('adminAuth');
        this.isAuthenticated = storedAuth === 'true' && auth.currentUser !== null;
        return this.isAuthenticated;
    }

    // Listen for auth state changes
    setupAuthListener(callback) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.isAuthenticated = true;
                this.currentUser = user;
                localStorage.setItem('adminAuth', 'true');
            } else {
                this.isAuthenticated = false;
                this.currentUser = null;
                localStorage.removeItem('adminAuth');
            }
            if (callback) callback(this.isAuthenticated, user);
        });
    }
}

// Create global auth instance
const authManager = new AuthManager();

export { authManager };
