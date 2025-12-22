// js/section.js
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

// تطبيق عرض القنوات في القسم مع خيارات التشغيل
class SectionChannelsApp {
    constructor() {
        this.section = null;
        this.channels = [];
        this.hasInstalledApp = localStorage.getItem('app_installed') === 'true';
        this.currentSectionId = null;
        this.selectedChannel = null;
        this.defaultPlayer = localStorage.getItem('default_player') || 'ask';
        
        this.init();
    }

    async init() {
        console.log('🚀 بدء تشغيل صفحة القسم...');
        
        // تعيين السنة الحالية
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // الحصول على معرف القسم من URL
        this.currentSectionId = this.getSectionIdFromURL();
        
        if (!this.currentSectionId) {
            this.showError('لم يتم تحديد القسم');
            return;
        }
        
        // تحديث العنوان
        document.getElementById('sectionHeader').textContent = 'جاري التحميل...';
        
        // تحميل البيانات
        await this.loadData();
        
        // إعداد نقرات الأزرار
        this.setupEventListeners();
        
        // إعداد Modal خيارات التشغيل
        this.setupPlayerOptionsModal();
        
        console.log('✅ تم تهيئة صفحة القسم بنجاح');
    }

    getSectionIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadData() {
        console.log('📥 جاري تحميل بيانات القسم...');
        
        // عرض حالة التحميل
        this.showLoading();
        
        try {
            // المحاولة الأولى: من Firebase
            try {
                await this.loadFromFirebase();
                console.log('✅ تم تحميل بيانات القسم من Firebase');
                return;
            } catch (firebaseError) {
                console.warn('⚠️ فشل تحميل Firebase:', firebaseError.message);
                
                // إذا فشل Firebase، حاول استخدام localStorage تلقائياً
                try {
                    await this.loadFromLocalStorage();
                    console.log('✅ تم تحميل بيانات القسم من localStorage');
                    return;
                } catch (localStorageError) {
                    console.warn('⚠️ فشل تحميل localStorage:', localStorageError.message);
                    throw new Error('لا توجد بيانات متاحة');
                }
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            this.showError('حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.');
        }
    }

    async loadFromFirebase() {
        return new Promise(async (resolve, reject) => {
            try {
                // 1. التحقق من وجود Firebase
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase SDK غير محمل');
                }
                
                // 2. تهيئة Firebase
                let db;
                try {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    db = firebase.firestore();
                } catch (initError) {
                    throw new Error('فشل تهيئة قاعدة البيانات');
                }
                
                if (!db) {
                    throw new Error('قاعدة البيانات غير متاحة');
                }
                
                // 3. جلب بيانات القسم
                const sectionDoc = await db.collection('sections').doc(this.currentSectionId).get();
                
                if (!sectionDoc.exists) {
                    throw new Error('القسم غير موجود');
                }
                
                this.section = {
                    id: sectionDoc.id,
                    ...sectionDoc.data()
                };
                
                // 4. تحديث معلومات القسم في الواجهة
                this.updateSectionInfo();
                
                // 5. جلب قنوات القسم
                const channelsQuery = db.collection('channels')
                    .where('sectionId', '==', this.currentSectionId)
                    .orderBy('order');
                
                const channelsSnapshot = await channelsQuery.get();
                
                if (channelsSnapshot.empty) {
                    console.log('ℹ️ لا توجد قنوات في هذا القسم');
                    this.channels = [];
                } else {
                    this.channels = channelsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    console.log(`✅ تم تحميل ${this.channels.length} قناة للقسم`);
                }
                
                // 6. حفظ في localStorage كنسخة احتياطية
                this.saveToLocalStorage();
                
                // 7. عرض القنوات
                this.renderChannels();
                
                resolve(true);
                
            } catch (error) {
                console.error('❌ فشل تحميل Firebase:', error);
                reject(error);
            }
        });
    }

    async loadFromLocalStorage() {
        return new Promise((resolve, reject) => {
            try {
                // 1. جلب الأقسام من localStorage
                const savedSections = localStorage.getItem('bein_sections');
                if (!savedSections) {
                    throw new Error('لا توجد بيانات محلية للأقسام');
                }
                
                const sections = JSON.parse(savedSections);
                this.section = sections.find(s => s.id === this.currentSectionId);
                
                if (!this.section) {
                    throw new Error('القسم غير موجود في البيانات المحلية');
                }
                
                // 2. تحديث معلومات القسم في الواجهة
                this.updateSectionInfo();
                
                // 3. جلب القنوات من localStorage
                const savedChannels = localStorage.getItem('bein_channels');
                if (savedChannels) {
                    const allChannels = JSON.parse(savedChannels);
                    this.channels = allChannels.filter(channel => channel.sectionId === this.currentSectionId);
                    
                    // ترتيب القنوات حسب الترتيب
                    this.channels.sort((a, b) => (a.order || 999) - (b.order || 999));
                    
                    console.log(`✅ تم تحميل ${this.channels.length} قناة من localStorage`);
                } else {
                    this.channels = [];
                }
                
                // 4. عرض القنوات
                this.renderChannels();
                
                resolve(true);
                
            } catch (error) {
                console.error('❌ فشل تحميل البيانات المحلية:', error);
                reject(error);
            }
        });
    }

    updateSectionInfo() {
        if (!this.section) return;
        
        document.getElementById('sectionName').textContent = this.section.name;
        document.getElementById('sectionHeader').textContent = this.section.name;
        
        if (this.section.description) {
            document.getElementById('sectionDescription').textContent = this.section.description;
        } else {
            document.getElementById('sectionDescription').textContent = `قسم ${this.section.name} - ${this.channels.length} قناة`;
        }
    }

    renderChannels() {
        const container = document.getElementById('channelsContainer');
        if (!container) {
            console.error('❌ حاوية القنوات غير موجودة');
            return;
        }

        // تصفية القنوات النشطة وترتيبها
        const activeChannels = this.channels
            .filter(channel => channel.isActive !== false)
            .sort((a, b) => (a.order || 1) - (b.order || 1));
        
        if (activeChannels.length === 0) {
            container.innerHTML = `
                <div class="loading" style="grid-column: 1 / -1;">
                    <i class="uil uil-tv-retro" style="font-size: 3rem; color: #6c757d;"></i>
                    <p class="mt-3">لا توجد قنوات متاحة في هذا القسم حالياً</p>
                    <small>سيتم إضافة قنوات قريباً</small>
                </div>
            `;
            return;
        }

        console.log(`🎯 عرض ${activeChannels.length} قناة في القسم`);
        
        // إنشاء HTML للقنوات
        container.innerHTML = activeChannels.map(channel => {
            const defaultImage = 'https://via.placeholder.com/200x100/2F2562/FFFFFF?text=TV';
            const channelImage = channel.image || defaultImage;
            
            return `
                <div class="channel-card" data-channel-id="${channel.id}">
                    <div class="channel-logo">
                        <img src="${channelImage}" alt="${channel.name}" 
                             onerror="this.src='${defaultImage}'">
                    </div>
                    <div class="channel-name">${channel.name}</div>
                    ${channel.description ? `<div class="channel-description">${channel.description}</div>` : ''}
                </div>
            `;
        }).join('');

        // إضافة مستمعي الأحداث للقنوات
        this.addChannelClickListeners();
        
        console.log('✅ تم عرض القنوات بنجاح');
    }

    addChannelClickListeners() {
        const channelCards = document.querySelectorAll('.channel-card');
        channelCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const channelId = card.getAttribute('data-channel-id');
                this.handleChannelClick(channelId, e);
            });
        });
    }

    handleChannelClick(channelId, event) {
        event.preventDefault();
        event.stopPropagation();
        
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) return;
        
        console.log(`📺 نقر على القناة: ${channel.name}`);
        
        // التحقق من تثبيت التطبيق إذا كان الافتراضي XPola
        if (this.defaultPlayer === 'xpola' && !this.hasInstalledApp) {
            this.showInstallModal(channel);
            return;
        }
        
        // إذا كان الافتراضي "اسألني دائماً" أو internal، اعرض خيارات التشغيل
        if (this.defaultPlayer === 'ask') {
            this.showPlayerOptions(channel);
        } else if (this.defaultPlayer === 'internal') {
            this.playInInternalPlayer(channel);
        } else if (this.defaultPlayer === 'xpola') {
            this.playInXpolaPlayer(channel);
        }
    }

    setupPlayerOptionsModal() {
        // إغلاق عند النقر خارج الصندوق
        const modal = document.getElementById('playerOptionsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closePlayerOptions();
                }
            });
        }
        
        // إعداد تفضيلات المستخدم
        const rememberChoice = document.getElementById('rememberChoice');
        const defaultPlayerSelect = document.getElementById('defaultPlayer');
        
        // تحميل التفضيلات المحفوظة
        if (rememberChoice) {
            rememberChoice.checked = localStorage.getItem('remember_player_choice') === 'true';
        }
        
        if (defaultPlayerSelect) {
            defaultPlayerSelect.value = this.defaultPlayer;
            
            // حفظ التفضيلات عند التغيير
            defaultPlayerSelect.addEventListener('change', (e) => {
                this.defaultPlayer = e.target.value;
                localStorage.setItem('default_player', e.target.value);
            });
        }
        
        if (rememberChoice) {
            rememberChoice.addEventListener('change', (e) => {
                localStorage.setItem('remember_player_choice', e.target.checked);
            });
        }
    }

    showPlayerOptions(channel) {
        this.selectedChannel = channel;
        
        // تحديث معلومات القناة في الـ Modal
        const defaultImage = 'https://via.placeholder.com/200x100/2F2562/FFFFFF?text=TV';
        const channelImage = channel.image || defaultImage;
        
        const logoElement = document.getElementById('selectedChannelLogo');
        if (logoElement) {
            const img = logoElement.querySelector('img');
            if (img) {
                img.src = channelImage;
                img.alt = channel.name;
                img.onerror = function() {
                    this.src = defaultImage;
                };
            }
        }
        
        const nameElement = document.getElementById('selectedChannelName');
        if (nameElement) {
            nameElement.textContent = channel.name;
        }
        
        // التحقق من حالة القناة
        const statusElement = document.getElementById('selectedChannelStatus');
        if (statusElement) {
            if (channel.status === 'online') {
                statusElement.textContent = '◉ متصل';
                statusElement.className = 'channel-status online';
            } else if (channel.status === 'offline') {
                statusElement.textContent = '◉ غير متصل';
                statusElement.className = 'channel-status offline';
            } else {
                statusElement.textContent = '◉ متاح للبث';
                statusElement.className = 'channel-status';
            }
        }
        
        // عرض الـ Modal
        const modal = document.getElementById('playerOptionsModal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    }

    closePlayerOptions() {
        const modal = document.getElementById('playerOptionsModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        this.selectedChannel = null;
    }

    playInInternalPlayer(channel = null) {
        const targetChannel = channel || this.selectedChannel;
        if (!targetChannel) return;
        
        console.log(`▶️ تشغيل القناة في المشغل الداخلي: ${targetChannel.name}`);
        
        // حفظ التفضيل إذا كان مطلوباً
        const rememberChoice = document.getElementById('rememberChoice');
        if (rememberChoice && rememberChoice.checked) {
            localStorage.setItem('last_player_choice', 'internal');
        }
        
        // إغلاق الـ Modal
        this.closePlayerOptions();
        
        // التحقق من رابط البث
        if (!targetChannel.url || targetChannel.url === '#') {
            this.showError('رابط البث غير متوفر حالياً');
            return;
        }
        
        // فتح المشغل الداخلي
        this.openInternalPlayer(targetChannel);
        
        // تسجيل النشاط
        this.logChannelView(targetChannel, 'internal');
    }

    playInXpolaPlayer(channel = null) {
        const targetChannel = channel || this.selectedChannel;
        if (!targetChannel) return;
        
        console.log(`▶️ تشغيل القناة في XPola Player: ${targetChannel.name}`);
        
        // حفظ التفضيل إذا كان مطلوباً
        const rememberChoice = document.getElementById('rememberChoice');
        if (rememberChoice && rememberChoice.checked) {
            localStorage.setItem('last_player_choice', 'xpola');
        }
        
        // إغلاق الـ Modal
        this.closePlayerOptions();
        
        // التحقق من تثبيت التطبيق
        if (!this.hasInstalledApp) {
            this.showInstallModal(targetChannel);
            return;
        }
        
        // فتح في XPola Player
        this.openXpolaPlayer(targetChannel);
        
        // تسجيل النشاط
        this.logChannelView(targetChannel, 'xpola');
    }

    downloadXpolaApp() {
        console.log('📱 تحميل تطبيق XPola Player...');
        
        // رابط تحميل التطبيق
        const appUrl = 'https://play.google.com/store/apps/details?id=com.xpola.player';
        
        // فتح رابط التحميل
        window.open(appUrl, '_blank');
        
        // تحديث حالة التثبيت
        this.hasInstalledApp = true;
        localStorage.setItem('app_installed', 'true');
        
        // إغلاق الـ Modal
        this.closePlayerOptions();
        
        // رسالة تأكيد
        this.showMessage('تم فتح صفحة تحميل التطبيق. يرجى تثبيته ثم العودة لتشغيل القنوات.');
    }

    // تعديل دالة openInternalPlayer في section.js
// في دالة openInternalPlayer في section.js
openInternalPlayer(channel) {
    console.log(`▶️ محاولة تشغيل ${channel.name}`);
    
    // حفظ التفضيل
    const rememberChoice = document.getElementById('rememberChoice');
    if (rememberChoice && rememberChoice.checked) {
        localStorage.setItem('last_player_choice', 'internal');
    }
    
    // إغلاق الـ Modal
    this.closePlayerOptions();
    
    // التحقق من رابط البث
    if (!channel.url || channel.url === '#') {
        this.showError('رابط البث غير متوفر حالياً');
        return;
    }
    
    // استخدام المشغل الوسيط
    this.openProxyPlayer(channel);
}

openProxyPlayer(channel) {
    // إنشاء رابط للمشغل الوسيط
    let playerUrl = 'player-proxy.html?';
    
    if (channel.url) {
        playerUrl += `stream=${encodeURIComponent(channel.url)}`;
    }
    
    console.log('🔗 رابط المشغل الوسيط:', playerUrl);
    
    // فتح في نافذة جديدة
    const playerWindow = window.open(playerUrl, '_blank', 
        'width=1000,height=800,resizable=yes,scrollbars=yes');
    
    if (!playerWindow) {
        // إذا تم منع النوافذ، افتح في نفس الصفحة
        window.location.href = playerUrl;
    }
}

    openXpolaPlayer(channel) {
        // فتح رابط البث مباشرة (سيتم التعامل معه من قبل XPola إذا كان مثبتاً)
        if (!channel.url || channel.url === '#') {
            this.showError('رابط البث غير متوفر حالياً');
            return;
        }
        
        // محاولة فتح في XPola عبر intent
        const xpolaUrl = `intent://play?url=${encodeURIComponent(channel.url)}#Intent;package=com.xpola.player;scheme=xpola;end`;
        
        // محاولة الفتح عبر intent
        window.location.href = xpolaUrl;
        
        // إذا فشل intent، افتح الرابط مباشرة
        setTimeout(() => {
            window.open(channel.url, '_blank');
        }, 500);
    }

    showInstallModal(channel) {
        const modal = document.getElementById('installModal');
        if (!modal) return;
        
        const confirmBtn = document.getElementById('confirmInstall');
        const cancelBtn = document.getElementById('cancelInstall');
        
        if (!confirmBtn || !cancelBtn) return;
        
        // إزالة المستمعين السابقين
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        
        const newConfirmBtn = document.getElementById('confirmInstall');
        const newCancelBtn = document.getElementById('cancelInstall');
        
        // إضافة مستمعين جدد
        newConfirmBtn.addEventListener('click', () => {
            this.downloadXpolaApp();
            modal.style.display = 'none';
        });
        
        newCancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // عرض المودال
        modal.style.display = 'block';
        
        // إغلاق المودال عند النقر خارج المحتوى
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    logChannelView(channel, playerType) {
        try {
            // يمكنك إضافة كود لتسجيل المشاهدات هنا
            console.log(`📊 تسجيل مشاهدة القناة: ${channel.name} - المشغل: ${playerType}`);
            
            // حفظ سجل المشاهدة
            const watchHistory = JSON.parse(localStorage.getItem('watch_history') || '[]');
            watchHistory.unshift({
                channelId: channel.id,
                channelName: channel.name,
                playerType: playerType,
                timestamp: new Date().toISOString()
            });
            
            // حفظ فقط آخر 50 مشاهدة
            if (watchHistory.length > 50) {
                watchHistory.splice(50);
            }
            
            localStorage.setItem('watch_history', JSON.stringify(watchHistory));
            
        } catch (error) {
            console.warn('⚠️ فشل تسجيل المشاهدة:', error);
        }
    }

    showLoading() {
        const container = document.getElementById('channelsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading" style="grid-column: 1 / -1;">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">جاري التحميل...</span>
                    </div>
                    <p>جاري تحميل القنوات...</p>
                    <small>يرجى الانتظار</small>
                </div>
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('channelsContainer');
        if (container) {
            container.innerHTML = `
                <div class="loading" style="grid-column: 1 / -1;">
                    <i class="uil uil-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i>
                    <p class="mt-3 text-danger">${message}</p>
                    <button class="btn btn-primary mt-3" onclick="location.reload()">
                        <i class="uil uil-redo"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        }
    }

    showMessage(message, type = 'info') {
        // إنشاء رسالة مؤقتة
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type} alert-dismissible fade show`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 1050;
            min-width: 300px;
        `;
        messageDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(messageDiv);
        
        // إزالة تلقائية بعد 3 ثواني
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    // ====== إضافة جديدة: دالة عرض رسالة الخطأ عند فشل المشغل الداخلي ======
    showStreamError(channel, errorMessage) {
        // إنشاء عنصر رسالة الخطأ
        const errorDiv = document.createElement('div');
        errorDiv.className = 'stream-error-alert';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="uil uil-exclamation-triangle"></i>
                <div class="error-details">
                    <h5>فشل تشغيل ${channel.name}</h5>
                    <p>${errorMessage}</p>
                    <div class="error-actions">
                        <button class="btn btn-sm btn-primary" onclick="window.sectionApp.tryXpolaInstead('${channel.id}')">
                            <i class="uil uil-external-link-alt"></i> جرب XPola Player
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                            <i class="uil uil-times"></i> إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة CSS إذا لم يكن موجوداً
        if (!document.querySelector('#stream-error-styles')) {
            const style = document.createElement('style');
            style.id = 'stream-error-styles';
            style.textContent = `
                .stream-error-alert {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 9999;
                    background: linear-gradient(135deg, #2F2562, #42318F);
                    border: 1px solid #654FD4;
                    border-radius: 10px;
                    padding: 15px;
                    max-width: 400px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                    animation: slideInRight 0.3s ease;
                }
                .error-content {
                    display: flex;
                    gap: 15px;
                    align-items: flex-start;
                }
                .error-content i {
                    font-size: 2rem;
                    color: #ffc107;
                    margin-top: 5px;
                }
                .error-details h5 {
                    margin: 0 0 5px 0;
                    color: white;
                }
                .error-details p {
                    margin: 0 0 10px 0;
                    color: #B8B8B8;
                    font-size: 0.9rem;
                }
                .error-actions {
                    display: flex;
                    gap: 10px;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(errorDiv);
        
        // إزالة تلقائية بعد 10 ثواني
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }
    
    // ====== إضافة جديدة: دالة محاولة XPola بدلاً من المشغل الداخلي ======
    tryXpolaInstead(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) return;
        
        console.log(`🎮 محاولة تشغيل ${channel.name} في XPola Player`);
        this.playInXpolaPlayer(channel);
        
        // إزالة رسالة الخطأ
        const errorAlert = document.querySelector('.stream-error-alert');
        if (errorAlert) {
            errorAlert.remove();
        }
    }
    // ====== نهاية الإضافة الجديدة ======

    saveToLocalStorage() {
        try {
            // لا نحتاج لحفظ شيء هنا لأن البيانات محفوظة مسبقاً في main.js
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات محلياً:', error);
        }
    }

    setupEventListeners() {
        // يمكن إضافة مستمعي أحداث إضافية هنا
    }

    async retryLoadData() {
        console.log('🔄 إعادة محاولة تحميل بيانات القسم...');
        await this.loadData();
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('📂 تهيئة صفحة القسم...');
    window.sectionApp = new SectionChannelsApp();
});

// دالة مساعدة للعودة للرئيسية
function goToIndexWithCheck() {
    window.location.href = 'index.html';
}

// دالة مساعدة للذهاب لجدول المباريات
function goToMatchesWithCheck() {
    window.location.href = 'matches.html';
}

// جعل الدوال متاحة عالمياً
window.reloadSectionData = function() {
    if (window.sectionApp) {
        window.sectionApp.retryLoadData();
    }
};

// دالة لاختبار فشل المشغل الداخلي (يمكنك استدعاؤها من player.js عند حدوث خطأ)
window.reportPlayerError = function(channelId, errorMessage) {
    if (window.sectionApp && window.sectionApp.showStreamError) {
        const channel = window.sectionApp.channels?.find(c => c.id === channelId);
        if (channel) {
            window.sectionApp.showStreamError(channel, errorMessage);
        }
    }
};
