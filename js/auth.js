// Authentication system
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.adminPassword = "Ww735981122"; // Change this password
    }

    // Simple password verification (in production, use Firebase Authentication)
    verifyPassword(password) {
        return password === this.adminPassword;
    }

    login(password) {
        if (this.verifyPassword(password)) {
            this.isAuthenticated = true;
            localStorage.setItem('adminAuth', 'true');
            return true;
        }
        return false;
    }

    logout() {
        this.isAuthenticated = false;
        localStorage.removeItem('adminAuth');
    }

    checkAuth() {
        const storedAuth = localStorage.getItem('adminAuth');
        this.isAuthenticated = storedAuth === 'true';
        return this.isAuthenticated;
    }
}

// Create global auth instance
const authManager = new AuthManager();
