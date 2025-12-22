// js/player.js
// مشغل الفيديو الاحترافي مع إصلاح مشكلة تحميل البيانات

class VideoPlayerApp {
    constructor() {
        // تهيئة المتغيرات
        this.channelData = null;
        this.videoPlayer = null;
        this.hls = null;
        this.currentQuality = 'auto';
        this.isPlaying = false;
        this.isFullscreen = false;
        this.isMuted = false;
        this.volume = 100;
        this.buffering = false;
        this.playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
        this.retryCount = 0;
        this.maxRetries = 3;
        
        // معلومات البث
        this.streamUrl = null;
        this.qualityLevels = {};
        
        this.init();
    }
    
    async init() {
        console.log('🚀 بدء تشغيل مشغل الفيديو...');
        
        // تعيين السنة الحالية
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // الحصول على بيانات القناة من URL
        await this.loadChannelData();
        
        // تهيئة المشغل
        this.initializePlayer();
        
        // إعداد عناصر التحكم
        this.setupControls();
        
        // إعداد الأحداث
        this.setupEventListeners();
        
        console.log('✅ تم تهيئة مشغل الفيديو بنجاح');
    }
    
    async loadChannelData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const channelId = urlParams.get('channel');
            const channelName = urlParams.get('name') || 'بث مباشر';
            const channelLogo = urlParams.get('logo');
            const streamUrl = urlParams.get('stream');
            
            console.log('📊 معلمات URL:', {
                channelId,
                channelName,
                streamUrl
            });
            
            // التحقق من وجود رابط البث
            if (!streamUrl && !channelId) {
                throw new Error('لم يتم تحديد رابط بث أو معرف قناة');
            }
            
            // استخدام البيانات من المعلمات مباشرة
            this.channelData = {
                id: channelId || 'direct-' + Date.now(),
                name: channelName,
                logo: channelLogo || 'https://via.placeholder.com/100/2F2562/FFFFFF?text=TV',
                url: streamUrl || '#',
                type: streamUrl ? this.detectStreamType(streamUrl) : 'unknown'
            };
            
            // إذا كان هناك streamUrl، نقوم بتحديثه
            if (streamUrl) {
                this.streamUrl = streamUrl;
            } else if (channelId) {
                // محاولة جلب رابط البث من Firebase
                try {
                    await this.loadChannelFromFirebase(channelId);
                } catch (firebaseError) {
                    console.warn('⚠️ فشل تحميل من Firebase:', firebaseError.message);
                    // نستخدم القناة بدون رابط
                    this.channelData.url = '#';
                }
            }
            
            // تحديث واجهة المستخدم
            this.updateUI();
            
            // إذا كان هناك رابط بث، نقوم بتحميله
            if (this.streamUrl && this.streamUrl !== '#') {
                this.loadStream();
            } else {
                this.showError('رابط البث غير متوفر حالياً');
            }
            
        } catch (error) {
            console.error('❌ خطأ في تحميل بيانات القناة:', error);
            this.showError('تعذر تحميل بيانات القناة');
        }
    }
    
    detectStreamType(url) {
        if (!url) return 'unknown';
        if (url.includes('.m3u8')) return 'hls';
        if (url.includes('.mpd')) return 'dash';
        if (url.includes('.mp4')) return 'mp4';
        if (url.includes('.m3u')) return 'm3u';
        if (url.includes('.ts')) return 'ts';
        if (url.includes('.flv')) return 'flv';
        return 'direct';
    }
    
    async loadChannelFromFirebase(channelId) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('🔥 محاولة تحميل القناة من Firebase:', channelId);
                
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase غير متوفر');
                }
                
                // تهيئة Firebase
                let app;
                if (!firebase.apps.length) {
                    app = firebase.initializeApp({
                        apiKey: "AIzaSyAkgEiYYlmpMe0NLewulheovlTQMz5C980",
                        authDomain: "bein-42f9e.firebaseapp.com",
                        projectId: "bein-42f9e",
                        storageBucket: "bein-42f9e.firebasestorage.app",
                        messagingSenderId: "143741167050",
                        appId: "1:143741167050:web:922d3a0cddb40f67b21b33",
                        measurementId: "G-JH198SKCFS"
                    }, 'PlayerFirebaseApp');
                } else {
                    app = firebase.apps[0];
                }
                
                const db = firebase.firestore(app);
                
                // جلب بيانات القناة
                const channelDoc = await db.collection('channels').doc(channelId).get();
                
                if (!channelDoc.exists) {
                    throw new Error('القناة غير موجودة في قاعدة البيانات');
                }
                
                const channelData = channelDoc.data();
                console.log('✅ بيانات القناة من Firebase:', channelData);
                
                // تحديث بيانات القناة
                this.channelData = {
                    ...this.channelData,
                    ...channelData,
                    id: channelId
                };
                
                // تحديث رابط البث إذا كان متوفراً
                if (channelData.url && channelData.url !== '#') {
                    this.streamUrl = channelData.url;
                }
                
                // تحديث الواجهة
                this.updateUI();
                
                resolve(this.channelData);
                
            } catch (error) {
                console.error('❌ فشل تحميل من Firebase:', error);
                reject(error);
            }
        });
    }
    
    async loadStream() {
        try {
            this.showLoading();
            
            if (!this.streamUrl || this.streamUrl === '#') {
                throw new Error('رابط البث غير متوفر');
            }
            
            console.log('📡 جاري تحميل البث:', this.streamUrl);
            console.log('📊 نوع البث:', this.channelData?.type);
            
            // التحقق من نوع البث وتشغيله
            const streamType = this.channelData?.type || this.detectStreamType(this.streamUrl);
            
            if (streamType === 'hls' || streamType === 'm3u8') {
                await this.loadHLSStream(this.streamUrl);
            } else if (streamType === 'mp4') {
                await this.loadMP4Stream(this.streamUrl);
            } else {
                // محاولة تشغيل مباشر
                await this.loadDirectStream(this.streamUrl);
            }
            
        } catch (error) {
            console.error('❌ فشل تحميل البث:', error);
            this.handleStreamError(error);
        }
    }
    
    async loadHLSStream(url) {
        return new Promise((resolve, reject) => {
            if (Hls.isSupported()) {
                console.log('🎬 استخدام HLS.js للتشغيل');
                
                this.hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    maxBufferSize: 60 * 1000 * 1000,
                    maxBufferHole: 0.5,
                    liveSyncDurationCount: 3,
                    liveMaxLatencyDurationCount: 10,
                    manifestLoadingTimeOut: 10000,
                    manifestLoadingMaxRetry: 3,
                    manifestLoadingRetryDelay: 1000,
                    levelLoadingTimeOut: 10000,
                    levelLoadingMaxRetry: 3,
                    levelLoadingRetryDelay: 1000,
                    fragLoadingTimeOut: 20000,
                    fragLoadingMaxRetry: 3,
                    fragLoadingRetryDelay: 1000
                });
                
                // أحداث HLS
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ تم تحليل قائمة التشغيل بنجاح');
                    this.hideLoading();
                    this.play();
                    resolve(true);
                });
                
                this.hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('❌ خطأ HLS:', data);
                    
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('🔄 إعادة المحاولة بعد خطأ في الشبكة');
                                
                                if (this.retryCount < this.maxRetries) {
                                    this.retryCount++;
                                    console.log(`🔄 المحاولة ${this.retryCount} من ${this.maxRetries}`);
                                    
                                    setTimeout(() => {
                                        if (this.hls) {
                                            this.hls.startLoad();
                                        }
                                    }, 2000 * this.retryCount);
                                } else {
                                    this.showError('فشل الاتصال بالبث بعد عدة محاولات');
                                }
                                break;
                                
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log('🔄 إعادة تحميل بعد خطأ وسائط');
                                this.hls.recoverMediaError();
                                break;
                                
                            default:
                                console.log('❌ خطأ غير قابل للاسترداد');
                                this.hls.destroy();
                                this.showError('خطأ غير قابل للاسترداد في البث');
                                break;
                        }
                    }
                });
                
                // تحميل المصدر
                this.hls.loadSource(url);
                this.hls.attachMedia(this.videoPlayer.el().querySelector('video'));
                
            } else if (this.videoPlayer.el().querySelector('video').canPlayType('application/vnd.apple.mpegurl')) {
                // دعم HLS الأصلي (Safari)
                console.log('🎬 استخدام دعم HLS الأصلي');
                
                this.videoPlayer.src({
                    src: url,
                    type: 'application/x-mpegURL'
                });
                
                this.hideLoading();
                this.play();
                resolve(true);
                
            } else {
                console.log('❌ المتصفح لا يدعم HLS');
                this.showError('المتصفح لا يدعم هذا النوع من البث');
                reject(new Error('المتصفح لا يدعم HLS'));
            }
        });
    }
    
    async loadMP4Stream(url) {
        console.log('🎬 تحميل MP4 مباشر:', url);
        
        this.videoPlayer.src({
            src: url,
            type: 'video/mp4'
        });
        
        this.hideLoading();
        this.play();
    }
    
    async loadDirectStream(url) {
        console.log('🎬 تحميل بث مباشر:', url);
        
        // محاولة تحديد نوع الملف
        let type = 'video/mp4';
        if (url.includes('.webm')) type = 'video/webm';
        if (url.includes('.ogg')) type = 'video/ogg';
        
        this.videoPlayer.src({
            src: url,
            type: type
        });
        
        this.hideLoading();
        this.play();
    }
    
    handleStreamError(error) {
        console.error('❌ خطأ في البث:', error);
        
        let errorMessage = 'تعذر تحميل البث';
        
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'فشل الاتصال بالخادم. تحقق من اتصال الإنترنت.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'مشكلة في صلاحيات الوصول للبث.';
        } else if (error.message.includes('404')) {
            errorMessage = 'رابط البث غير موجود أو منتهي الصلاحية.';
        }
        
        this.showError(errorMessage);
    }
    
    initializePlayer() {
        try {
            // تهيئة مشغل Video.js
            this.videoPlayer = videojs('videoPlayer', {
                controls: true,
                autoplay: false, // نعطيه false ونشغل يدوياً
                preload: 'auto',
                fluid: true,
                liveui: true,
                responsive: true,
                playbackRates: this.playbackRates,
                html5: {
                    hls: {
                        enableLowLatencyMode: true,
                        smoothQualityChange: true,
                        overrideNative: true
                    }
                }
            });
            
            // إضافة حدث عند جاهزية المشغل
            this.videoPlayer.ready(() => {
                console.log('✅ مشغل الفيديو جاهز');
            });
            
        } catch (error) {
            console.error('❌ فشل تهيئة مشغل الفيديو:', error);
            
            // محاولة بديلة باستخدام HTML5 video مباشرة
            this.fallbackToHTML5Player();
        }
    }
    
    fallbackToHTML5Player() {
        console.log('🔄 استخدام مشغل HTML5 بديل');
        
        const videoElement = document.getElementById('videoPlayer');
        if (videoElement && videoElement.tagName === 'VIDEO') {
            // إضافة controls يدوياً
            videoElement.controls = true;
            this.videoPlayer = {
                el: () => ({ querySelector: () => videoElement }),
                src: (source) => {
                    videoElement.src = source.src;
                    videoElement.type = source.type;
                },
                play: () => videoElement.play(),
                pause: () => videoElement.pause(),
                on: (event, callback) => videoElement.addEventListener(event, callback),
                ready: (callback) => {
                    if (videoElement.readyState >= 2) {
                        callback();
                    } else {
                        videoElement.addEventListener('loadedmetadata', callback);
                    }
                }
            };
            
            console.log('✅ تم تهيئة مشغل HTML5 بديل');
        } else {
            this.showError('تعذر تهيئة مشغل الفيديو');
        }
    }
    
    updateUI() {
        if (!this.channelData) return;
        
        // تحديث اسم القناة
        const updateElementText = (id, text) => {
            const element = document.getElementById(id);
            if (element) element.textContent = text;
        };
        
        updateElementText('channelName', this.channelData.name);
        updateElementText('channelNameFull', this.channelData.name);
        
        // تحديث لوجو القناة
        const updateLogo = (id, size = 100) => {
            const element = document.getElementById(id);
            if (element) {
                const defaultLogo = `https://via.placeholder.com/${size}/2F2562/FFFFFF?text=${encodeURIComponent(this.channelData.name.substring(0, 2))}`;
                const logoUrl = this.channelData.logo || defaultLogo;
                
                element.innerHTML = `
                    <img src="${logoUrl}" 
                         alt="${this.channelData.name}"
                         onerror="this.src='${defaultLogo}'"
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                `;
            }
        };
        
        updateLogo('channelLogo', 50);
        updateLogo('channelLogoFull', 100);
        
        // تحديث الوصف إذا كان متوفراً
        const descriptionElement = document.getElementById('channelDescription');
        if (descriptionElement && this.channelData.description) {
            descriptionElement.textContent = this.channelData.description;
        }
        
        // تحديث رابط المشاركة
        const shareUrl = document.getElementById('shareUrl');
        if (shareUrl) {
            shareUrl.value = window.location.href;
            this.generateQRCode();
        }
    }
    
    generateQRCode() {
        const qrcodeElement = document.getElementById('qrcode');
        if (qrcodeElement && window.QRCode) {
            qrcodeElement.innerHTML = '';
            new QRCode(qrcodeElement, {
                text: window.location.href,
                width: 128,
                height: 128,
                colorDark: "#42318F",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }
    
    setupControls() {
        // ربط عناصر التحكم الأساسية
        this.setupControl('playPauseBtn', () => this.togglePlay());
        this.setupControl('muteBtn', () => this.toggleMute());
        this.setupControl('fullscreenBtn', () => this.toggleFullscreen());
        this.setupControl('qualityBtn', () => this.showQualityModal());
        this.setupControl('shareBtn', () => this.showShareModal());
        this.setupControl('settingsBtn', () => this.showSettingsModal());
        this.setupControl('retryBtn', () => this.retryStream());
        this.setupControl('reportBtn', () => this.reportProblem());
        
        // ربط السلايدرات
        this.setupSlider('volumeSlider', (value) => this.setVolume(value));
        this.setupSlider('progressSlider', (value) => this.seek(value));
    }
    
    setupControl(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', handler);
        }
    }
    
    setupSlider(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('input', (e) => handler(e.target.value));
        }
    }
    
    setupEventListeners() {
        // أحداث الفيديو إذا كان المشغل موجوداً
        if (this.videoPlayer && this.videoPlayer.on) {
            this.videoPlayer.on('play', () => {
                this.isPlaying = true;
                this.updatePlayButton();
            });
            
            this.videoPlayer.on('pause', () => {
                this.isPlaying = false;
                this.updatePlayButton();
            });
            
            this.videoPlayer.on('volumechange', () => {
                if (this.videoPlayer.volume) {
                    this.volume = this.videoPlayer.volume() * 100;
                    this.isMuted = this.videoPlayer.muted();
                    this.updateVolumeControls();
                }
            });
            
            this.videoPlayer.on('timeupdate', () => {
                this.updateProgress();
            });
        }
        
        // أحداث المودالات
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        
        // النقر خارج المودال
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }
    
    togglePlay() {
        if (!this.videoPlayer) return;
        
        if (this.isPlaying) {
            this.videoPlayer.pause();
        } else {
            this.videoPlayer.play().catch(error => {
                console.error('❌ فشل التشغيل:', error);
                this.showError('فشل تشغيل الفيديو');
            });
        }
    }
    
    updatePlayButton() {
        const btn = document.getElementById('playPauseBtn');
        if (btn) {
            const icon = this.isPlaying ? 'uil uil-pause' : 'uil uil-play';
            btn.innerHTML = `<i class="${icon}"></i>`;
        }
    }
    
    toggleMute() {
        if (!this.videoPlayer || !this.videoPlayer.muted) return;
        
        this.videoPlayer.muted(!this.videoPlayer.muted());
        this.updateVolumeControls();
    }
    
    updateVolumeControls() {
        const muteBtn = document.getElementById('muteBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (muteBtn) {
            const icon = this.isMuted ? 'uil uil-volume-mute' : 
                         this.volume < 50 ? 'uil uil-volume-down' : 'uil uil-volume-up';
            muteBtn.innerHTML = `<i class="${icon}"></i>`;
        }
        
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
    }
    
    setVolume(value) {
        if (!this.videoPlayer || !this.videoPlayer.volume) return;
        
        this.volume = value;
        this.videoPlayer.volume(value / 100);
    }
    
    seek(percentage) {
        if (!this.videoPlayer || !this.videoPlayer.duration) return;
        
        const duration = this.videoPlayer.duration();
        if (duration) {
            this.videoPlayer.currentTime((percentage / 100) * duration);
        }
    }
    
    updateProgress() {
        if (!this.videoPlayer || !this.videoPlayer.currentTime) return;
        
        const progressSlider = document.getElementById('progressSlider');
        const currentTimeElement = document.getElementById('currentTime');
        const durationElement = document.getElementById('duration');
        
        const currentTime = this.videoPlayer.currentTime();
        const duration = this.videoPlayer.duration();
        
        if (progressSlider && duration) {
            const percentage = (currentTime / duration) * 100;
            progressSlider.value = percentage;
        }
        
        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(currentTime);
        }
        
        if (durationElement && duration) {
            durationElement.textContent = this.formatTime(duration);
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    toggleFullscreen() {
        if (!this.videoPlayer || !this.videoPlayer.isFullscreen) return;
        
        if (this.videoPlayer.isFullscreen()) {
            this.videoPlayer.exitFullscreen();
        } else {
            this.videoPlayer.requestFullscreen();
        }
    }
    
    showQualityModal() {
        const modal = document.getElementById('qualityModal');
        if (modal) modal.style.display = 'block';
    }
    
    showShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) modal.style.display = 'block';
    }
    
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'block';
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    retryStream() {
        console.log('🔄 إعادة محاولة تشغيل البث...');
        this.hideError();
        
        if (this.streamUrl) {
            this.loadStream();
        } else {
            this.showError('لا يوجد رابط بث للمحاولة');
        }
    }
    
    reportProblem() {
        const reportUrl = `https://t.me/wacelalorshepro?text=${encodeURIComponent(
            `الإبلاغ عن مشكلة في البث:\n` +
            `القناة: ${this.channelData?.name || 'غير معروف'}\n` +
            `الوقت: ${new Date().toLocaleString()}\n` +
            `المتصفح: ${navigator.userAgent}\n` +
            `وصف المشكلة: `
        )}`;
        
        window.open(reportUrl, '_blank');
    }
    
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'flex';
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }
    
    showError(message) {
        const overlay = document.getElementById('errorOverlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (overlay) overlay.style.display = 'flex';
        if (errorMessage) errorMessage.textContent = message;
        
        this.hideLoading();
    }
    
    hideError() {
        const overlay = document.getElementById('errorOverlay');
        if (overlay) overlay.style.display = 'none';
    }
    
    play() {
        if (this.videoPlayer && this.videoPlayer.play) {
            this.videoPlayer.play().then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
            }).catch(error => {
                console.error('❌ فشل التشغيل التلقائي:', error);
                // لا نعرض خطأ هنا، نترك للمستخدم الضغط على play
            });
        }
    }
}

// بدء تشغيل المشغل
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 تهيئة مشغل الفيديو...');
    
    // التحقق من توفر المكتبات المطلوبة
    if (typeof videojs === 'undefined') {
        console.error('❌ مكتبة Video.js غير محملة');
        // يمكنك هنا تحميل المكتبة ديناميكياً
        const script = document.createElement('script');
        script.src = 'https://vjs.zencdn.net/8.6.1/video.min.js';
        script.onload = () => {
            console.log('✅ تم تحميل Video.js');
            window.videoPlayer = new VideoPlayerApp();
        };
        document.head.appendChild(script);
    } else {
        window.videoPlayer = new VideoPlayerApp();
    }
});
