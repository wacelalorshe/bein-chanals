// Authentication system
class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.setupAuthListener();
    }

    // Setup authentication state listener
    setupAuthListener() {
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
    }

    // Firebase authentication
    async login(email, password) {
        try {
            console.log('Attempting login for:', email);
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
            }
            
            return { success: false, error: errorMessage };
        }
    }

    async logout() {
        try {
            await auth.signOut();
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
        this.isAuthenticated = storedAuth === 'true' && auth.currentUser !== null;
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
        // Set current year
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Load channels with real-time listener
        this.setupChannelsListener();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('App initialized successfully');
    }

    setupChannelsListener() {
        try {
            const channelsContainer = document.getElementById('channelsContainer');
            channelsContainer.innerHTML = '<div class="loading">جاري تحميل القنوات...</div>';
            
            // Set up real-time listener for channels
            this.unsubscribeChannels = db.collection('channels')
                .orderBy('order')
                .onSnapshot((snapshot) => {
                    console.log('Channels updated, total:', snapshot.size);
                    
                    if (!snapshot.empty) {
                        this.channels = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        this.renderChannels();
                    } else {
                        // Fallback to default channels only if no channels exist
                        this.loadDefaultChannels();
                    }
                }, (error) => {
                    console.error('Error in channels listener:', error);
                    channelsContainer.innerHTML = '<div class="loading">خطأ في تحميل القنوات</div>';
                    
                    // Try to load default channels on error
                    setTimeout(() => {
                        this.loadDefaultChannels();
                    }, 2000);
                });
                
        } catch (error) {
            console.error('Error setting up channels listener:', error);
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
                url: 'xmtv://WwoKICAKICAKIAogIAogICJodHRwczovL2JkZDAwLjRyb3V3YW5kYS1zaG9wLnN0b3JlL2xpdmUvMzEwMDk5ODgwMDUvaW5kZXgubTN1OD90PWIydm9SNHZJREE5WGItcUJrenZrX3cmZT0xNzU4MTE2NTM2fGNhc3Q9ZmFsc2V8bmFtZT0nICAgICAgWUMgKDI0NFApICAgICAg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMS8xNy83MDY1ODM2NDQucG5nIiwKICAKICAiaHR0cDovLzE3Ni4xMTkuMjkuNTQvMTMxZjI2ZDktYWZiMC00ODBlLTg2OTAtZTQ2MDA3ZGU5ZmM4Lm0zdTh8Y2FzdD1mYWxzZXxuYW1lPScgICAgICBudW1iZXIgKDM2MFApICAgICAg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMS8xNy83MDY1ODM2NDQucG5nIiwKICAKICAKICAiaHR0cDovLzE3Ni4xMTkuMjkuNTQvYmIxYTQxMTktNjVmOS00MGRjLTk4NjctMTI3ZjJhNjk3M2QxLm0zdTh8ZGV2aWNlY2FuYXJ5PWZhbHNlfGNhc3Q9ZmFsc2V8bmFtZT0nICAgbnVtYmVyICAoNDgwUCkg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMS8xNy83MDY1ODM2NDQucG5nIiwKICAKICAKICAKICAKICAiaHR0cHM6Ly9jZG5mZXN0LmNvbS9HMS03MjBwL3ZpZGVvLm0zdTg/dG9rZW49MlpSdnVtNVJ4SXdlRzNkZXZpY2VjYW5hcnk9ZmFsc2V8Y2FzdD1mYWxzZXxuYW1lPScgICAgRzEgKDcyMFApICDigJh8YXBwbG9nb2JsPWh0dHBzOi8vd3d3Mi4wenowLmNvbS8yMDI1LzAzLzMxLzE3LzcwNjU4MzY0NC5wbmciLAogIAogIAogIAogIAogIAoKCgoKICAgICJodHRwczovL2Rva2tvMW5ldy5uZXdrc28ucnUvZG9ra28xL3ByZW1pdW05MS9tb25vLm0zdTh8dXNlci1hZ2VudD1Nb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTI5LjAuMC4wIFNhZmFyaS81MzcuMzZ8cmVmZXJlcj1odHRwczovL25ld2VtYmVkcGxheS54eXovfG5hbWU9ICcgICAgIERPSyAoNzIwUCkgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIsCiAgCiAgImh0dHBzOi8vd28uY21hLmZvb3RiYWxsaWkuaXIvaGxzMi9iMi5tM3U4fGNhc3Q9ZmFsc2V8bmFtZT0nICAgICAgV0FDRUwtVFYgICAgICDigJh8YXBwbG9nb2JsPWh0dHBzOi8vd3d3Mi4wenowLmNvbS8yMDI1LzAzLzMxLzE3LzcwNjU4MzY0NC5wbmciLAogIAoKCiJodHRwczovL2dpdGh1Yi5jb20vbzJ3cy94cG9sYS1wbGF5ZXIvcmF3L3JlZnMvaGVhZHMvbWFpbi8xLm0zdTh8dXNlci1hZ2VudD1Nb3ppbGxhLy81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxNl82IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0Ly82MDUuMS4xNSAoS0hUTUwsIGxpa2UgR2Vja28pIFZlcnNpb24vLzE2LjYgTW9iaWxlLy8xNUUxNDggU2FmYXJpLy82MDQuMXxyZWZlcmVyPWh0dHBzOi8vd3d3LnlhcmlnYS5saXZlL3xuYW1lPSAnICAgICB4cCAo2YXYqti52K/YrykgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIKXQ==',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                downloadUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                order: 1
            },
            {
                id: 'default-2',
                name: 'bein sport 2',
                image: 'https://via.placeholder.com/200x100/2F2562/FFFFFF?text=BEIN+2',
                url: 'xmtv://WwoKICAKICAKICJodHRwOi8vMTM1LjEyNS4xMDkuNzM6OTAwMC9iZWluc3BvcnQyXy5tM3U4fGNhc3Q9ZmFsc2V8bmFtZT0nICAgV0FDRUwtVFYgICgzNjBQKSAgICAgIOKAmHxhcHBsb2dvYmw9IGh0dHBzOi8vaS5wb3N0aW1nLmNjL2h2dzdCMzhLL3dhY2VsLXR2LnBuZyAiLAogIAogICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vS0ROVFYvVFZUL3JlZnMvaGVhZHMvbWFpbi92cDIubTN1OHxjYXN0PWZhbHNlfG5hbWU9JyAgV0FDRUwtVFYgICjZhdiq2LnYr9iv2KfZhNis2YjYr9in2KopICAgICAg4oCYfGFwcGxvZ29ibD0gaHR0cHM6Ly9pLnBvc3RpbWcuY2MvaHZ3N0CMzhLL3dhY2VsLXR2LnBuZyAiLAogIAogIAogIAogIAogIAogIAogICJodHRwczovL2FmLmF5YXNzcG9ydC5pci9obHMyL2JlaW4yLm0zdTh8Y2FzdD1mYWxzZXxuYW1lPScgICAgICBXQUNFTC1UViAgICAgIOKAmHxhcHBsb2dvYmw9IGh0dHBzOi8vaS5wb3N0aW1nLmNjL2h2dzdCMzhLL3dhY2VsLXR2LnBuZyAiLAogIAogICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYWx5c2pjNy1kb3QvbWF0aC9yZWZzL2hlYWRzL21haW4vdG8yLm0zdTh8Y2FzdD1mYWxzZXxuYW1lPScgICAgICjZhdiq2LnYr9ivINin2YTYrNmI2K/Yp9iqKSAg4oCYfGFwcGxvZ29ibD0gaHR0cHM6Ly9pLnBvc3RpbWcuY2MvaHZ3N0CMzhLL3dhY2VsLXR2LnBuZyAiLAogIAogIAogIAogIAogICJodHRwczovL2NkbmZlc3QuY29tL0cyLTQ4MHAtY2FzdC9wbGF5bGlzdC5tM3U4fG9yaWdpbj1odHRwczovL3d3dy55YXJpZ2EubGl2ZXx1c2VyLWFnZW50PU1vemlsbGEvNS4wIChpUGhvbmU7IENQVSBpUGhvbmUgT1MgMTZfNiBsaWtlIE1hYyBPUyBYKCBBcHBsZVdlYktpdC82MDUuMS4xNSAoS0hUTUwsIGxpa2UgR2Vja28pIFZlcnNpb24vMTYuNiBNb2JpbGUvMTVFMTQ4IFNhZmFyaS82MDQuMXxyZWZlcmVyPWh0dHBzOi8vd3d3LnlhcmlnYS5saXZlL3xjYXN0PWZhbHNlfG5hbWU9JyAgICAgV0FDRUwtVFYgICAgKNiI2YLYqiDYp9mE2YXZqNin2LHYp9ipKSAg4oCYfGFwcGxvZ29ibD1odHRwczovL2kucG9zdGltZy5jYy9odnc3QjM4Sy93YWNlbC10di5wbmcgIiwKICAKCgoKCiAgICAiIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hbHlzamM3LWRvdC9pcHR2L3JlZnMvaGVhZHMvbWFpbi9ubS5tM3U4fHVzZXItYWdlbnQ9TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyOS4wLjAuMCBTYWZhcmkvNTM3LjM2fHJlZmVyZXI9aHR0cHM6Ly9uZXdlbWJlZHBsYXkueHl6L3xuYW1U9ICcgICA0SyAgIAo==',
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
        window.location.href = channel.url;
        
        // Show install modal if needed
        setTimeout(() => {
            if (localStorage.getItem('appInstallPrompt') !== 'disabled') {
                this.showInstallModal(channel);
            }
        }, 2000);
    }

    showInstallModal(channel) {
        const modal = document.getElementById('installModal');
        modal.style.display = "block";
        
        document.getElementById('confirmInstall').onclick = () => {
            window.open(channel.downloadUrl, '_blank');
            this.closeModal();
        }
        
        document.getElementById('cancelInstall').onclick = () => {
            this.closeModal();
        }
        
        document.getElementById('dontShowAgain').onclick = function() {
            if (this.checked) {
                localStorage.setItem('appInstallPrompt', 'disabled');
            } else {
                localStorage.removeItem('appInstallPrompt');
            }
        }
    }

    closeModal() {
        document.getElementById('installModal').style.display = "none";
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
            document.getElementById('adminPassword').value = '';
            document.getElementById('loginError').style.display = 'none';
        }
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Login toggle button
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
        } else {
            console.error('Login toggle button not found!');
        }

        // Login button in modal
        const loginButton = document.getElementById('loginButton');
        if (loginButton) {
            loginButton.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const email = document.getElementById('adminEmail').value;
                const password = document.getElementById('adminPassword').value;
                
                console.log('Login attempt with email:', email);
                
                if (!email || !password) {
                    document.getElementById('loginError').textContent = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
                    document.getElementById('loginError').style.display = 'block';
                    return;
                }
                
                const result = await authManager.login(email, password);
                
                if (result.success) {
                    console.log('Login successful, redirecting to admin');
                    this.hideAdminLogin();
                    window.location.href = 'admin.html';
                } else {
                    document.getElementById('loginError').textContent = result.error;
                    document.getElementById('loginError').style.display = 'block';
                }
            });
        }

        // Cancel login
        const cancelLogin = document.getElementById('cancelLogin');
        if (cancelLogin) {
            cancelLogin.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideAdminLogin();
            });
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
                    document.getElementById('loginButton').click();
                }
            });
        }

        console.log('Event listeners setup completed');
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
