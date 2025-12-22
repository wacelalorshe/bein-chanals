// js/player.js
// مشغل الفيديو المحسن لمشاكل CORS وHTTP

class VideoPlayerApp {
    constructor() {
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
        
        // CORS proxies
        this.corsProxies = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://thingproxy.freeboard.io/fetch/',
            '' // خيار بدون proxy
        ];
        
        this.currentProxyIndex = 0;
        this.streamUrl = null;
        
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
            
            console.log('📊 معلمات URL:', { channelId, channelName, streamUrl });
            
            // استخدام البيانات من المعلمات مباشرة
            this.channelData = {
                id: channelId || 'direct-' + Date.now(),
                name: channelName,
                logo: channelLogo || 'https://via.placeholder.com/100/2F2562/FFFFFF?text=TV',
                url: streamUrl || '#',
                type: streamUrl ? this.detectStreamType(streamUrl) : 'unknown'
            };
            
            this.streamUrl = streamUrl;
            
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
    
    async loadStream() {
        try {
            this.showLoading();
            
            if (!this.streamUrl || this.streamUrl === '#') {
                throw new Error('رابط البث غير متوفر');
            }
            
            console.log('📡 جاري تحميل البث:', this.streamUrl);
            
            // تحويل HTTP إلى HTTPS إذا أمكن
            let finalUrl = this.fixStreamUrl(this.streamUrl);
            console.log('🔄 الرابط المعدل:', finalUrl);
            
            // محاولة التشغيل مع دعم CORS
            await this.playWithCorsSupport(finalUrl);
            
        } catch (error) {
            console.error('❌ فشل تحميل البث:', error);
            this.handleStreamError(error);
        }
    }
    
    fixStreamUrl(url) {
        try {
            // 1. إصلاح الروابط بدون بروتوكول
            if (url.startsWith('//')) {
                url = 'https:' + url;
            }
            
            // 2. محاولة تحويل HTTP إلى HTTPS
            if (url.startsWith('http://') && !url.includes('localhost')) {
                // فقط للروابط العامة، ليس للمحلية
                const httpsUrl = url.replace('http://', 'https://');
                console.log('🔒 محاولة استخدام HTTPS:', httpsUrl);
                return httpsUrl;
            }
            
            // 3. إضافة headers لتحسين التوافق
            if (url.includes('.m3u8')) {
                // إضافة timestamp لمنع التخزين المؤقت
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}_=${Date.now()}`;
            }
            
            return url;
            
        } catch (error) {
            console.warn('⚠️ فشل إصلاح الرابط:', error);
            return url;
        }
    }
    
    async playWithCorsSupport(url) {
        const streamType = this.detectStreamType(url);
        
        if (streamType === 'hls' || streamType === 'm3u8') {
            await this.playHLSWithCors(url);
        } else if (streamType === 'mp4') {
            await this.playMP4WithCors(url);
        } else {
            await this.playDirectWithCors(url);
        }
    }
    
    async playHLSWithCors(url) {
        console.log('🎬 محاولة تشغيل HLS مع CORS support');
        
        // محاولة بدون proxy أولاً
        try {
            await this.tryHLS(url);
            return;
        } catch (error) {
            console.log('⚠️ فشل HLS المباشر، جرب CORS proxy:', error.message);
        }
        
        // محاولة مع CORS proxies
        for (let i = 0; i < this.corsProxies.length; i++) {
            if (this.corsProxies[i]) {
                const proxyUrl = this.corsProxies[i] + encodeURIComponent(url);
                console.log(`🔄 محاولة مع proxy ${i + 1}:`, proxyUrl.substring(0, 100) + '...');
                
                try {
                    await this.tryHLS(proxyUrl);
                    console.log(`✅ نجح مع proxy ${i + 1}`);
                    return;
                } catch (proxyError) {
                    console.warn(`❌ فشل proxy ${i + 1}:`, proxyError.message);
                    continue;
                }
            }
        }
        
        // إذا فشلت جميع المحاولات
        throw new Error('فشل جميع محاولات التشغيل مع CORS proxies');
    }
    
    async tryHLS(url) {
        return new Promise((resolve, reject) => {
            if (Hls.isSupported()) {
                console.log('🎬 استخدام HLS.js');
                
                if (this.hls) {
                    this.hls.destroy();
                }
                
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
                    manifestLoadingMaxRetry: 6, // زيادة عدد المحاولات
                    manifestLoadingRetryDelay: 1000,
                    levelLoadingTimeOut: 10000,
                    levelLoadingMaxRetry: 6,
                    levelLoadingRetryDelay: 1000,
                    fragLoadingTimeOut: 20000,
                    fragLoadingMaxRetry: 6,
                    fragLoadingRetryDelay: 1000,
                    xhrSetup: (xhr, xhrUrl) => {
                        // إضافة headers للتعامل مع CORS
                        xhr.withCredentials = false;
                        xhr.setRequestHeader('Accept', '*/*');
                        xhr.setRequestHeader('Accept-Language', 'ar,en;q=0.9');
                        xhr.setRequestHeader('Cache-Control', 'no-cache');
                        xhr.setRequestHeader('Pragma', 'no-cache');
                        xhr.setRequestHeader('User-Agent', 
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                        
                        // السماح بجميع الأصول
                        xhr.setRequestHeader('Origin', '*');
                        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
                        
                        console.log('📡 إرسال طلب إلى:', xhrUrl);
                    }
                });
                
                // أحداث HLS
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ تم تحليل ملف M3U8 بنجاح');
                    this.hideLoading();
                    
                    // بدء التشغيل التلقائي
                    setTimeout(() => {
                        this.play();
                        this.forcePlay(); // إضافة دفع إضافي للتشغيل
                    }, 500);
                    
                    resolve(true);
                });
                
                this.hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
                    console.log(`📊 تم تحميل مستوى الجودة: ${data.level}`);
                    this.updateStats();
                });
                
                this.hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('❌ خطأ HLS:', data);
                    
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('🔄 خطأ شبكة، إعادة المحاولة');
                                this.retryHLS(url);
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                console.log('🔄 خطأ وسائط، استعادة');
                                this.hls.recoverMediaError();
                                break;
                            default:
                                console.log('❌ خطأ غير قابل للاسترداد');
                                reject(new Error('خطأ غير قابل للاسترداد في HLS'));
                                break;
                        }
                    }
                });
                
                // بدء التحميل
                this.hls.loadSource(url);
                
                if (this.videoPlayer && this.videoPlayer.el()) {
                    const videoElement = this.videoPlayer.el().querySelector('video');
                    if (videoElement) {
                        this.hls.attachMedia(videoElement);
                        console.log('✅ تم ربط HLS بالفيديو');
                    } else {
                        reject(new Error('عنصر الفيديو غير موجود'));
                    }
                } else {
                    reject(new Error('مشغل الفيديو غير مهيأ'));
                }
                
            } else if (this.videoPlayer && this.videoPlayer.el().querySelector('video').canPlayType('application/vnd.apple.mpegurl')) {
                // دعم HLS الأصلي (Safari)
                console.log('🎬 استخدام HLS الأصلي للمتصفح');
                
                this.videoPlayer.src({
                    src: url,
                    type: 'application/x-mpegURL',
                    withCredentials: false
                });
                
                this.hideLoading();
                this.forcePlay();
                resolve(true);
                
            } else {
                reject(new Error('المتصفح لا يدعم HLS'));
            }
        });
    }
    
    retryHLS(url) {
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
    }
    
    async playMP4WithCors(url) {
        console.log('🎬 تشغيل MP4 مع CORS support');
        
        // إعداد مصدر الفيديو
        this.videoPlayer.src({
            src: url,
            type: 'video/mp4',
            withCredentials: false
        });
        
        // إضافة حدث عند تحميل البيانات
        this.videoPlayer.ready(() => {
            this.hideLoading();
            
            // محاولة التشغيل التلقائي
            setTimeout(() => {
                this.forcePlay();
            }, 1000);
        });
    }
    
    async playDirectWithCors(url) {
        console.log('🎬 تشغيل مباشر مع CORS support');
        
        // تحديد نوع الفيديو
        let type = 'video/mp4';
        if (url.includes('.webm')) type = 'video/webm';
        if (url.includes('.ogg')) type = 'video/ogg';
        
        this.videoPlayer.src({
            src: url,
            type: type,
            withCredentials: false
        });
        
        this.videoPlayer.ready(() => {
            this.hideLoading();
            setTimeout(() => {
                this.forcePlay();
            }, 1000);
        });
    }
    
    forcePlay() {
        if (!this.videoPlayer) return;
        
        console.log('▶️ محاولة تشغيل قسري');
        
        const playPromise = this.videoPlayer.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('✅ التشغيل التلقائي ناجح');
                this.isPlaying = true;
                this.updatePlayButton();
            }).catch(error => {
                console.log('⚠️ التشغيل التلقائي فشل، يحتاج تفاعل المستخدم:', error);
                
                // إظهار زر تشغيل كبير
                this.showBigPlayButton();
                
                // تحديث حالة التشغيل
                this.isPlaying = false;
                this.updatePlayButton();
            });
        }
    }
    
    showBigPlayButton() {
        // إنشاء زر تشغيل كبير
        const bigPlayBtn = document.createElement('div');
        bigPlayBtn.className = 'big-play-button-overlay';
        bigPlayBtn.innerHTML = `
            <button class="big-play-btn">
                <i class="uil uil-play-circle"></i>
                <span>انقر للتشغيل</span>
            </button>
        `;
        
        bigPlayBtn.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            cursor: pointer;
        `;
        
        const bigPlayBtnInner = bigPlayBtn.querySelector('.big-play-btn');
        bigPlayBtnInner.style.cssText = `
            background: linear-gradient(135deg, #42318F, #654FD4);
            border: none;
            border-radius: 50%;
            width: 100px;
            height: 100px;
            color: white;
            font-size: 3rem;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: transform 0.3s;
        `;
        
        bigPlayBtnInner.querySelector('span').style.cssText = `
            font-size: 0.9rem;
            margin-top: 5px;
        `;
        
        bigPlayBtnInner.onclick = (e) => {
            e.stopPropagation();
            this.videoPlayer.play().then(() => {
                bigPlayBtn.remove();
                this.isPlaying = true;
                this.updatePlayButton();
            });
        };
        
        // إضافة إلى حاوية الفيديو
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            // إزالة أي أزرار قديمة
            const oldBtn = videoContainer.querySelector('.big-play-button-overlay');
            if (oldBtn) oldBtn.remove();
            
            videoContainer.appendChild(bigPlayBtn);
        }
    }
    
    handleStreamError(error) {
        console.error('❌ خطأ في البث:', error);
        
        let errorMessage = 'تعذر تحميل البث';
        let suggestion = '';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
            errorMessage = 'فشل الاتصال بالخادم';
            suggestion = 'تحقق من اتصال الإنترنت أو حاول لاحقاً';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'مشكلة في صلاحيات الوصول';
            suggestion = 'جاري استخدام CORS proxy...';
            
            // محاولة تلقائية مع proxy التالي
            setTimeout(() => {
                this.tryNextProxy();
            }, 2000);
        } else if (error.message.includes('404')) {
            errorMessage = 'رابط البث غير موجود';
            suggestion = 'الرابط منتهي الصلاحية أو غير صحيح';
        } else if (error.message.includes('hls')) {
            errorMessage = 'مشكلة في تشغيل HLS';
            suggestion = 'جاري محاولة طرق بديلة...';
        }
        
        this.showErrorWithSuggestion(errorMessage, suggestion);
    }
    
    tryNextProxy() {
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.corsProxies.length;
        console.log(`🔄 تجربة proxy ${this.currentProxyIndex + 1}`);
        
        if (this.streamUrl) {
            this.retryStream();
        }
    }
    
    showErrorWithSuggestion(message, suggestion = '') {
        const overlay = document.getElementById('errorOverlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (overlay) {
            overlay.style.display = 'flex';
            
            // إضافة الاقتراح إذا كان موجوداً
            if (suggestion) {
                const suggestionElement = document.createElement('div');
                suggestionElement.className = 'error-suggestion';
                suggestionElement.textContent = suggestion;
                suggestionElement.style.cssText = `
                    color: #ffc107;
                    margin-top: 10px;
                    font-size: 0.9rem;
                `;
                
                errorMessage.parentNode.appendChild(suggestionElement);
            }
        }
        
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }
    
    initializePlayer() {
        try {
            // تهيئة مشغل Video.js مع إعدادات خاصة
            this.videoPlayer = videojs('videoPlayer', {
                controls: true,
                autoplay: false, // لا تشغيل تلقائي بسبب قيود المتصفح
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
                    },
                    nativeAudioTracks: false,
                    nativeVideoTracks: false,
                    nativeTextTracks: false
                },
                plugins: {
                    httpSourceSelector: {
                        default: 'auto'
                    }
                }
            });
            
            // إضافة أحداث خاصة
            this.videoPlayer.ready(() => {
                console.log('✅ مشغل الفيديو جاهز');
                
                // إضافة class للمساعدة في التصميم
                this.videoPlayer.addClass('vjs-custom-skin');
                
                // إعداد volume ابتدائي
                this.videoPlayer.volume(0.7);
                
                // إظهار controls دائماً
                this.videoPlayer.controls(true);
                
                // إضافة event للكشف عن fullscreen changes
                this.videoPlayer.on('fullscreenchange', () => {
                    this.isFullscreen = this.videoPlayer.isFullscreen();
                    console.log('🖥️ حالة fullscreen:', this.isFullscreen);
                    
                    // إذا دخل fullscreen، حاول التشغيل
                    if (this.isFullscreen && !this.isPlaying) {
                        setTimeout(() => {
                            this.forcePlay();
                        }, 500);
                    }
                });
            });
            
            // حل مشكلة التشغيل في بعض المتصفحات
            this.videoPlayer.on('play', () => {
                console.log('▶️ تم بدء التشغيل');
                this.isPlaying = true;
                this.updatePlayButton();
            });
            
            this.videoPlayer.on('pause', () => {
                console.log('⏸️ تم الإيقاف');
                this.isPlaying = false;
                this.updatePlayButton();
            });
            
            // حل مشكلة عدم ظهور الفيديو
            this.videoPlayer.on('loadeddata', () => {
                console.log('📦 تم تحميل بيانات الفيديو');
                
                // محاولة تشغيل بعد تحميل البيانات
                setTimeout(() => {
                    if (!this.isPlaying) {
                        this.forcePlay();
                    }
                }, 1000);
            });
            
        } catch (error) {
            console.error('❌ فشل تهيئة مشغل الفيديو:', error);
            this.fallbackToHTML5Player();
        }
    }
    
    // باقي الدوال تبقى كما هي مع بعض التحسينات...
    // ... [نفس الدوال السابقة مع التحسينات] ...
    
    setupControls() {
        // ربط عناصر التحكم الأساسية
        this.setupControl('playPauseBtn', () => this.togglePlay());
        this.setupControl('muteBtn', () => this.toggleMute());
        this.setupControl('fullscreenBtn', () => this.toggleFullscreen());
        
        // ربط السلايدرات
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(e.target.value);
            });
        }
        
        const progressSlider = document.getElementById('progressSlider');
        if (progressSlider) {
            progressSlider.addEventListener('input', (e) => {
                this.seek(e.target.value);
            });
        }
        
        // إضافة زر fullscreen يدوي للمساعدة
        this.addManualFullscreenButton();
    }
    
    addManualFullscreenButton() {
        // إضافة زر fullscreen إضافي
        const manualFullscreenBtn = document.createElement('button');
        manualFullscreenBtn.className = 'manual-fullscreen-btn';
        manualFullscreenBtn.innerHTML = '<i class="uil uil-expand-arrows-alt"></i>';
        manualFullscreenBtn.title = 'ملء الشاشة';
        manualFullscreenBtn.style.cssText = `
            position: absolute;
            bottom: 60px;
            left: 20px;
            z-index: 100;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            border-radius: 5px;
            padding: 8px;
            cursor: pointer;
            font-size: 1.2rem;
        `;
        
        manualFullscreenBtn.onclick = () => {
            this.toggleFullscreen();
            
            // إذا دخل fullscreen، حاول التشغيل
            if (!this.isPlaying) {
                setTimeout(() => {
                    this.forcePlay();
                }, 300);
            }
        };
        
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            videoContainer.appendChild(manualFullscreenBtn);
        }
    }
    
    toggleFullscreen() {
        if (!this.videoPlayer) return;
        
        if (this.videoPlayer.isFullscreen) {
            if (this.videoPlayer.isFullscreen()) {
                this.videoPlayer.exitFullscreen();
            } else {
                this.videoPlayer.requestFullscreen();
            }
        } else {
            // fallback يدوي
            const videoElement = this.videoPlayer.el();
            if (!document.fullscreenElement) {
                if (videoElement.requestFullscreen) {
                    videoElement.requestFullscreen();
                } else if (videoElement.webkitRequestFullscreen) {
                    videoElement.webkitRequestFullscreen();
                } else if (videoElement.msRequestFullscreen) {
                    videoElement.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
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
                const defaultLogo = `https://via.placeholder.com/${size}/2F2562/FFFFFF?text=TV`;
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
    }
    
    retryStream() {
        console.log('🔄 إعادة محاولة تشغيل البث...');
        this.hideError();
        this.showLoading();
        
        if (this.streamUrl) {
            // استخدام proxy الحالي
            const proxy = this.corsProxies[this.currentProxyIndex];
            const url = proxy ? proxy + encodeURIComponent(this.streamUrl) : this.streamUrl;
            
            setTimeout(() => {
                this.loadStream();
            }, 1000);
        }
    }
    
    // ... [بقية الدوال] ...
}

// بدء تشغيل المشغل
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 تهيئة مشغل الفيديو المحسن...');
    
    // تحميل المكتبات إذا لم تكن محملة
    const loadLibrary = (url, callback) => {
        if (url.includes('video.js') && typeof videojs === 'undefined') {
            const script = document.createElement('script');
            script.src = url;
            script.onload = callback;
            document.head.appendChild(script);
        } else if (url.includes('hls.js') && typeof Hls === 'undefined') {
            const script = document.createElement('script');
            script.src = url;
            script.onload = callback;
            document.head.appendChild(script);
        } else {
            callback();
        }
    };
    
    // تحميل المكتبات بالتسلسل
    loadLibrary('https://vjs.zencdn.net/8.6.1/video.min.js', () => {
        console.log('✅ تم تحميل Video.js');
        
        loadLibrary('https://cdn.jsdelivr.net/npm/hls.js@1.4.10/dist/hls.min.js', () => {
            console.log('✅ تم تحميل HLS.js');
            
            // بدء المشغل
            window.videoPlayer = new VideoPlayerApp();
        });
    });
});
