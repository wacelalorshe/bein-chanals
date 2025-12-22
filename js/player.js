// js/player.js
// مشغل الفيديو الاحترافي لتشغيل القنوات

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
        
        // معلومات البث
        this.streamUrl = null;
        this.qualityLevels = {};
        this.stats = {
            bitrate: 0,
            bufferLength: 0,
            droppedFrames: 0,
            connectionTime: 0
        };
        
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
        
        // تحميل وتشغيل الفيديو
        this.loadStream();
        
        console.log('✅ تم تهيئة مشغل الفيديو بنجاح');
    }
    
    async loadChannelData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const channelId = urlParams.get('channel');
            const channelName = urlParams.get('name');
            const channelLogo = urlParams.get('logo');
            const streamUrl = urlParams.get('stream');
            
            if (!channelId && !streamUrl) {
                throw new Error('لم يتم تحديد قناة أو رابط بث');
            }
            
            // إذا كان هناك رابط مباشر
            if (streamUrl) {
                this.channelData = {
                    id: 'direct-stream',
                    name: channelName || 'بث مباشر',
                    logo: channelLogo || 'https://via.placeholder.com/100/2F2562/FFFFFF?text=TV',
                    url: streamUrl
                };
            } else {
                // محاولة جلب بيانات القناة من Firebase
                await this.loadChannelFromFirebase(channelId);
            }
            
            // تحديث واجهة المستخدم
            this.updateUI();
            
        } catch (error) {
            console.error('❌ خطأ في تحميل بيانات القناة:', error);
            this.showError('تعذر تحميل بيانات القناة');
        }
    }
    
    async loadChannelFromFirebase(channelId) {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase غير متاح');
                }
                
                let db;
                try {
                    // استخدام config الموجود في main.js
                    if (!firebase.apps.length) {
                        firebase.initializeApp({
                            apiKey: "AIzaSyAkgEiYYlmpMe0NLewulheovlTQMz5C980",
                            authDomain: "bein-42f9e.firebaseapp.com",
                            projectId: "bein-42f9e",
                            storageBucket: "bein-42f9e.firebasestorage.app",
                            messagingSenderId: "143741167050",
                            appId: "1:143741167050:web:922d3a0cddb40f67b21b33",
                            measurementId: "G-JH198SKCFS"
                        });
                    }
                    db = firebase.firestore();
                } catch (initError) {
                    console.error('❌ فشل تهيئة Firebase:', initError);
                    throw initError;
                }
                
                const channelDoc = await db.collection('channels').doc(channelId).get();
                
                if (!channelDoc.exists) {
                    throw new Error('القناة غير موجودة');
                }
                
                this.channelData = {
                    id: channelDoc.id,
                    ...channelDoc.data()
                };
                
                console.log('✅ تم تحميل بيانات القناة:', this.channelData.name);
                resolve(true);
                
            } catch (error) {
                console.error('❌ فشل تحميل القناة من Firebase:', error);
                reject(error);
            }
        });
    }
    
    initializePlayer() {
        try {
            // تهيئة مشغل Video.js
            this.videoPlayer = videojs('videoPlayer', {
                controls: true,
                autoplay: true,
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
            
            // إضافة فئات CSS مخصصة
            this.videoPlayer.addClass('custom-video-player');
            
            console.log('✅ تم تهيئة مشغل الفيديو');
            
        } catch (error) {
            console.error('❌ فشل تهيئة مشغل الفيديو:', error);
            this.showError('تعذر تهيئة مشغل الفيديو');
        }
    }
    
    async loadStream() {
        try {
            this.showLoading();
            
            // تحديد رابط البث
            let streamUrl = this.channelData.url;
            
            if (!streamUrl || streamUrl === '#') {
                throw new Error('رابط البث غير متوفر');
            }
            
            console.log('📡 جاري تحميل البث:', streamUrl);
            
            // التحقق من نوع الرابط
            if (streamUrl.includes('.m3u8')) {
                await this.loadHLSStream(streamUrl);
            } else if (streamUrl.includes('.mpd')) {
                await this.loadDASHStream(streamUrl);
            } else if (streamUrl.includes('.mp4') || streamUrl.includes('.webm')) {
                await this.loadDirectStream(streamUrl);
            } else {
                // محاولة تشغيل كـ HLS بشكل افتراضي
                await this.loadHLSStream(streamUrl);
            }
            
        } catch (error) {
            console.error('❌ فشل تحميل البث:', error);
            this.showError('تعذر تحميل البث. تأكد من اتصال الإنترنت.');
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
                    maxFragLookUpTolerance: 0.2,
                    liveSyncDurationCount: 3,
                    liveMaxLatencyDurationCount: 10,
                    manifestLoadingTimeOut: 10000,
                    manifestLoadingMaxRetry: 3,
                    manifestLoadingRetryDelay: 500,
                    manifestLoadingMaxRetryTimeout: 10000,
                    levelLoadingTimeOut: 10000,
                    levelLoadingMaxRetry: 3,
                    levelLoadingRetryDelay: 500,
                    levelLoadingMaxRetryTimeout: 10000,
                    fragLoadingTimeOut: 20000,
                    fragLoadingMaxRetry: 3,
                    fragLoadingRetryDelay: 500,
                    fragLoadingMaxRetryTimeout: 10000,
                });
                
                // تحميل الملف الرئيسي
                this.hls.loadSource(url);
                this.hls.attachMedia(this.videoPlayer.el().querySelector('video'));
                
                // أحداث HLS
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ تم تحليل قائمة التشغيل بنجاح');
                    this.hideLoading();
                    this.play();
                    this.setupQualitySelector();
                });
                
                this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    console.log(`🔄 تغيير الجودة إلى: ${data.level}`);
                    this.updateQualityBadge();
                });
                
                this.hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('❌ خطأ HLS:', data);
                    
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('🔄 إعادة المحاولة بعد خطأ في الشبكة');
                                this.hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log('🔄 إعادة تحميل بعد خطأ وسائط');
                                this.hls.recoverMediaError();
                                break;
                            default:
                                this.hls.destroy();
                                this.showError('خطأ غير قابل للاسترداد في البث');
                                break;
                        }
                    }
                });
                
                // تحديث الإحصائيات
                this.setupStatsUpdater();
                
                resolve(true);
                
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
                reject(new Error('المتصفح لا يدعم HLS'));
            }
        });
    }
    
    async loadDirectStream(url) {
        this.videoPlayer.src({
            src: url,
            type: this.getMimeType(url)
        });
        
        this.hideLoading();
        this.play();
    }
    
    getMimeType(url) {
        if (url.includes('.mp4')) return 'video/mp4';
        if (url.includes('.webm')) return 'video/webm';
        if (url.includes('.ogg')) return 'video/ogg';
        return 'video/mp4';
    }
    
    setupControls() {
        // ربط عناصر التحكم
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.muteBtn = document.getElementById('muteBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressSlider = document.getElementById('progressSlider');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.qualityBtn = document.getElementById('qualityBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.reportBtn = document.getElementById('reportBtn');
        
        // تحديث حالة التشغيل
        this.updatePlayButton();
    }
    
    setupEventListeners() {
        // أحداث الفيديو
        this.videoPlayer.on('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateLiveStatus();
        });
        
        this.videoPlayer.on('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });
        
        this.videoPlayer.on('volumechange', () => {
            this.volume = this.videoPlayer.volume() * 100;
            this.isMuted = this.videoPlayer.muted();
            this.updateVolumeControls();
        });
        
        this.videoPlayer.on('timeupdate', () => {
            this.updateProgress();
        });
        
        this.videoPlayer.on('seeking', () => {
            this.showBuffering();
        });
        
        this.videoPlayer.on('seeked', () => {
            this.hideBuffering();
        });
        
        this.videoPlayer.on('waiting', () => {
            this.showBuffering();
        });
        
        this.videoPlayer.on('playing', () => {
            this.hideBuffering();
        });
        
        this.videoPlayer.on('fullscreenchange', () => {
            this.isFullscreen = this.videoPlayer.isFullscreen();
            this.updateFullscreenButton();
        });
        
        // أحداث عناصر التحكم
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.progressSlider.addEventListener('input', (e) => this.seek(e.target.value));
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.qualityBtn.addEventListener('click', () => this.showQualityModal());
        this.shareBtn.addEventListener('click', () => this.showShareModal());
        this.settingsBtn.addEventListener('click', () => this.showSettingsModal());
        this.retryBtn.addEventListener('click', () => this.retryStream());
        this.reportBtn.addEventListener('click', () => this.reportProblem());
        
        // أحداث المودالات
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // النقر خارج المودال
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
        
        // أحداث لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardControls(e);
        });
        
        // منع الإغلاق عند الخروج
        window.addEventListener('beforeunload', (e) => {
            if (this.isPlaying) {
                e.preventDefault();
                e.returnValue = 'هل تريد بالتأكيد مغادرة المشغل؟';
            }
        });
    }
    
    handleKeyboardControls(e) {
        switch(e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.skip(-10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.skip(10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.changeVolume(10);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.changeVolume(-10);
                break;
            case '>':
            case '.':
                e.preventDefault();
                this.changeSpeed(0.25);
                break;
            case '<':
            case ',':
                e.preventDefault();
                this.changeSpeed(-0.25);
                break;
        }
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    play() {
        if (this.videoPlayer) {
            this.videoPlayer.play();
            this.isPlaying = true;
            this.updatePlayButton();
        }
    }
    
    pause() {
        if (this.videoPlayer) {
            this.videoPlayer.pause();
            this.isPlaying = false;
            this.updatePlayButton();
        }
    }
    
    toggleMute() {
        if (this.videoPlayer) {
            this.videoPlayer.muted(!this.videoPlayer.muted());
            this.updateVolumeControls();
        }
    }
    
    setVolume(value) {
        if (this.videoPlayer) {
            this.videoPlayer.volume(value / 100);
            this.updateVolumeControls();
        }
    }
    
    changeVolume(delta) {
        const newVolume = Math.min(100, Math.max(0, this.volume + delta));
        this.setVolume(newVolume);
    }
    
    seek(percentage) {
        if (this.videoPlayer) {
            const duration = this.videoPlayer.duration();
            if (duration) {
                this.videoPlayer.currentTime((percentage / 100) * duration);
            }
        }
    }
    
    skip(seconds) {
        if (this.videoPlayer) {
            const currentTime = this.videoPlayer.currentTime();
            this.videoPlayer.currentTime(currentTime + seconds);
            this.showSkipNotification(seconds);
        }
    }
    
    changeSpeed(delta) {
        if (this.videoPlayer) {
            const currentSpeed = this.videoPlayer.playbackRate();
            const newSpeed = currentSpeed + delta;
            if (newSpeed >= 0.25 && newSpeed <= 4) {
                this.videoPlayer.playbackRate(newSpeed);
                this.showToast(`سرعة التشغيل: ${newSpeed.toFixed(2)}x`);
            }
        }
    }
    
    toggleFullscreen() {
        if (this.videoPlayer) {
            if (this.isFullscreen) {
                this.videoPlayer.exitFullscreen();
            } else {
                this.videoPlayer.requestFullscreen();
            }
        }
    }
    
    updateUI() {
        if (this.channelData) {
            // تحديث العنوان
            document.getElementById('channelName').textContent = this.channelData.name;
            document.getElementById('channelNameFull').textContent = this.channelData.name;
            
            // تحديث اللوجو
            const logoSmall = document.getElementById('channelLogo');
            const logoFull = document.getElementById('channelLogoFull');
            
            if (logoSmall) {
                logoSmall.innerHTML = `
                    <img src="${this.channelData.image || this.channelData.logo || 'https://via.placeholder.com/100/2F2562/FFFFFF?text=TV'}" 
                         alt="${this.channelData.name}"
                         onerror="this.src='https://via.placeholder.com/100/2F2562/FFFFFF?text=TV'">
                `;
            }
            
            if (logoFull) {
                logoFull.innerHTML = `
                    <img src="${this.channelData.image || this.channelData.logo || 'https://via.placeholder.com/200/2F2562/FFFFFF?text=TV'}" 
                         alt="${this.channelData.name}"
                         onerror="this.src='https://via.placeholder.com/200/2F2562/FFFFFF?text=TV'">
                `;
            }
            
            // تحديث الوصف
            const description = document.getElementById('channelDescription');
            if (description && this.channelData.description) {
                description.textContent = this.channelData.description;
            }
            
            // تحديث رابط المشاركة
            const shareUrl = document.getElementById('shareUrl');
            if (shareUrl) {
                shareUrl.value = window.location.href;
                this.generateQRCode();
            }
        }
    }
    
    updatePlayButton() {
        if (this.playPauseBtn) {
            const icon = this.isPlaying ? 'uil uil-pause' : 'uil uil-play';
            this.playPauseBtn.innerHTML = `<i class="${icon}"></i>`;
        }
    }
    
    updateVolumeControls() {
        if (this.muteBtn && this.volumeSlider) {
            const icon = this.isMuted ? 'uil uil-volume-mute' : 
                         this.volume < 50 ? 'uil uil-volume-down' : 'uil uil-volume-up';
            this.muteBtn.innerHTML = `<i class="${icon}"></i>`;
            this.volumeSlider.value = this.volume;
        }
    }
    
    updateFullscreenButton() {
        if (this.fullscreenBtn) {
            const icon = this.isFullscreen ? 'uil uil-compress-arrows' : 'uil uil-expand-arrows-alt';
            this.fullscreenBtn.innerHTML = `<i class="${icon}"></i>`;
        }
    }
    
    updateProgress() {
        if (this.videoPlayer && this.progressSlider) {
            const currentTime = this.videoPlayer.currentTime();
            const duration = this.videoPlayer.duration();
            
            if (duration) {
                const percentage = (currentTime / duration) * 100;
                this.progressSlider.value = percentage;
                
                // تحديث الوقت المعروض
                document.getElementById('currentTime').textContent = this.formatTime(currentTime);
                document.getElementById('duration').textContent = this.formatTime(duration);
            }
        }
    }
    
    updateLiveStatus() {
        const liveStatus = document.getElementById('liveStatus');
        const channelStatus = document.getElementById('channelStatus');
        
        if (this.isPlaying) {
            if (liveStatus) liveStatus.textContent = '◉ مباشر';
            if (channelStatus) channelStatus.textContent = '◉ متصل';
        }
    }
    
    updateQualityBadge() {
        if (this.hls && this.hls.levels && this.hls.currentLevel !== -1) {
            const level = this.hls.levels[this.hls.currentLevel];
            if (level && level.height) {
                const qualityBadge = document.getElementById('qualityBadge');
                if (qualityBadge) {
                    qualityBadge.textContent = `${level.height}p`;
                }
            }
        }
    }
    
    setupQualitySelector() {
        if (this.hls && this.hls.levels && this.hls.levels.length > 1) {
            const qualityOptions = document.querySelectorAll('.quality-option');
            qualityOptions.forEach(option => {
                option.addEventListener('click', (e) => {
                    const quality = e.currentTarget.dataset.quality;
                    this.setQuality(quality);
                    this.closeAllModals();
                });
            });
        } else {
            // إخفاء زر الجودة إذا كانت مستوى واحد فقط
            const qualityBtn = document.getElementById('qualityBtn');
            if (qualityBtn) {
                qualityBtn.style.display = 'none';
            }
        }
    }
    
    setQuality(quality) {
        if (this.hls) {
            if (quality === 'auto') {
                this.hls.currentLevel = -1;
            } else {
                const targetLevel = parseInt(quality);
                const levels = this.hls.levels;
                
                for (let i = 0; i < levels.length; i++) {
                    if (levels[i].height <= targetLevel) {
                        this.hls.currentLevel = i;
                        break;
                    }
                }
            }
            
            this.currentQuality = quality;
            this.showToast(`تم تغيير الجودة إلى: ${quality === 'auto' ? 'تلقائي' : quality + 'p'}`);
        }
    }
    
    setupStatsUpdater() {
        setInterval(() => {
            if (this.hls) {
                // تحديث الإحصائيات
                const bitrateElement = document.getElementById('bitrate');
                const bufferElement = document.getElementById('bufferTime');
                const connectionElement = document.getElementById('connectionStatus');
                
                if (bitrateElement) {
                    const bitrate = Math.round((this.hls.bandwidthEstimate || 0) / 1000);
                    bitrateElement.textContent = bitrate;
                }
                
                if (bufferElement && this.videoPlayer) {
                    const buffer = this.videoPlayer.buffered();
                    if (buffer.length > 0) {
                        const bufferEnd = buffer.end(buffer.length - 1);
                        const currentTime = this.videoPlayer.currentTime();
                        const bufferTime = (bufferEnd - currentTime).toFixed(1);
                        bufferElement.textContent = bufferTime;
                    }
                }
                
                if (connectionElement) {
                    const connectionStatus = this.videoPlayer.networkState();
                    const statusText = connectionStatus === 2 ? 'جارٍ التحميل' : 
                                      connectionStatus === 3 ? 'جاري البحث' : 'متصل';
                    connectionElement.textContent = statusText;
                }
            }
        }, 1000);
    }
    
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            
            // محاكاة تقدم التحميل
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 5;
                if (progress > 95) {
                    clearInterval(interval);
                    progress = 95;
                }
                
                const percentageElement = document.getElementById('loadingPercentage');
                const progressBar = document.querySelector('.progress-bar');
                
                if (percentageElement) {
                    percentageElement.textContent = Math.floor(progress) + '%';
                }
                
                if (progressBar) {
                    progressBar.style.width = progress + '%';
                }
            }, 200);
        }
    }
    
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            // إظهار 100% ثم الإخفاء
            const percentageElement = document.getElementById('loadingPercentage');
            const progressBar = document.querySelector('.progress-bar');
            
            if (percentageElement) percentageElement.textContent = '100%';
            if (progressBar) progressBar.style.width = '100%';
            
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }
    }
    
    showBuffering() {
        if (!this.buffering) {
            this.buffering = true;
            const videoContainer = document.querySelector('.video-container');
            if (videoContainer) {
                videoContainer.classList.add('buffering');
            }
        }
    }
    
    hideBuffering() {
        if (this.buffering) {
            this.buffering = false;
            const videoContainer = document.querySelector('.video-container');
            if (videoContainer) {
                videoContainer.classList.remove('buffering');
            }
        }
    }
    
    showError(message) {
        const overlay = document.getElementById('errorOverlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        if (errorMessage && message) {
            errorMessage.textContent = message;
        }
    }
    
    hideError() {
        const overlay = document.getElementById('errorOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    showQualityModal() {
        const modal = document.getElementById('qualityModal');
        if (modal) {
            modal.style.display = 'block';
            
            // تفعيل الخيار الحالي
            document.querySelectorAll('.quality-option').forEach(option => {
                option.classList.remove('active');
                if (option.dataset.quality === this.currentQuality) {
                    option.classList.add('active');
                }
            });
        }
    }
    
    showShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.style.display = 'block';
            
            // إعداد أحداث المشاركة
            document.querySelectorAll('.share-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const app = e.currentTarget.dataset.app;
                    this.shareToApp(app);
                });
            });
            
            // نسخ الرابط
            document.getElementById('copyLink').addEventListener('click', () => {
                this.copyToClipboard();
            });
        }
    }
    
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'block';
            
            // تعيين القيم الحالية
            const playbackSpeed = document.getElementById('playbackSpeed');
            if (playbackSpeed && this.videoPlayer) {
                playbackSpeed.value = this.videoPlayer.playbackRate();
            }
            
            // إعادة التعيين
            document.getElementById('resetSettings').addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    retryStream() {
        this.hideError();
        this.loadStream();
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
    
    shareToApp(app) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.channelData?.name || 'مشاهدة القناة');
        const text = encodeURIComponent(`شاهد ${this.channelData?.name || 'هذه القناة'} على وسيل لايف برو`);
        
        let shareUrl = '';
        
        switch(app) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${text}%20${url}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    copyToClipboard() {
        const shareUrl = document.getElementById('shareUrl');
        if (shareUrl) {
            shareUrl.select();
            shareUrl.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                this.showToast('تم نسخ الرابط إلى الحافظة ✓');
            } catch (err) {
                this.showToast('تعذر نسخ الرابط');
            }
        }
    }
    
    generateQRCode() {
        const qrcodeElement = document.getElementById('qrcode');
        if (qrcodeElement && window.QRCode) {
            qrcodeElement.innerHTML = '';
            const qrcode = new QRCode(qrcodeElement, {
                text: window.location.href,
                width: 128,
                height: 128,
                colorDark: "#42318F",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }
    
    resetSettings() {
        // إعادة تعيين إعدادات الفيديو
        if (this.videoPlayer) {
            this.videoPlayer.playbackRate(1);
            this.videoPlayer.volume(1);
            this.videoPlayer.muted(false);
        }
        
        // إعادة تعيين عناصر التحكم
        const playbackSpeed = document.getElementById('playbackSpeed');
        if (playbackSpeed) playbackSpeed.value = 1;
        
        this.showToast('تم إعادة تعيين الإعدادات');
        this.closeAllModals();
    }
    
    showSkipNotification(seconds) {
        const notification = document.createElement('div');
        notification.className = 'skip-notification';
        notification.innerHTML = `
            <i class="uil uil-arrow-${seconds > 0 ? 'right' : 'left'}"></i>
            <span>${Math.abs(seconds)} ثانية</span>
        `;
        
        document.querySelector('.video-container').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 1000);
    }
    
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="uil ${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        toastContainer.appendChild(toast);
        
        // إضافة حدث الإغلاق
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });
        
        // إزالة تلقائية بعد 3 ثواني
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
    
    getToastIcon(type) {
        switch(type) {
            case 'success': return 'uil-check-circle';
            case 'error': return 'uil-times-circle';
            case 'warning': return 'uil-exclamation-triangle';
            default: return 'uil-info-circle';
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
    
    // تنظيف عند إغلاق الصفحة
    destroy() {
        if (this.hls) {
            this.hls.destroy();
        }
        
        if (this.videoPlayer) {
            this.videoPlayer.dispose();
        }
        
        console.log('🗑️ تم تنظيف المشغل');
    }
}

// بدء تشغيل المشغل
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 تهيئة مشغل الفيديو...');
    window.videoPlayer = new VideoPlayerApp();
});

// جعل المشغل متاحاً في جميع الصفحات
window.openPlayer = function(channelData) {
    // بناء رابط المشغل
    let playerUrl = 'player.html?';
    
    if (channelData.url) {
        playerUrl += `stream=${encodeURIComponent(channelData.url)}`;
    } else if (channelData.id) {
        playerUrl += `channel=${encodeURIComponent(channelData.id)}`;
    }
    
    if (channelData.name) {
        playerUrl += `&name=${encodeURIComponent(channelData.name)}`;
    }
    
    if (channelData.image || channelData.logo) {
        playerUrl += `&logo=${encodeURIComponent(channelData.image || channelData.logo)}`;
    }
    
    // فتح المشغل في نافذة جديدة
    const playerWindow = window.open(playerUrl, '_blank', 
        'width=1200,height=700,resizable=yes,scrollbars=yes');
    
    if (playerWindow) {
        playerWindow.focus();
        return true;
    } else {
        // إذا تم منع النوافذ المنبثقة، افتح في نفس الصفحة
        window.location.href = playerUrl;
        return false;
    }
};

// دالة سريعة للتحقق من دعم التشغيل
window.canPlayStream = function(url) {
    const video = document.createElement('video');
    
    if (url.includes('.m3u8')) {
        return video.canPlayType('application/vnd.apple.mpegurl') || 
               typeof Hls !== 'undefined';
    }
    
    if (url.includes('.mpd')) {
        return video.canPlayType('application/dash+xml');
    }
    
    if (url.includes('.mp4')) {
        return video.canPlayType('video/mp4');
    }
    
    return false;
};
