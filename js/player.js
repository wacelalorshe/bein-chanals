// js/player.js
// مشغل الفيديو الاحترافي مع معالجة الأخطاء المتقدمة

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
        this.stats = {
            bitrate: 0,
            bufferLength: 0,
            droppedFrames: 0,
            connectionTime: 0
        };
        
        // تحسينات CORS
        this.corsProxyEnabled = false;
        this.corsProxyUrl = 'https://cors-anywhere.herokuapp.com/'; // CORS proxy بديل
        
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
        await this.loadStream();
        
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
                    url: streamUrl,
                    type: this.detectStreamType(streamUrl)
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
    
    detectStreamType(url) {
        if (url.includes('.m3u8')) return 'hls';
        if (url.includes('.mpd')) return 'dash';
        if (url.includes('.mp4')) return 'mp4';
        if (url.includes('.m3u')) return 'm3u';
        if (url.includes('.ts')) return 'ts';
        return 'unknown';
    }
    
    async loadStream() {
        try {
            this.showLoading();
            
            // تحديد رابط البث
            let streamUrl = this.channelData?.url;
            
            if (!streamUrl || streamUrl === '#') {
                throw new Error('رابط البث غير متوفر');
            }
            
            console.log('📡 جاري تحميل البث:', streamUrl);
            console.log('📊 نوع البث:', this.channelData?.type);
            
            // التحقق من صحة الرابط
            const isValid = await this.validateStreamUrl(streamUrl);
            if (!isValid) {
                console.log('⚠️ الرابط غير صالح، محاولة استخدام CORS proxy...');
                streamUrl = await this.fixStreamUrl(streamUrl);
            }
            
            this.streamUrl = streamUrl;
            
            // التحقق من نوع الرابط واختيار طريقة التشغيل المناسبة
            const streamType = this.channelData?.type || this.detectStreamType(streamUrl);
            
            switch(streamType) {
                case 'hls':
                case 'm3u':
                case 'm3u8':
                    await this.loadHLSStream(streamUrl);
                    break;
                case 'mp4':
                    await this.loadMP4Stream(streamUrl);
                    break;
                case 'dash':
                    await this.loadDASHStream(streamUrl);
                    break;
                default:
                    // محاولة تشغيل كـ HLS بشكل افتراضي
                    await this.loadHLSStream(streamUrl);
            }
            
        } catch (error) {
            console.error('❌ فشل تحميل البث:', error);
            this.handleStreamError(error);
        }
    }
    
    async validateStreamUrl(url) {
        try {
            console.log('🔍 التحقق من صحة الرابط:', url);
            
            // إذا كان الرابط نسبي (لا يحتوي على http/https)
            if (!url.startsWith('http')) {
                console.log('⚠️ الرابط نسبي، تحويل إلى رابط كامل');
                return false;
            }
            
            // اختبار بسيط للرابط
            const testRequest = await fetch(url, {
                method: 'HEAD',
                mode: 'no-cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }).catch(() => null);
            
            return true;
            
        } catch (error) {
            console.log('❌ فشل التحقق من الرابط:', error);
            return false;
        }
    }
    
    async fixStreamUrl(originalUrl) {
        try {
            // 1. محاولة إصلاح الروابط النسبية
            if (originalUrl.startsWith('//')) {
                return `https:${originalUrl}`;
            }
            
            if (!originalUrl.startsWith('http')) {
                // إذا كان الرابط بدون بروتوكول
                return `https://${originalUrl}`;
            }
            
            // 2. التحقق من CORS issues
            try {
                // اختبار CORS
                const test = await fetch(originalUrl, { mode: 'no-cors' });
                return originalUrl;
            } catch (corsError) {
                console.log('⚠️ مشكلة CORS، محاولة استخدام CORS proxy');
                this.corsProxyEnabled = true;
                
                // استخدام CORS proxy
                const proxyUrl = this.corsProxyUrl + originalUrl;
                console.log('🔄 استخدام CORS proxy:', proxyUrl);
                return proxyUrl;
            }
            
        } catch (error) {
            console.error('❌ فشل إصلاح الرابط:', error);
            return originalUrl; // العودة للرابط الأصلي
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
                    manifestLoadingTimeOut: 15000, // زيادة المهلة
                    manifestLoadingMaxRetry: 3,
                    manifestLoadingRetryDelay: 1000,
                    manifestLoadingMaxRetryTimeout: 30000,
                    levelLoadingTimeOut: 15000,
                    levelLoadingMaxRetry: 3,
                    levelLoadingRetryDelay: 1000,
                    levelLoadingMaxRetryTimeout: 30000,
                    fragLoadingTimeOut: 30000, // زيادة المهلة
                    fragLoadingMaxRetry: 3,
                    fragLoadingRetryDelay: 1000,
                    fragLoadingMaxRetryTimeout: 30000,
                    xhrSetup: (xhr, url) => {
                        // إضافة headers للتعامل مع CORS
                        xhr.withCredentials = false;
                        xhr.setRequestHeader('Accept', '*/*');
                        xhr.setRequestHeader('Accept-Language', 'ar,en;q=0.9');
                        xhr.setRequestHeader('Cache-Control', 'no-cache');
                        xhr.setRequestHeader('Pragma', 'no-cache');
                        
                        // إضافة User-Agent
                        xhr.setRequestHeader('User-Agent', 
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
                        
                        // إذا كان هناك مشكلة CORS، أضف المزيد من headers
                        if (this.corsProxyEnabled) {
                            xhr.setRequestHeader('Origin', window.location.origin);
                            xhr.setRequestHeader('Referer', window.location.origin + '/');
                        }
                    }
                });
                
                // أحداث HLS
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('✅ تم تحليل قائمة التشغيل بنجاح');
                    this.hideLoading();
                    this.play();
                    this.setupQualitySelector();
                    this.retryCount = 0; // إعادة تعيين عداد المحاولات
                });
                
                this.hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
                    console.log(`📊 تم تحميل مستوى الجودة: ${data.level}`);
                    this.updateStats();
                });
                
                this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                    console.log(`🔄 تغيير الجودة إلى: ${data.level}`);
                    this.updateQualityBadge();
                });
                
                this.hls.on(Hls.Events.FRAG_BUFFERED, (event, data) => {
                    console.log('📦 تم تخزين الجزء:', data.stats);
                    this.updateStats();
                });
                
                this.hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('❌ خطأ HLS:', data);
                    
                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                console.log('🔄 إعادة المحاولة بعد خطأ في الشبكة');
                                
                                // محاولة إعادة الاتصال
                                if (this.retryCount < this.maxRetries) {
                                    this.retryCount++;
                                    console.log(`🔄 المحاولة ${this.retryCount} من ${this.maxRetries}`);
                                    
                                    setTimeout(() => {
                                        if (this.hls) {
                                            this.hls.startLoad();
                                        }
                                    }, 2000 * this.retryCount); // زيادة التأخير مع كل محاولة
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
                                
                                // محاولة تشغيل كـ MP4 مباشر إذا أمكن
                                if (this.streamUrl.includes('.mp4')) {
                                    this.loadMP4Stream(this.streamUrl);
                                } else {
                                    this.showError('خطأ غير قابل للاسترداد في البث');
                                }
                                break;
                        }
                    }
                });
                
                // تحميل الملف الرئيسي
                try {
                    this.hls.loadSource(url);
                    this.hls.attachMedia(this.videoPlayer.el().querySelector('video'));
                    console.log('✅ تم تحميل مصدر HLS');
                } catch (loadError) {
                    console.error('❌ فشل تحميل مصدر HLS:', loadError);
                    reject(loadError);
                }
                
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
                console.log('❌ المتصفح لا يدعم HLS');
                
                // محاولة تحويل إلى MP4 إذا أمكن
                if (url.includes('.m3u8')) {
                    // محاولة استخراج روابط MP4 من ملف m3u8
                    this.extractMP4FromM3U8(url).then(mp4Url => {
                        if (mp4Url) {
                            this.loadMP4Stream(mp4Url);
                            resolve(true);
                        } else {
                            reject(new Error('المتصفح لا يدعم HLS ولم يتم العثور على بديل MP4'));
                        }
                    });
                } else {
                    reject(new Error('المتصفح لا يدعم HLS'));
                }
            }
        });
    }
    
    async extractMP4FromM3U8(m3u8Url) {
        try {
            console.log('🔍 محاولة استخراج MP4 من M3U8:', m3u8Url);
            
            const response = await fetch(m3u8Url, {
                headers: {
                    'Accept': '*/*',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const m3u8Content = await response.text();
            
            // البحث عن روابط .ts أو .mp4 في ملف m3u8
            const lines = m3u8Content.split('\n');
            let baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
            
            for (let line of lines) {
                line = line.trim();
                
                // البحث عن روابط .mp4
                if (line.endsWith('.mp4') && !line.startsWith('#')) {
                    if (line.startsWith('http')) {
                        return line;
                    } else {
                        return baseUrl + line;
                    }
                }
                
                // البحث عن روابط .ts (يمكن تحويلها)
                if (line.endsWith('.ts') && !line.startsWith('#')) {
                    console.log('📦 تم العثور على رابط .ts:', line);
                    // يمكنك هنا محاولة تحويل .ts إلى .mp4 باستخدام خدمة
                    // لكن هذا يتطلب سيرفر تحويل
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ فشل استخراج MP4:', error);
            return null;
        }
    }
    
    async loadMP4Stream(url) {
        console.log('🎬 تحميل MP4 مباشر:', url);
        
        try {
            // اختبار الرابط أولاً
            const test = await fetch(url, { method: 'HEAD' }).catch(() => null);
            
            if (!test || test.status !== 200) {
                console.log('⚠️ رابط MP4 غير متاح، محاولة فتح في نافذة جديدة');
                this.openInExternalPlayer(url);
                return;
            }
            
            this.videoPlayer.src({
                src: url,
                type: 'video/mp4'
            });
            
            this.hideLoading();
            this.play();
            
        } catch (error) {
            console.error('❌ فشل تحميل MP4:', error);
            this.openInExternalPlayer(url);
        }
    }
    
    openInExternalPlayer(url) {
        console.log('🔗 فتح الرابط في مشغل خارجي');
        
        // إنشاء رابط مؤقت لفتح في نافذة جديدة
        const tempPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>مشغل الفيديو</title>
                <style>
                    body { margin: 0; padding: 0; background: #000; }
                    video { width: 100vw; height: 100vh; }
                </style>
            </head>
            <body>
                <video controls autoplay>
                    <source src="${url}" type="video/mp4">
                    متصفحك لا يدعم تشغيل الفيديو.
                </video>
                <script>
                    document.querySelector('video').play().catch(e => console.log(e));
                </script>
            </body>
            </html>
        `;
        
        const blob = new Blob([tempPage], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        
        window.open(blobUrl, '_blank', 'width=800,height=600');
        
        // تنظيف الذاكرة
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
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
        } else if (error.message.includes('network')) {
            errorMessage = 'مشكلة في الشبكة. تحقق من اتصال الإنترنت.';
        }
        
        this.showError(errorMessage);
        
        // عرض خيارات بديلة
        this.showAlternativeOptions();
    }
    
    showAlternativeOptions() {
        const errorOverlay = document.getElementById('errorOverlay');
        if (!errorOverlay) return;
        
        // إضافة خيارات بديلة
        const alternativeOptions = document.createElement('div');
        alternativeOptions.className = 'alternative-options';
        alternativeOptions.innerHTML = `
            <h4>خيارات بديلة:</h4>
            <div class="alt-options-grid">
                <button class="alt-option" onclick="window.videoPlayer.tryWithProxy()">
                    <i class="uil uil-sync"></i>
                    <span>محاولة باستخدام CORS Proxy</span>
                </button>
                <button class="alt-option" onclick="window.videoPlayer.openInNewTab()">
                    <i class="uil uil-external-link-alt"></i>
                    <span>فتح في نافذة جديدة</span>
                </button>
                <button class="alt-option" onclick="window.videoPlayer.tryXpolaPlayer()">
                    <i class="uil uil-play-circle"></i>
                    <span>فتح في XPola Player</span>
                </button>
            </div>
        `;
        
        errorOverlay.appendChild(alternativeOptions);
        
        // إضافة CSS للخيارات البديلة
        if (!document.querySelector('#alternative-styles')) {
            const style = document.createElement('style');
            style.id = 'alternative-styles';
            style.textContent = `
                .alternative-options {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }
                .alternative-options h4 {
                    color: white;
                    margin-bottom: 15px;
                    font-size: 1.1rem;
                }
                .alt-options-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 10px;
                }
                .alt-option {
                    background: rgba(66, 49, 143, 0.3);
                    border: 1px solid #42318F;
                    border-radius: 10px;
                    padding: 12px;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .alt-option:hover {
                    background: rgba(66, 49, 143, 0.5);
                    border-color: #654FD4;
                }
                .alt-option i {
                    font-size: 1.2rem;
                }
                .alt-option span {
                    font-size: 0.9rem;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    tryWithProxy() {
        console.log('🔄 محاولة باستخدام CORS Proxy');
        
        if (this.streamUrl) {
            this.corsProxyEnabled = true;
            const proxyUrl = this.corsProxyUrl + this.streamUrl;
            this.retryStream(proxyUrl);
        }
    }
    
    openInNewTab() {
        console.log('🔗 فتح في نافذة جديدة');
        
        if (this.streamUrl) {
            window.open(this.streamUrl, '_blank');
        }
    }
    
    tryXpolaPlayer() {
        console.log('🎮 فتح في XPola Player');
        
        if (this.channelData?.url) {
            // فتح في XPola عبر intent
            const xpolaUrl = `intent://play?url=${encodeURIComponent(this.channelData.url)}#Intent;package=com.xpola.player;scheme=xpola;end`;
            
            window.location.href = xpolaUrl;
            
            // إذا فشل intent، افتح الرابط مباشرة
            setTimeout(() => {
                window.open(this.channelData.url, '_blank');
            }, 500);
        }
    }
    
    retryStream(newUrl = null) {
        console.log('🔄 إعادة محاولة تشغيل البث...');
        
        this.hideError();
        this.showLoading();
        
        if (newUrl) {
            this.streamUrl = newUrl;
        }
        
        // إعادة تعيين HLS إذا كان موجوداً
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        // إعادة المحاولة بعد تأخير قصير
        setTimeout(() => {
            if (this.streamUrl) {
                this.loadHLSStream(this.streamUrl).catch(error => {
                    console.error('❌ فشل إعادة المحاولة:', error);
                    this.showError('فشل الاتصال بعد عدة محاولات');
                });
            }
        }, 1000);
    }
    
    // باقي الدوال تبقى كما هي...
    // ... (الأجزاء الأخرى من الكود تبقى بدون تغيير)
    
    showError(message) {
        const overlay = document.getElementById('errorOverlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (overlay) {
            overlay.style.display = 'flex';
        }
        
        if (errorMessage && message) {
            errorMessage.textContent = message;
        }
        
        // إعادة تعيين عداد المحاولات
        this.retryCount = 0;
    }
    
    hideError() {
        const overlay = document.getElementById('errorOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            // إزالة الخيارات البديلة إذا كانت موجودة
            const altOptions = overlay.querySelector('.alternative-options');
            if (altOptions) {
                altOptions.remove();
            }
        }
    }
    
    // ... (باقي الدوال)
}

// بدء تشغيل المشغل
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 تهيئة مشغل الفيديو...');
    window.videoPlayer = new VideoPlayerApp();
});
