// Professional Video Player
class ProfessionalVideoPlayer {
    constructor() {
        this.currentChannel = null;
        this.currentStream = null;
        this.qualityLevels = [];
        this.currentQuality = 'auto';
        this.player = null;
        this.hls = null;
        this.isFullscreen = false;
        this.isPIP = false;
        this.bufferInterval = null;
        this.init();
    }

    async init() {
        console.log('🎬 بدء تشغيل المشغل الاحترافي...');
        
        // تعيين السنة الحالية
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // الحصول على بيانات القناة من URL
        this.getChannelDataFromURL();
        
        // تهيئة مشغل الفيديو
        this.initializePlayer();
        
        // إعداد مستمعي الأحداث
        this.setupEventListeners();
        
        // بدء مراقبة البافر والاتصال
        this.startMonitoring();
        
        console.log('✅ المشغل الاحترافي جاهز');
    }

    getChannelDataFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const streamUrl = urlParams.get('stream');
        const channelId = urlParams.get('channel');
        const channelName = urlParams.get('name');
        
        console.log('📡 بيانات البث:', { streamUrl, channelId, channelName });
        
        if (!streamUrl) {
            this.showError('لم يتم تحديد رابط البث', 'الرجاء اختيار قناة أخرى');
            return;
        }
        
        this.currentStream = streamUrl;
        this.currentChannel = {
            id: channelId,
            name: channelName || 'قناة غير معروفة',
            streamUrl: streamUrl
        };
        
        // تحديث واجهة المستخدم
        this.updateUI();
    }

    initializePlayer() {
        console.log('🎥 تهيئة مشغل الفيديو...');
        
        const videoElement = document.getElementById('mainVideoPlayer');
        
        // خيارات Video.js
        const playerOptions = {
            controls: true,
            autoplay: true,
            preload: 'auto',
            responsive: true,
            fluid: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            controlBar: {
                children: [
                    'playToggle',
                    'volumePanel',
                    'currentTimeDisplay',
                    'timeDivider',
                    'durationDisplay',
                    'progressControl',
                    'liveDisplay',
                    'remainingTimeDisplay',
                    'customControlSpacer',
                    'playbackRateMenuButton',
                    'chaptersButton',
                    'descriptionsButton',
                    'subsCapsButton',
                    'audioTrackButton',
                    'fullscreenToggle'
                ]
            },
            html5: {
                hlsjsConfig: {
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90,
                    maxBufferSize: 60 * 1000 * 1000,
                    maxBufferLength: 30,
                    maxMaxBufferLength: 60,
                    maxBufferHole: 0.5,
                    maxFragLookUpTolerance: 0.25,
                    liveSyncDurationCount: 3,
                    liveMaxLatencyDurationCount: 10,
                    liveDurationInfinity: true,
                    levelLoadingTimeOut: 10000,
                    levelLoadingRetryDelay: 1000,
                    levelLoadingMaxRetry: 4,
                    manifestLoadingTimeOut: 10000,
                    manifestLoadingRetryDelay: 1000,
                    manifestLoadingMaxRetry: 4,
                    fragLoadingTimeOut: 20000,
                    fragLoadingRetryDelay: 1000,
                    fragLoadingMaxRetry: 6,
                    startFragPrefetch: true,
                    testBandwidth: true,
                    progressive: false,
                    lowLatencyMode: true,
                    enableDateRangeMetadataCues: true,
                    enableWebVTT: true,
                    enableIMSC1: true,
                    enableCEA708Captions: true,
                    enableEIA608Captions: true,
                    enableID3FrameParsing: true,
                    smoothQualityChange: true,
                    abrEwmaFastLive: 3,
                    abrEwmaSlowLive: 9,
                    abrEwmaFastVoD: 3,
                    abrEwmaSlowVoD: 9,
                    abrEwmaDefaultEstimate: 500000,
                    abrBandWidthFactor: 0.95,
                    abrBandWidthUpFactor: 0.7,
                    maxStarvationDelay: 4,
                    maxLoadingDelay: 4
                }
            }
        };
        
        // إنشاء مشغل Video.js
        this.player = videojs(videoElement, playerOptions);
        
        // إعداد حدث عند الاستعداد
        this.player.ready(() => {
            console.log('✅ Video.js جاهز');
            this.loadStream();
        });
        
        // إعداد مستمعي الأحداث للـ player
        this.setupPlayerEvents();
    }

    setupPlayerEvents() {
        // حدث التحميل
        this.player.on('loadstart', () => {
            console.log('⏳ بدء تحميل البث...');
            this.showLoading(true);
        });
        
        // حدث البث جاهز
        this.player.on('loadedmetadata', () => {
            console.log('✅ بيانات البث محملة');
            this.showLoading(false);
            this.incrementViewCount();
        });
        
        // حدث تشغيل
        this.player.on('playing', () => {
            console.log('▶️ البث يعمل الآن');
        });
        
        // حدث توقف
        this.player.on('pause', () => {
            console.log('⏸️ البث متوقف');
        });
        
        // حدث إنهاء
        this.player.on('ended', () => {
            console.log('🏁 انتهى البث');
        });
        
        // حدث خطأ
        this.player.on('error', (e) => {
            console.error('❌ خطأ في المشغل:', e);
            this.handlePlayerError(e);
        });
        
        // تغيير الجودة
        this.player.on('qualitychange', (e) => {
            const quality = e.selectedIndex;
            console.log(`🔄 تغيير الجودة إلى: ${quality}`);
            this.updateQualityIndicator(quality);
        });
        
        // وقت التخزين المؤقت
        this.player.on('progress', () => {
            const buffered = this.player.buffered();
            if (buffered.length > 0) {
                const bufferedEnd = buffered.end(buffered.length - 1);
                const duration = this.player.duration();
                if (duration > 0) {
                    const bufferPercent = (bufferedEnd / duration) * 100;
                    this.updateBufferStatus(bufferPercent);
                }
            }
        });
    }

    async loadStream() {
        if (!this.currentStream) {
            this.showError('رابط البث غير متوفر', 'يرجى اختيار قناة أخرى');
            return;
        }
        
        console.log('🔗 جاري تحميل البث:', this.currentStream);
        
        // التحقق من نوع الملف
        const isM3U8 = this.currentStream.includes('.m3u8');
        const isMPD = this.currentStream.includes('.mpd');
        const isMP4 = this.currentStream.includes('.mp4') || this.currentStream.includes('.webm');
        
        try {
            if (isM3U8 && Hls.isSupported()) {
                // استخدام HLS.js لمقاطع HLS
                await this.loadHLSStream();
            } else if (isMPD) {
                // DASH streams (يمكن إضافتها لاحقاً)
                this.loadDirectStream();
            } else if (isMP4) {
                // MP4 مباشر
                this.loadDirectStream();
            } else {
                // محاولة مباشرة
                this.loadDirectStream();
            }
        } catch (error) {
            console.error('❌ فشل تحميل البث:', error);
            this.showError('فشل تحميل البث', error.message);
        }
    }

    async loadHLSStream() {
        console.log('🔄 استخدام HLS.js للبث...');
        
        // إنشاء نسخة جديدة من HLS
        if (this.hls) {
            this.hls.destroy();
        }
        
        this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferSize: 60 * 1000 * 1000
        });
        
        // ربط HLS مع مشغل Video.js
        this.hls.attachMedia(this.player.el().querySelector('video'));
        
        // تحميل playlist
        this.hls.loadSource(this.currentStream);
        
        // عند تحميل playlist
        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('📊 Manifest محمل، المستويات المتاحة:', data.levels.length);
            
            // حفظ مستويات الجودة
            this.qualityLevels = data.levels.map((level, index) => ({
                index: index,
                height: level.height,
                width: level.width,
                bitrate: level.bitrate,
                name: this.getQualityName(level.height)
            }));
            
            // تحديث خيارات الجودة
            this.updateQualityOptions();
            
            // بدء التشغيل
            this.player.play();
        });
        
        // أحداث HLS
        this.hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
            console.log(`📶 المستوى ${data.level} محمل`);
        });
        
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            console.log(`🔄 التبديل إلى المستوى ${data.level}`);
            const quality = this.qualityLevels.find(q => q.index === data.level);
            if (quality) {
                this.updateQualityIndicator(quality.name);
            }
        });
        
        this.hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('❌ خطأ HLS:', data);
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('🔌 خطأ في الشبكة، إعادة المحاولة...');
                        this.hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('🎞️ خطأ في الوسائط، إعادة التحميل...');
                        this.hls.recoverMediaError();
                        break;
                    default:
                        console.log('⚠️ خطأ غير قابل للاسترداد');
                        this.hls.destroy();
                        this.loadDirectStream();
                        break;
                }
            }
        });
    }

    loadDirectStream() {
        console.log('🔗 تحميل البث مباشرة...');
        
        // إعداد مصدر الفيديو مباشرة
        const videoSrc = {
            src: this.currentStream,
            type: this.getVideoType(this.currentStream)
        };
        
        this.player.src(videoSrc);
        this.player.play();
    }

    getVideoType(url) {
        if (url.includes('.m3u8')) return 'application/x-mpegURL';
        if (url.includes('.mpd')) return 'application/dash+xml';
        if (url.includes('.mp4')) return 'video/mp4';
        if (url.includes('.webm')) return 'video/webm';
        return 'video/mp4';
    }

    getQualityName(height) {
        if (height >= 2160) return '4K';
        if (height >= 1440) return '2K';
        if (height >= 1080) return '1080p';
        if (height >= 720) return '720p';
        if (height >= 480) return '480p';
        if (height >= 360) return '360p';
        return 'منخفضة';
    }

    updateQualityOptions() {
        const container = document.getElementById('qualityOptions');
        if (!container) return;
        
        // خيار تلقائي
        container.innerHTML = `
            <div class="quality-option ${this.currentQuality === 'auto' ? 'active' : ''}" 
                 data-quality="auto" onclick="window.videoPlayer.setQuality('auto')">
                <div class="quality-check">
                    <i class="uil uil-check-circle"></i>
                </div>
                <div class="quality-info">
                    <h6>تلقائي (مستحسن)</h6>
                    <p>يتكيف مع سرعة الإنترنت لديك</p>
                </div>
            </div>
        `;
        
        // إضافة مستويات الجودة
        this.qualityLevels.forEach(level => {
            const qualityName = level.name;
            const isActive = this.currentQuality === qualityName;
            
            container.innerHTML += `
                <div class="quality-option ${isActive ? 'active' : ''}" 
                     data-quality="${qualityName}" onclick="window.videoPlayer.setQuality('${qualityName}', ${level.index})">
                    <div class="quality-check">
                        <i class="uil uil-check-circle"></i>
                    </div>
                    <div class="quality-info">
                        <h6>${qualityName}</h6>
                        <p>${Math.round(level.bitrate / 1000)} كيلوبت/ثانية - ${level.width}×${level.height}</p>
                    </div>
                </div>
            `;
        });
    }

    setQuality(qualityName, levelIndex = -1) {
        console.log(`🔄 تعيين الجودة إلى: ${qualityName}`);
        
        this.currentQuality = qualityName;
        
        if (this.hls && levelIndex !== -1) {
            this.hls.currentLevel = levelIndex;
        }
        
        // تحديث الواجهة
        this.updateQualityIndicator(qualityName);
        this.updateQualityOptions();
        this.closeQualityModal();
    }

    updateQualityIndicator(quality) {
        const indicator = document.getElementById('qualityIndicator');
        if (indicator) {
            const span = indicator.querySelector('span');
            if (span) {
                span.textContent = quality;
            }
        }
    }

    updateUI() {
        if (!this.currentChannel) return;
        
        // تحديث العنوان
        document.getElementById('channelTitle').textContent = this.currentChannel.name;
        document.getElementById('videoTitle').textContent = this.currentChannel.name;
        
        // تحديث الشعار (لو كان متوفراً)
        const channelLogo = document.getElementById('channelLogo').querySelector('img');
        // هنا يمكن إضافة منطق لجلب الشعار من قاعدة البيانات
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showError(title, message) {
        const overlay = document.getElementById('errorOverlay');
        const errorTitle = document.getElementById('errorTitle');
        const errorMessage = document.getElementById('errorMessage');
        
        if (overlay && errorTitle && errorMessage) {
            errorTitle.textContent = title;
            errorMessage.textContent = message;
            overlay.style.display = 'flex';
        }
        
        // إخفاء التحميل
        this.showLoading(false);
    }

    hideError() {
        const overlay = document.getElementById('errorOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    handlePlayerError(error) {
        console.error('🎬 خطأ المشغل:', error);
        
        let errorMessage = 'حدث خطأ غير معروف';
        let errorTitle = 'فشل التشغيل';
        
        if (error.code) {
            switch(error.code) {
                case 1:
                    errorTitle = 'طلب الوسائط مرفوض';
                    errorMessage = 'تم إلغاء تحميل الفيديو من قبل المستخدم';
                    break;
                case 2:
                    errorTitle = 'خطأ في الشبكة';
                    errorMessage = 'حدث خطأ في الشبكة أثناء تحميل الفيديو';
                    break;
                case 3:
                    errorTitle = 'خطأ في فك الترميز';
                    errorMessage = 'حدث خطأ أثناء فك تشفير الفيديو';
                    break;
                case 4:
                    errorTitle = 'تنسيق غير مدعوم';
                    errorMessage = 'تنسيق الفيديو غير مدعوم من قبل المتصفح';
                    break;
                default:
                    errorTitle = 'خطأ في تشغيل الفيديو';
                    errorMessage = 'حدث خطأ أثناء تشغيل الفيديو';
            }
        }
        
        this.showError(errorTitle, errorMessage);
    }

    setupEventListeners() {
        // زر إعادة المحاولة
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.hideError();
                this.loadStream();
            });
        }
        
        // زر تغيير المشغل
        const changePlayerBtn = document.getElementById('changePlayerBtn');
        if (changePlayerBtn) {
            changePlayerBtn.addEventListener('click', () => {
                this.openInExternalPlayer();
            });
        }
        
        // زر الجودة
        const qualityBtn = document.getElementById('qualityBtn');
        if (qualityBtn) {
            qualityBtn.addEventListener('click', () => {
                this.showQualityModal();
            });
        }
        
        // زر ملء الشاشة
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // زر صورة داخل صورة
        const pipBtn = document.getElementById('pipBtn');
        if (pipBtn) {
            pipBtn.addEventListener('click', () => {
                this.togglePictureInPicture();
            });
            
            // التحقق من دعم PiP
            if (!document.pictureInPictureEnabled) {
                pipBtn.style.display = 'none';
            }
        }
        
        // إغلاق نافذة الجودة
        const closeQualityModal = document.getElementById('closeQualityModal');
        if (closeQualityModal) {
            closeQualityModal.addEventListener('click', () => {
                this.closeQualityModal();
            });
        }
        
        // إغلاق عند النقر خارج النافذة
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('qualityModal');
            if (modal && e.target === modal) {
                this.closeQualityModal();
            }
        });
    }

    showQualityModal() {
        const modal = document.getElementById('qualityModal');
        if (modal) {
            modal.style.display = 'block';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    }

    closeQualityModal() {
        const modal = document.getElementById('qualityModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    toggleFullscreen() {
        const videoContainer = document.querySelector('.video-wrapper');
        
        if (!this.isFullscreen) {
            if (videoContainer.requestFullscreen) {
                videoContainer.requestFullscreen();
            } else if (videoContainer.mozRequestFullScreen) {
                videoContainer.mozRequestFullScreen();
            } else if (videoContainer.webkitRequestFullscreen) {
                videoContainer.webkitRequestFullscreen();
            } else if (videoContainer.msRequestFullscreen) {
                videoContainer.msRequestFullscreen();
            }
            this.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.isFullscreen = false;
        }
    }

    async togglePictureInPicture() {
        const videoElement = this.player.el().querySelector('video');
        
        try {
            if (!this.isPIP) {
                await videoElement.requestPictureInPicture();
                this.isPIP = true;
            } else {
                await document.exitPictureInPicture();
                this.isPIP = false;
            }
        } catch (error) {
            console.error('❌ خطأ في PiP:', error);
        }
    }

    startMonitoring() {
        // تحديث حالة الاتصال كل 5 ثواني
        this.bufferInterval = setInterval(() => {
            this.updateConnectionStatus();
        }, 5000);
    }

    updateConnectionStatus() {
        if (!this.player) return;
        
        // عرض عرض النطاق الترددي
        const bandwidth = document.getElementById('bandwidth');
        if (bandwidth && this.hls) {
            const bitrate = this.hls.bandwidthEstimate || 0;
            bandwidth.textContent = Math.round(bitrate / 1000);
        }
        
        // عرض حالة الاتصال
        const connection = document.getElementById('connection');
        if (connection) {
            if (navigator.onLine) {
                connection.textContent = 'متصل';
                connection.style.color = '#28a745';
            } else {
                connection.textContent = 'غير متصل';
                connection.style.color = '#dc3545';
            }
        }
    }

    updateBufferStatus(percent) {
        const bufferElement = document.getElementById('buffer');
        if (bufferElement) {
            bufferElement.textContent = Math.round(percent);
        }
    }

    incrementViewCount() {
        // زيادة عداد المشاهدات في localStorage
        const channelId = this.currentChannel?.id;
        if (!channelId) return;
        
        try {
            let viewStats = JSON.parse(localStorage.getItem('view_stats') || '{}');
            
            if (!viewStats[channelId]) {
                viewStats[channelId] = { count: 0, lastView: null };
            }
            
            viewStats[channelId].count++;
            viewStats[channelId].lastView = new Date().toISOString();
            
            localStorage.setItem('view_stats', JSON.stringify(viewStats));
            
            // تحديث العرض
            const viewCountElement = document.getElementById('viewCount');
            if (viewCountElement) {
                viewCountElement.textContent = viewStats[channelId].count;
            }
        } catch (error) {
            console.warn('⚠️ فشل تحديث عداد المشاهدات:', error);
        }
    }

    openInExternalPlayer() {
        if (!this.currentStream) return;
        
        // محاولة فتح في XPola Player
        const xpolaUrl = `intent://play?url=${encodeURIComponent(this.currentStream)}#Intent;package=com.xpola.player;scheme=xpola;end`;
        window.location.href = xpolaUrl;
        
        // إذا فشل intent، افتح الرابط مباشرة
        setTimeout(() => {
            window.open(this.currentStream, '_blank');
        }, 500);
    }

    loadRelatedChannels() {
        // هذه الدالة يمكن تطويرها لتحميل القنوات المشابهة من قاعدة البيانات
        const container = document.getElementById('relatedChannelsGrid');
        if (!container) return;
        
        container.innerHTML = `
            <div class="channel-card-small">
                <div class="channel-logo-tiny">
                    <img src="https://via.placeholder.com/40/2F2562/FFFFFF?text=TV" alt="قناة">
                </div>
                <p class="channel-name-small">قناة رياضية</p>
            </div>
            <div class="channel-card-small">
                <div class="channel-logo-tiny">
                    <img src="https://via.placeholder.com/40/2F2562/FFFFFF?text=TV" alt="قناة">
                </div>
                <p class="channel-name-small">أخبار</p>
            </div>
            <div class="channel-card-small">
                <div class="channel-logo-tiny">
                    <img src="https://via.placeholder.com/40/2F2562/FFFFFF?text=TV" alt="قناة">
                </div>
                <p class="channel-name-small">تسلية</p>
            </div>
        `;
    }

    destroy() {
        // تنظيف الموارد
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        
        if (this.player) {
            this.player.dispose();
            this.player = null;
        }
        
        if (this.bufferInterval) {
            clearInterval(this.bufferInterval);
            this.bufferInterval = null;
        }
    }
}

// بدء المشغل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 تهيئة مشغل الفيديو...');
    window.videoPlayer = new ProfessionalVideoPlayer();
});

// جعل الدوال متاحة عالمياً
window.reloadPlayer = function() {
    if (window.videoPlayer) {
        window.videoPlayer.loadStream();
    }
};
