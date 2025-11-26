import { db, authManager } from './firebase-config.js';
import { collection, getDocs, orderBy, query } from "firebase/firestore";

// Main application
class BeinSportApp {
    constructor() {
        this.channels = [];
        this.init();
    }

    async init() {
        // Set current year
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Load channels
        await this.loadChannels();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('App initialized successfully');
    }

    async loadChannels() {
        try {
            const channelsContainer = document.getElementById('channelsContainer');
            channelsContainer.innerHTML = '<div class="loading">جاري تحميل القنوات...</div>';
            
            // Load from Firebase
            const channelsQuery = query(collection(db, 'channels'), orderBy('order'));
            const snapshot = await getDocs(channelsQuery);
            
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
        this.channels = [
            {
                id: '1',
                name: 'bein sport 1',
                image: 'https://via.placeholder.com/100',
                url: 'xmtv://WwoKICAKICAKIAogIAogICJodHRwczovL2JkZDAwLjRyb3V3YW5kYS1zaG9wLnN0b3JlL2xpdmUvMzEwMDk5ODgwMDUvaW5kZXgubTN1OD90PWIydm9SNHZJREE5WGItcUJrenZrX3cmZT0xNzU4MTE2NTM2fGNhc3Q9ZmFsc2V8bmFtZT0nICAgICAgWUMgKDI0NFApICAgICAg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMS8xNy83MDY1ODM2NDQucG5nIiwKICAKICAiaHR0cDovLzE3Ni4xMTkuMjkuNTQvMTMxZjI2ZDktYWZiMC00ODBlLTg2OTAtZTQ2MDA3ZGU5ZmM4Lm0zdTh8Y2FzdD1mYWxzZXxuYW1lPScgICAgICBudW1iZXIgKDM2MFApICAgICAg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMvMTcvNzA2NTgzNjQ0LnBuZyIsCiAgCiAgCiAgImh0dHA6Ly8xNzYuMTE5LjI5LjU0L2JiMWE0MTE5LTY1ZjktNDBkYy05ODY3LTEyN2YyYTY5NzNkMS5tM3U4fGRldmljZWNhbmFyeT1mYWxzZXxjYXN0PWZhbHNlfG5hbWU9JyAgIG51bWJlciAgKDQ4MFApIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIsCiAgCiAgCiAgCiAgCiAgImh0dHBzOi8vY2RuZmVzdC5jb20vRzEtNzIwcC92aWRlby5tM3U4P3Rva2VuPTJaUnZ1bTVSeEl3ZUczZGV2aWNlY2FuYXJ5PWZhbHNlfGNhc3Q9ZmFsc2V8bmFtZT0nICAgICBHMSAoNzIwUCkgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIsCiAgCiAgCiAgCiAgCiAgCgoKCgogICAgImh0dHBzOi8vZG9ra28xbmV3Lm5ld2tzby5ydS9kb2trbzEvcHJlbWl1bTkxL21vbm8ubTN1OHx1c2VyLWFnZW50PU1vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjkuMC4wLjAgU2FmYXJpLzUzNy4zNnxyZWZlcmVyPWh0dHBzOi8vbmV3ZW1iZWRwbGF5Lnh5ei98bmFtZT0gJyAgICAgIERPSyAoNzIwUCkgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIsCiAgCiAgImh0dHBzOi8vd28uY21hLmZvb3RiYWxsaWkuaXIvaGxzMi9iMi5tM3U4fGNhc3Q9ZmFsc2V8bmFtZT0nICAgICAgV0FDRUwtVFYgICAgICDigJh8YXBwbG9nb2JsPWh0dHBzOi8vd3d3Mi4wenowLmNvbS8yMDI1LzAzLzMxLzE3LzcwNjU4MzY0NC5wbmciLAogIAoKCiJodHRwczovL2dpdGh1Yi5jb20vbzJ3cy94cG9sYS1wbGF5ZXIvcmF3L3JlZnMvaGVhZHMvbWFpbi8xLm0zdTh8dXNlci1hZ2VudD1Nb3ppbGxhLy81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxNl82IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0Ly82MDUuMS4xNSAoS0hUTUwsIGxpa2UgR2Vja28pIFZlcnNpb24vLzE2LjYgTW9iaWxlLy8xNUUxNDggU2FmYXJpLy82MDQuMXxyZWZlcmVyPWh0dHBzOi8vd3d3LnlhcmlnYS5saXZlL3xuYW1lPSAnICAgICB4cCAo2YXYqti52K/YrykgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIKXQ==',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                downloadUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                order: 1
            }
        ];
        this.renderChannels();
    }

    renderChannels() {
        const container = document.getElementById('channelsContainer');
        
        if (this.channels.length === 0) {
            container.innerHTML = '<div class="loading">لا توجد قنوات متاحة</div>';
            return;
        }

        container.innerHTML = this.channels.map(channel => `
            <div class="channel-card" data-channel-id="${channel.id}">
                <div class="channel-logo">
                    <img src="${channel.image}" alt="${channel.name}" 
                         onerror="this.src='https://via.placeholder.com/100?text=No+Image'">
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    new BeinSportApp();
});
