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
        
        // Check admin auth
        authManager.checkAuth();
    }

    async loadChannels() {
        try {
            const channelsContainer = document.getElementById('channelsContainer');
            channelsContainer.innerHTML = '<div class="loading">جاري تحميل القنوات...</div>';
            
            // Try to load from Firebase first
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
        this.channels = [
            {
                id: '1',
                name: 'bein sport 1',
                image: 'https://via.placeholder.com/100',
                url: 'xmtv://WwoKICAKICAKIAogIAogICJodHRwczovL2JkZDAwLjRyb3V3YW5kYS1zaG9wLnN0b3JlL2xpdmUvMzEwMDk5ODgwMDUvaW5kZXgubTN1OD90PWIydm9SNHZJREE5WGItcUJrenZrX3cmZT0xNzU4MTE2NTM2fGNhc3Q9ZmFsc2V8bmFtZT0nICAgICAgWUMgKDI0NFApICAgICAg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMS8xNy83MDY1ODM2NDQucG5nIiwKICAKICAiaHR0cDovLzE3Ni4xMTkuMjkuNTQvMTMxZjI2ZDktYWZiMC00ODBlLTg2OTAtZTQ2MDA3ZGU5ZmM4Lm0zdTh8Y2FzdD1mYWxzZXxuYW1lPScgICAgICBudW1iZXIgKDM2MFApICAgICAg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMS8xNy83MDY1ODM2NDQucG5nIiwKICAKICAKICAiaHR0cDovLzE3Ni4xMTkuMjkuNTQvYmIxYTQxMTktNjVmOS00MGRjLTk4NjctMTI3ZjJhNjk3M2QxLm0zdTh8ZGV2aWNlY2FuYXJ5PWZhbHNlfGNhc3Q9ZmFsc2V8bmFtZT0nICAgbnVtYmVyICAoNDgwUCkg4oCYfGFwcGxvZ29ibD1odHRwczovL3d3dzIuMHp6MC5jb20vMjAyNS8wMy8zMS8xNy83MDY1ODM2NDQucG5nIiwKICAKICAKICAKICAKICAiaHR0cHM6Ly9jZG5mZXN0LmNvbS9HMS03MjBwL3ZpZGVvLm0zdTg/dG9rZW49MlpSdnVtNVJ4SXdlRzNkZXZpY2VjYW5hcnk9ZmFsc2V8Y2FzdD1mYWxzZXxuYW1lPScgICAgRzEgKDcyMFApICDigJh8YXBwbG9nb2JsPWh0dHBzOi8vd3d3Mi4wenowLmNvbS8yMDI1LzAzLzMxLzE3LzcwNjU4MzY0NC5wbmciLAogIAogIAogIAogIAogIAoKCgoKICAgICJodHRwczovL2Rva2tvMW5ldy5uZXdrc28ucnUvZG9ra28xL3ByZW1pdW05MS9tb25vLm0zdTh8dXNlci1hZ2VudD1Nb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTI5LjAuMC4wIFNhZmFyaS81MzcuMzZ8cmVmZXJlcj1odHRwczovL25ld2VtYmVkcGxheS54eXovfG5hbWU9ICcgICAgIERPSyAoNzIwUCkgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIsCiAgCiAgImh0dHBzOi8vd28uY21hLmZvb3RiYWxsaWkuaXIvaGxzMi9iMi5tM3U4fGNhc3Q9ZmFsc2V8bmFtZT0nICAgICAgV0FDRUwtVFYgICAgICDigJh8YXBwbG9nb2JsPWh0dHBzOi8vd3d3Mi4wenowLmNvbS8yMDI1LzAzLzMxLzE3LzcwNjU4MzY0NC5wbmciLAogIAoKCiJodHRwczovL2dpdGh1Yi5jb20vbzJ3cy94cG9sYS1wbGF5ZXIvcmF3L3JlZnMvaGVhZHMvbWFpbi8xLm0zdTh8dXNlci1hZ2VudD1Nb3ppbGxhLy81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxNl82IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0Ly82MDUuMS4xNSAoS0hUTUwsIGxpa2UgR2Vja28pIFZlcnNpb24vLzE2LjYgTW9iaWxlLy8xNUUxNDggU2FmYXJpLy82MDQuMXxyZWZlcmVyPWh0dHBzOi8vd3d3LnlhcmlnYS5saXZlL3xuYW1lPSAnICAgICB4cCAo2YXYqti52K/YrykgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly93d3cyLjB6ejAuY29tLzIwMjUvMDMvMzEvMTcvNzA2NTgzNjQ0LnBuZyIKXQ==',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                downloadUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                order: 1
            },
            {
                id: '2',
                name: 'bein sport 2',
                image: 'https://via.placeholder.com/100',
                url: 'xmtv://WwoKICAKICAKICJodHRwOi8vMTM1LjEyNS4xMDkuNzM6OTAwMC9iZWluc3BvcnQyXy5tM3U4fGNhc3Q9ZmFsc2V8bmFtZT0nICAgV0FDRUwtVFYgICgzNjBQKSAgICAgIOKAmHxhcHBsb2dvYmw9IGh0dHBzOi8vaS5wb3N0aW1nLmNjL2h2dzdCMzhLL3dhY2VsLXR2LnBuZyAiLAogIAogICJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vS0ROVFYvVFZUL3JlZnMvaGVhZHMvbWFpbi92cDIubTN1OHxjYXN0PWZhbHNlfG5hbWU9JyAgV0FDRUwtVFYgICjZhdiq2LnYr9iv2KfZhNis2YjYr9in2KopICAgICAg4oCYfGFwcGxvZ29ibD0gaHR0cHM6Ly9pLnBvc3RpbWcuY2MvaHZ3N0IzOEsvd2FjZWwtdHYucG5nICIsCiAgCiAgCiAgCiAgCiAgCiAgCiAgImh0dHBzOi8vYWYuYXlhc3Nwb3J0LmlyL2hsczIvYmVpbjIubTN1OHxjYXN0PWZhbHNlfG5hbWU9JyAgICAgIFdBQ0VMLVRWICAgICAg4oCYfGFwcGxvZ29ibD0gaHR0cHM6Ly9pLnBvc3RpbWcuY2MvaHZ3N0IzOEsvd2FjZWwtdHYucG5nICIsCiAgCiAgImh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hbHlzamM3LWRvdC9tYXRoL3JlZnMvaGVhZHMvbWFpbi90bzIubTN1OHxjYXN0PWZhbHNlfG5hbWU9JyAgICAgKNmF2KrYudiv2K8g2KfZhNis2YjYr9in2KopICDigJh8YXBwbG9nb2JsPSBodHRwczovL2kucG9zdGltZy5jYy9odnc3QjM4Sy93YWNlbC10di5wbmcgIiwKICAKICAKICAKICAKICAiaHR0cHM6Ly9jZG5mZXN0LmNvbS9HMi00ODBwLWNhc3QvcGxheWxpc3QubTN1OHxvcmlnaW49aHR0cHM6Ly93d3cueWFyaWdhLmxpdmV8dXNlci1hZ2VudD1Nb3ppbGxhLzUuMCAoaVBob25lOyBDUFUgaVBob25lIE9TIDE2XzYgbGlrZSBNYWMgT1MgWCkgQXBwbGVXZWJLaXQvNjA1LjEuMTUgKEtIVE1MLCBsaWtlIEdlY2tvKSBWZXJzaW9uLzE2LjYgTW9iaWxlLzE1RTE0OCBTYWZhcmkvNjA0LjF8cmVmZXJlcj1odHRwczovL3d3dy55YXJpZ2EubGl2ZS98Y2FzdD1mYWxzZXxuYW1lPScgICAgIFdBQ0VMLVRWICAgICjZiNmC2Kog2KfZhNmF2KjYp9ix2KfYqSkgIOKAmHxhcHBsb2dvYmw9aHR0cHM6Ly9pLnBvc3RpbWcuY2MvaHZ3N0IzOEsvd2FjZWwtdHYucG5nICAiLAoKICAKCgoKCiAgICAiIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hbHlzamM3LWRvdC9pcHR2L3JlZnMvaGVhZHMvbWFpbi9ubS5tM3U4fHVzZXItYWdlbnQ9TW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyOS4wLjAuMCBTYWZhcmkvNTM3LjM2fHJlZmVyZXI9aHR0cHM6Ly9uZXdlbWJlZHBsYXkueHl6L3xuYW1lPSAnICAgNEsgICAoNzIwUCkgIOKAmHxhcHBsb2dvYmw9IGh0dHBzOi8vaS5wb3N0aW1nLmNjL2h2dzdCMzhLL3dhY2VsLXR2LnBuZyAiLAogIAogIAogIAoKCiJodHRwczovL2dpdGh1Yi5jb20vbzJ3cy94cG9sYS1wbGF5ZXIvcmF3L3JlZnMvaGVhZHMvbWFpbi8xLm0zdTh8dXNlci1hZ2VudD1Nb3ppbGxhLy81LjAgKGlQaG9uZTsgQ1BVIGlQaG9uZSBPUyAxNl82IGxpa2UgTWFjIE9TIFgpIEFwcGxlV2ViS2l0Ly82MDUuMS4xNSAoS0hUTUwsIGxpa2UgR2Vja28pIFZlcnNpb24vLzE2LjYgTW9iaWxlLy8xNUUxNDggU2FmYXJpLy82MDQuMXxyZWZlcmVyPWh0dHBzOi8vd3d3LnlhcmlnYS5saXZlL3xuYW1lPSAnICAgICB4cCAo2YXYqti52K/YrykgIOKAmHxhcHBsb2dvYmw9IGh0dHBzOi8vaS5wb3N0aW1nLmNjL2h2dzdCMzhLL3dhY2VsLXR2LnBuZyAiCl0=',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                downloadUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player',
                order: 2
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
        document.getElementById('loginModal').style.display = 'block';
    }

    hideAdminLogin() {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
    }

    setupEventListeners() {
        // Admin toggle
        document.getElementById('adminToggle').addEventListener('click', () => {
            if (authManager.isAuthenticated) {
                window.location.href = 'admin.html';
            } else {
                this.showAdminLogin();
            }
        });

        // Login button
        document.getElementById('loginButton').addEventListener('click', () => {
            const password = document.getElementById('adminPassword').value;
            
            if (authManager.login(password)) {
                this.hideAdminLogin();
                window.location.href = 'admin.html';
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        });

        // Cancel login
        document.getElementById('cancelLogin').addEventListener('click', () => {
            this.hideAdminLogin();
        });

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
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BeinSportApp();
});
