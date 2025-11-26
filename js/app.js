// Authentication system
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.setupAuthListener();
    }

    // Setup authentication state listener
    setupAuthListener() {
        if (typeof auth !== 'undefined') {
            auth.onAuthStateChanged((user) => {
                console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
                if (user) {
                    this.isAuthenticated = true;
                    this.currentUser = user;
                    localStorage.setItem('adminAuth', 'true');
                    localStorage.setItem('adminEmail', user.email);
                    console.log('User authenticated:', user.email);
                } else {
                    this.isAuthenticated = false;
                    this.currentUser = null;
                    localStorage.removeItem('adminAuth');
                    localStorage.removeItem('adminEmail');
                    console.log('User signed out');
                }
            });
        } else {
            console.error('Firebase auth is not defined');
        }
    }

    // Firebase authentication
    async login(email, password) {
        try {
            console.log('Attempting login for:', email);
            if (typeof auth === 'undefined') {
                throw new Error('Firebase auth is not available');
            }
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            this.isAuthenticated = true;
            this.currentUser = userCredential.user;
            localStorage.setItem('adminAuth', 'true');
            localStorage.setItem('adminEmail', email);
            console.log('Login successful for:', email);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'حدث خطأ أثناء تسجيل الدخول';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'البريد الإلكتروني غير صحيح';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'هذا الحساب معطل';
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
                case 'auth/network-request-failed':
                    errorMessage = 'خطأ في الشبكة، تحقق من اتصال الإنترنت';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async logout() {
        try {
            if (typeof auth !== 'undefined') {
                await auth.signOut();
            }
            this.isAuthenticated = false;
            this.currentUser = null;
            localStorage.removeItem('adminAuth');
            localStorage.removeItem('adminEmail');
            console.log('Logout successful');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    checkAuth() {
        const storedAuth = localStorage.getItem('adminAuth');
        this.isAuthenticated = storedAuth === 'true' && (typeof auth !== 'undefined' ? auth.currentUser !== null : false);
        console.log('Auth check:', this.isAuthenticated ? 'Authenticated' : 'Not authenticated');
        return this.isAuthenticated;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Create global auth instance
const authManager = new AuthManager();

// Main application
class BeinSportApp {
    constructor() {
        this.channels = [];
        this.unsubscribeChannels = null;
        this.init();
    }

    async init() {
        console.log('Initializing BeinSport App...');
        
        // Set current year
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Setup event listeners first
        this.setupEventListeners();
        
        // Then load channels
        await this.loadChannels();
        
        console.log('App initialized successfully');
    }

    async loadChannels() {
        try {
            const channelsContainer = document.getElementById('channelsContainer');
            channelsContainer.innerHTML = '<div class="loading">جاري تحميل القنوات...</div>';
            
            if (typeof db === 'undefined') {
                throw new Error('Firebase is not available');
            }
            
            // Load from Firebase
            const snapshot = await db.collection('channels').orderBy('order').get();
            
            if (!snapshot.empty) {
                this.channels = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                this.renderChannels();
            } else {
                // Fallback to default channels
                this.loadDefaultChannels();
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            this.loadDefaultChannels();
        }
    }

    loadDefaultChannels() {
        console.log('Loading default channels...');
        this.channels = [
            {
                id: 'default-1',
                name: 'bein sport 1',
                image: 'https://via.placeholder.com/200x100/2F2562/FFFFFF?text=BEIN+1',
                url: 'xmtv://base64encodedurl1',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                downloadUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                order: 1
            },
            {
                id: 'default-2',
                name: 'bein sport 2',
                image: 'https://via.placeholder.com/200x100/2F2562/FFFFFF?text=BEIN+2',
                url: 'xmtv://base64encodedurl2',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                downloadUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                order: 2
            }
        ];
        this.renderChannels();
    }

    renderChannels() {
        const container = document.getElementById('channelsContainer');
        
        if (!this.channels || this.channels.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد قنوات متاحة</div>';
            return;
        }

        console.log('Rendering channels:', this.channels.length);
        
        container.innerHTML = this.channels.map(channel => `
            <div class="channel-card" data-channel-id="${channel.id}">
                <div class="channel-logo">
                    <img src="${channel.image}" alt="${channel.name}" 
                         onerror="this.src='https://via.placeholder.com/200x100/2F2562/FFFFFF?text=No+Image'">
                </div>
                <div class="channel-name">${channel.name}</div>
            </div>
        `).join('');

        // Add click events
        container.querySelectorAll('.channel-card').forEach(card => {
            card.addEventListener('click', () => {
                const channelId = card.getAttribute('data-channel-id');
                const channel = this.channels.find(c => c.id === channelId);
                if (channel) {
                    this.openChannel(channel);
                }
            });
        });
    }

    openChannel(channel) {
        console.log('Opening channel:', channel.name);
        // Try to open the app
        if (channel.url && channel.url !== '#') {
            window.location.href = channel.url;
        }
        
        // Show install modal if needed
        setTimeout(() => {
            if (localStorage.getItem('appInstallPrompt') !== 'disabled') {
                this.showInstallModal(channel);
            }
        }, 2000);
    }

    showInstallModal(channel) {
        const modal = document.getElementById('installModal');
        if (modal) {
            modal.style.display = "block";
            
            // Reset event listeners
            document.getElementById('confirmInstall').onclick = () => {
                if (channel.downloadUrl) {
                    window.open(channel.downloadUrl, '_blank');
                }
                this.closeModal();
            };
            
            document.getElementById('cancelInstall').onclick = () => {
                this.closeModal();
            };
            
            document.getElementById('dontShowAgain').onclick = function() {
                if (this.checked) {
                    localStorage.setItem('appInstallPrompt', 'disabled');
                } else {
                    localStorage.removeItem('appInstallPrompt');
                }
            };
        }
    }

    closeModal() {
        const modal = document.getElementById('installModal');
        if (modal) {
            modal.style.display = "none";
        }
    }

    showAdminLogin() {
        console.log('Showing admin login modal');
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'block';
            console.log('Modal displayed successfully');
        } else {
            console.error('Login modal not found!');
        }
    }

    hideAdminLogin() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.style.display = 'none';
            const adminPassword = document.getElementById('adminPassword');
            if (adminPassword) {
                adminPassword.value = '';
            }
            const loginError = document.getElementById('loginError');
            if (loginError) {
                loginError.style.display = 'none';
            }
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Login toggle button - FIXED
        const loginToggle = document.getElementById('loginToggle');
        if (loginToggle) {
            loginToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Login button clicked');
                
                if (authManager.isAuthenticated) {
                    console.log('User authenticated, redirecting to admin');
                    window.location.href = 'admin.html';
                } else {
                    console.log('User not authenticated, showing login modal');
                    this.showAdminLogin();
                }
            });
            console.log('Login toggle event listener added');
        } else {
            console.error('Login toggle button not found!');
        }

        // Login button in modal
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const emailInput = document.getElementById('adminEmail');
                const passwordInput = document.getElementById('adminPassword');
                
                if (!emailInput || !passwordInput) {
                    console.error('Login inputs not found');
                    return;
                }
                
                const email = emailInput.value;
                const password = passwordInput.value;
                
                console.log('Login attempt with email:', email);
                
                if (!email || !password) {
                    const loginError = document.getElementById('loginError');
                    if (loginError) {
                        loginError.textContent = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
                        loginError.style.display = 'block';
                    }
                    return;
                }
                
                const result = await authManager.login(email, password);
                
                if (result.success) {
                    console.log('Login successful, redirecting to admin');
                    this.hideAdminLogin();
                    window.location.href = 'admin.html';
                } else {
                    const loginError = document.getElementById('loginError');
                    if (loginError) {
                        loginError.textContent = result.error;
                        loginError.style.display = 'block';
                    }
                }
            });
            console.log('Login button event listener added');
        }

        // Cancel login
        const cancelLogin = document.getElementById('cancelLogin');
        if (cancelLogin) {
            cancelLogin.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideAdminLogin();
            });
            console.log('Cancel login event listener added');
        }

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            const installModal = document.getElementById('installModal');
            const loginModal = document.getElementById('loginModal');
            
            if (event.target === installModal) {
                this.closeModal();
            }
            if (event.target === loginModal) {
                this.hideAdminLogin();
            }
        });

        // Enter key in password field
        const adminPassword = document.getElementById('adminPassword');
        if (adminPassword) {
            adminPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const loginButton = document.getElementById('loginButton');
                    if (loginButton) {
                        loginButton.click();
                    }
                }
            });
        }

        console.log('All event listeners setup completed');
    }

    // Cleanup when leaving page
    destroy() {
        if (this.unsubscribeChannels) {
            this.unsubscribeChannels();
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.app = new BeinSportApp();
});

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.destroy();
    }
});
