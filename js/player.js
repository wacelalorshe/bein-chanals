// Professional Video Player v2.0
// مع إصلاحات Logo ودعم متعدد للروابط
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
        this.channelLogo = null;
        this.backupStreams = [];
        this.isLoading = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }

    async init() {
        console.log('🎬 بدء تشغيل المشغل الاحترافي v2.0...');
        
        // تعيين السنة الحالية
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // الحصول على بيانات القناة من URL
        await this.getChannelDataFromURL();
        
        // تهيئة مشغل الفيديو
        this.initializePlayer();
        
        // إعداد مستمعي الأحداث
        this.setupEventListeners();
        
        // تحميل القنوات المشابهة
        this.loadRelatedChannels();
        
        // بدء مراقبة البافر والاتصال
        this.startMonitoring();
        
        console.log('✅ المشغل الاحترافي جاهز');
    }

    async getChannelDataFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const streamUrl = urlParams.get('stream');
        const channelId = urlParams.get('channel');
        const channelName = urlParams.get('name');
        const channelImage = urlParams.get('image');
        const channelDescription = urlParams.get('description');
        
        console.log('📡 بيانات القناة:', {
            streamUrl,
            channelId,
            channelName,
            channelImage,
            channelDescription
        });
        
        if (!streamUrl) {
            this.showError('لم يتم تحديد رابط البث', 'الرجاء اختيار قناة أخرى');
            return;
        }
        
        this.currentChannel = {
            id: channelId || 'unknown',
            name: channelName || 'قناة غير معروفة',
            image: channelImage || 'https://via.placeholder.com/200x150/2F2562/FFFFFF?text=BEIN+TV',
            description: channelDescription || '',
            streamUrl: streamUrl
        };
        
        // تهيئة روابط احتياطية
        this.backupStreams = this.generateBackupStreams(streamUrl);
        
        // تحديث واجهة المستخدم
        this.updateUI();
    }

    generateBackupStreams(mainStream) {
        // إنشاء روابط احتياطية مختلفة
        const baseUrl = mainStream.replace(/(https?:\/\/[^\/]+).*/, '$1');
        const fileName = mainStream.split('/').pop();
        
        return [
            mainStream,
            `http://135.125.109.73:9000/${fileName}`,
            `${baseUrl}:8000/${fileName}`,
            `${baseUrl.replace('http://', 'https://')}/${fileName}`,
            `${baseUrl.replace(/(\d+\.\d+\.\d+\.\d+)/, 'backup.$1')}/${fileName}`
        ].filter((stream, index, self) => 
            stream && self.indexOf(stream) === index
        );
    }

    initializePlayer() {
        console.log('🎥 تهيئة مشغل الفيديو...');
        
        const videoElement = document.getElementById('mainVideoPlayer');
        
        // خيارات Video.js مع تحسينات
        const playerOptions = {
            controls: true,
            autoplay: true,
            preload: 'auto',
            responsive: true,
            fluid: true,
            playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
            liveui: true,
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
                ],
                volumePanel: {
                    inline: false,
                    vertical: true
                }
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
                    maxLoadingDelay: 4,
                    fragLoadingRetryDelay: 500
                }
            },
            sources: [{
                src: this.currentStream,
                type: 'application/x-mpegURL'
            }]
        };
        
        // إنشاء مشغل Video.js
        this.player = videojs(videoElement, playerOptions, () => {
            console.log('✅ Video.js جاهز للاستخدام');
            this.player.log.level('debug');
        });
        
        // إضافة CSS مخصص للمشغل
        this.addCustomPlayerStyles();
        
        // إعداد حدث عند الاستعداد
        this.player.ready(() => {
            console.log('✅ Player ready event fired');
            this.loadStream();
        });
        
        // إعداد مستمعي الأحداث للـ player
        this.setupPlayerEvents();
    }

    addCustomPlayerStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .video-js .vjs-big-play-button {
                background: linear-gradient(135deg, #2F2562, #654FD4) !important;
                border: none !important;
                width: 80px !important;
                height: 80px !important;
                border-radius: 50% !important;
                line-height: 80px !important;
                font-size: 3rem !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
            }
            
            .video-js .vjs-control-bar {
                background: linear-gradient(to top, rgba(47, 37, 98, 0.9), rgba(101, 79, 212, 0.8)) !important;
                height: 50px !important;
                padding: 0 10px !important;
            }
            
            .video-js .vjs-play-progress,
            .video-js .vjs-volume-level {
                background: #654FD4 !important;
            }
            
            .video-js .vjs-slider {
                background: rgba(255,255,255,0.2) !important;
            }
            
            .video-js .vjs-play-progress:before {
                color: #654FD4 !important;
            }
            
            .video-js:hover .vjs-big-play-button {
                background: linear-gradient(135deg, #654FD4, #2F2562) !important;
                transform: translate(-50%, -50%) scale(1.1) !important;
                transition: all 0.3s ease !important;
            }
            
            .video-js .vjs-menu-button-popup .vjs-menu {
                background: #2F2562 !important;
                border: 1px solid #654FD4 !important;
            }
            
            .video-js .vjs-menu-item:hover {
                background: #654FD4 !important;
            }
            
            .video-js .vjs-loading-spinner {
                border-color: #654FD4 rgba(255,255,255,0.1) rgba(255,255,255,0.1) rgba(255,255,255,0.1) !important;
            }
            
            .vjs-quality-selector .vjs-menu-button {
                margin: 0 5px !important;
            }
        `;
        document.head.appendChild(style);
    }

    setupPlayerEvents() {
        // حدث التحميل
        this.player.on('loadstart', () => {
            console.log('⏳ بدء تحميل البث...');
            this.isLoading = true;
            this.showLoading(true);
        });
        
        // حدث البث جاهز
        this.player.on('loadedmetadata', () => {
            console.log('✅ بيانات البث محملة');
            this.isLoading = false;
            this.showLoading(false);
            this.incrementViewCount();
            this.updateVideoTime();
        });
        
        // حدث تشغيل
        this.player.on('playing', () => {
            console.log('▶️ البث يعمل الآن');
            this.hideError();
            this.updateConnectionStatus('متصل - يعمل');
        });
        
        // حدث توقف
        this.player.on('pause', () => {
            console.log('⏸️ البث متوقف');
        });
        
        // حدث إنهاء
        this.player.on('ended', () => {
            console.log('🏁 انتهى البث');
            this.showMessage('انتهى البث', 'info');
        });
        
        // حدث خطأ
        this.player.on('error', (e) => {
            console.error('❌ خطأ في المشغل:', e, this.player.error());
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
            this.updateBufferStatus();
        });
        
        // حدث الوقت
        this.player.on('timeupdate', () => {
            this.updateVideoTime();
        });
        
        // حدث تغيير الحجم
        this.player.on('fullscreenchange', () => {
            this.isFullscreen = this.player.isFullscreen();
            console.log(this.isFullscreen ? '🖥️ ملء الشاشة' : '📱 الخروج من ملء الشاشة');
        });
    }

    async loadStream() {
        if (!this.currentChannel?.streamUrl) {
            this.showError('رابط البث غير متوفر', 'يرجى اختيار قناة أخرى');
            return;
        }
        
        console.log('🔗 جاري تحميل البث:', this.currentChannel.streamUrl);
        
        // إعادة تعيين عداد المحاولات
        this.retryCount = 0;
        
        // محاولة التحميل مع الروابط الاحتياطية
        await this.tryLoadWithBackups();
    }

    async tryLoadWithBackups() {
        for (let i = 0; i < this.backupStreams.length; i++) {
            if (i > 0) {
                this.showMessage(`جاري تجربة رابط بديل ${i}/${this.backupStreams.length - 1}`, 'warning');
            }
            
            const success = await this.trySingleStream(this.backupStreams[i]);
            if (success) {
                console.log(`✅ نجح الرابط ${i + 1}: ${this.backupStreams[i]}`);
                return;
            }
            
            console.warn(`⚠️ فشل الرابط ${i + 1}: ${this.backupStreams[i]}`);
        }
        
        // فشلت جميع الروابط
        this.showError('فشل جميع مصادر البث', 
            'يرجى المحاولة لاحقاً أو اختيار قناة أخرى');
    }

    async trySingleStream(streamUrl) {
        return new Promise((resolve) => {
            console.log(`🔄 محاولة تشغيل: ${streamUrl}`);
            
            // التحقق من نوع الملف
            const isM3U8 = streamUrl.includes('.m3u8');
            const isMPD = streamUrl.includes('.mpd');
            const isMP4 = streamUrl.includes('.mp4') || streamUrl.includes('.webm');
            
            if (isM3U8 && Hls.isSupported()) {
                this.loadHLSStream(streamUrl, resolve);
            } else if (isMP4 || isMPD) {
                this.loadDirectStream(streamUrl, resolve);
            } else {
                // محاولة HLS ثم مباشر
                if (Hls.isSupported()) {
                    this.loadHLSStream(streamUrl, resolve);
                } else {
                    this.loadDirectStream(streamUrl, resolve);
                }
            }
            
            // مهلة انتظار
            setTimeout(() => {
                resolve(false);
            }, 10000);
        });
    }

    loadHLSStream(streamUrl, resolve) {
        if (this.hls) {
            this.hls.destroy();
        }
        
        this.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 60,
            maxBufferSize: 30 * 1000 * 1000,
            manifestLoadingTimeOut: 10000,
            manifestLoadingMaxRetry: 3,
            levelLoadingTimeOut: 10000,
            levelLoadingMaxRetry: 3,
            fragLoadingTimeOut: 15000,
            fragLoadingMaxRetry: 4
        });
        
        const videoElement = this.player.el().querySelector('video');
        this.hls.attachMedia(videoElement);
        
        // أحداث HLS
        this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
            console.log('📊 Manifest محمل، المستويات المتاحة:', data.levels?.length || 0);
            
            if (data.levels && data.levels.length > 0) {
                this.qualityLevels = data.levels.map((level, index) => ({
                    index: index,
                    height: level.height,
                    width: level.width,
                    bitrate: level.bitrate,
                    name: this.getQualityName(level.height),
                    codec: level.codec
                }));
                
                this.updateQualityOptions();
                
                // تعيين الجودة التلقائية
                this.hls.currentLevel = -1;
            }
            
            // بدء التشغيل
            videoElement.play().then(() => {
                console.log('✅ بدء التشغيل بنجاح');
                resolve(true);
            }).catch(error => {
                console.warn('⚠️ لا يمكن التشغيل التلقائي:', error);
                resolve(true); // الرابط يعمل لكن التشغيل التلقائي محظور
            });
        });
        
        this.hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
            console.log(`📶 المستوى ${data.level} محمل`);
        });
        
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            console.log(`🔄 التبديل إلى المستوى ${data.level}`);
            const quality = this.qualityLevels.find(q => q.index === data.level);
            if (quality) {
                this.updateQualityIndicator(quality.name);
                this.updateConnectionStatus(`جودة: ${quality.name}`);
            }
        });
        
        this.hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('❌ خطأ HLS:', data);
            
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('🔌 خطأ في الشبكة');
                        this.hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('🎞️ خطأ في الوسائط');
                        this.hls.recoverMediaError();
                        break;
                    default:
                        console.log('⚠️ خطأ غير قابل للاسترداد');
                        this.hls.destroy();
                        resolve(false);
                        break;
                }
            }
        });
        
        // تحميل المصدر
        try {
            this.hls.loadSource(streamUrl);
        } catch (error) {
            console.error('❌ فشل تحميل المصدر:', error);
            resolve(false);
        }
    }

    loadDirectStream(streamUrl, resolve) {
        console.log('🔗 تحميل البث مباشرة...');
        
        const videoType = this.getVideoType(streamUrl);
        
        // تحديث مصدر المشغل
        this.player.src({
            src: streamUrl,
            type: videoType
        });
        
        // محاولة التشغيل
        this.player.play().then(() => {
            console.log('✅ البث المباشر يعمل');
            resolve(true);
        }).catch(error => {
            console.warn('⚠️ فشل التشغيل المباشر:', error);
            // قد يكون الرابط صالح لكن التشغيل التلقائي محظور
            resolve(true);
        });
    }

    getVideoType(url) {
        if (url.includes('.m3u8')) return 'application/x-mpegURL';
        if (url.includes('.mpd')) return 'application/dash+xml';
        if (url.includes('.mp4')) return 'video/mp4';
        if (url.includes('.webm')) return 'video/webm';
        if (url.includes('.ogg')) return 'video/ogg';
        return 'video/mp4';
    }

    getQualityName(height) {
        if (!height) return 'مجهولة';
        if (height >= 2160) return '4K';
        if (height >= 1440) return '2K';
        if (height >= 1080) return '1080p';
        if (height >= 720) return '720p';
        if (height >= 480) return '480p';
        if (height >= 360) return '360p';
        return 'منخفضة';
    }

    updateUI() {
        if (!this.currentChannel) return;
        
        console.log('🔄 تحديث واجهة القناة:', this.currentChannel);
        
        // تحديث العنوان
        const titleElement = document.getElementById('channelTitle');
        const videoTitleElement = document.getElementById('videoTitle');
        
        if (titleElement) titleElement.textContent = this.currentChannel.name;
        if (videoTitleElement) videoTitleElement.textContent = this.currentChannel.name;
        
        // تحديث Logo مع معالجة الأخطاء - الإصلاح هنا
        this.updateChannelLogo();
        
        // تحديث الوصف إذا كان موجوداً
        const descriptionElement = document.getElementById('videoDescription');
        if (descriptionElement && this.currentChannel.description) {
            descriptionElement.textContent = this.currentChannel.description;
            descriptionElement.style.display = 'block';
        }
        
        // تحديث عداد المشاهدات
        this.updateViewCount();
    }

    updateChannelLogo() {
        const logoContainer = document.getElementById('channelLogo');
        if (!logoContainer) {
            console.error('❌ حاوية الـ Logo غير موجودة');
            return;
        }
        
        // إنشاء عنصر الصورة إذا لم يكن موجوداً
        let logoImg = logoContainer.querySelector('img');
        if (!logoImg) {
            logoImg = document.createElement('img');
            logoImg.alt = this.currentChannel.name;
            logoImg.style.width = '100%';
            logoImg.style.height = '100%';
            logoImg.style.objectFit = 'cover';
            logoContainer.appendChild(logoImg);
        }
        
        // تعيين الصورة مع معالجة الأخطاء
        const logoUrl = this.currentChannel.image || 
                       'https://via.placeholder.com/60/2F2562/FFFFFF?text=' + 
                       encodeURIComponent(this.currentChannel.name.substring(0, 2));
        
        console.log('🖼️ محاولة تحميل Logo:', logoUrl);
        
        logoImg.src = logoUrl;
        
        // معالجة الأخطاء في تحميل الصورة
        logoImg.onload = () => {
            console.log('✅ تم تحميل Logo بنجاح');
            logoImg.style.opacity = '1';
        };
        
        logoImg.onerror = () => {
            console.warn('⚠️ فشل تحميل Logo، استخدام البديل');
            // استخدام صورة بديلة
            logoImg.src = this.generateFallbackLogo(this.currentChannel.name);
            logoImg.style.opacity = '1';
        };
        
        // إضافة مؤشر تحميل
        logoImg.style.opacity = '0';
        logoImg.style.transition = 'opacity 0.3s ease';
    }

    generateFallbackLogo(channelName) {
        // توليد لون فريد حسب اسم القناة
        const colors = [
            '#2F2562', '#654FD4', '#FF6B6B', '#4ECDC4', '#FFD166',
            '#06D6A0', '#118AB2', '#EF476F', '#073B4C', '#7209B7'
        ];
        
        const hash = channelName.split('').reduce((acc, char) => {
            return char.charCodeAt(0) + ((acc << 5) - acc);
        }, 0);
        
        const colorIndex = Math.abs(hash) % colors.length;
        const color = colors[colorIndex];
        
        const initials = channelName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
        
        return `https://via.placeholder.com/60/${color.replace('#', '')}/FFFFFF?text=${encodeURIComponent(initials)}`;
    }

    updateQualityOptions() {
        const container = document.getElementById('qualityOptions');
        if (!container) return;
        
        // خيار تلقائي
        let optionsHTML = `
            <div class="quality-option ${this.currentQuality === 'auto' ? 'active' : ''}" 
                 data-quality="auto" onclick="window.videoPlayer.setQuality('auto')">
                <div class="quality-check">
                    <i class="uil uil-check-circle"></i>
                </div>
                <div class="quality-info">
                    <h6>تلقائي (مستحسن)</h6>
                    <p>يتكيف مع سرعة الإنترنت لديك</p>
                    <small class="text-muted">يختار أفضل جودة تلقائياً</small>
                </div>
            </div>
        `;
        
        // إضافة مستويات الجودة
        if (this.qualityLevels && this.qualityLevels.length > 0) {
            this.qualityLevels.forEach(level => {
                const qualityName = level.name;
                const isActive = this.currentQuality === qualityName;
                
                optionsHTML += `
                    <div class="quality-option ${isActive ? 'active' : ''}" 
                         data-quality="${qualityName}" onclick="window.videoPlayer.setQuality('${qualityName}', ${level.index})">
                        <div class="quality-check">
                            <i class="uil uil-check-circle"></i>
                        </div>
                        <div class="quality-info">
                            <h6>${qualityName} ${level.codec ? `(${level.codec})` : ''}</h6>
                            <p>${Math.round(level.bitrate / 1000)} كيلوبت/ثانية - ${level.width}×${level.height}</p>
                            <small class="text-muted">${this.getBandwidthDescription(level.bitrate)}</small>
                        </div>
                    </div>
                `;
            });
        } else {
            optionsHTML += `
                <div class="quality-option disabled">
                    <div class="quality-check">
                        <i class="uil uil-info-circle"></i>
                    </div>
                    <div class="quality-info">
                        <h6>جودة واحدة</h6>
                        <p>هذا البث يدعم جودة واحدة فقط</p>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = optionsHTML;
    }

    getBandwidthDescription(bitrate) {
        if (bitrate > 8000000) return 'ممتازة - 8Mbps+';
        if (bitrate > 4000000) return 'جيدة جداً - 4-8Mbps';
        if (bitrate > 2000000) return 'جيدة - 2-4Mbps';
        if (bitrate > 1000000) return 'متوسطة - 1-2Mbps';
        return 'منخفضة - أقل من 1Mbps';
    }

    setQuality(qualityName, levelIndex = -1) {
        console.log(`🔄 تعيين الجودة إلى: ${qualityName}`);
        
        this.currentQuality = qualityName;
        
        if (this.hls) {
            if (qualityName === 'auto') {
                this.hls.currentLevel = -1;
            } else if (levelIndex !== -1) {
                this.hls.currentLevel = levelIndex;
            }
        }
        
        // تحديث الواجهة
        this.updateQualityIndicator(qualityName);
        this.updateQualityOptions();
        this.closeQualityModal();
        
        this.showMessage(`تم تغيير الجودة إلى ${qualityName}`, 'success');
    }

    updateQualityIndicator(quality) {
        const indicator = document.getElementById('qualityIndicator');
        if (indicator) {
            const span = indicator.querySelector('span');
            if (span) {
                span.textContent = quality;
                span.style.color = this.getQualityColor(quality);
            }
        }
    }

    getQualityColor(quality) {
        switch(quality) {
            case '4K': return '#00ff00';
            case '1080p': return '#00cc00';
            case '720p': return '#ffcc00';
            case '480p': return '#ff9900';
            case '360p': return '#ff6600';
            default: return '#654FD4';
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
            
            if (show) {
                overlay.innerHTML = `
                    <div class="loading-content">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">جاري التحميل...</span>
                        </div>
                        <p class="mt-2">جاري تحميل البث...</p>
                        <small>${this.currentChannel?.name || 'القناة'}</small>
                        <div class="loading-progress mt-2">
                            <div class="progress" style="height: 4px; width: 200px;">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     style="width: 100%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }
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
            
            // تحديث أزرار الإجراءات
            const retryBtn = document.getElementById('retryBtn');
            const changePlayerBtn = document.getElementById('changePlayerBtn');
            
            if (retryBtn) {
                retryBtn.onclick = () => {
                    this.hideError();
                    this.retryLoad();
                };
            }
            
            if (changePlayerBtn) {
                changePlayerBtn.onclick = () => {
                    this.openInExternalPlayer();
                };
            }
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
        console.error('🎬 خطأ المشغل:', this.player?.error());
        
        const playerError = this.player?.error();
        let errorMessage = 'حدث خطأ غير معروف';
        let errorTitle = 'فشل التشغيل';
        
        if (playerError) {
            switch(playerError.code) {
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
                    errorMessage = playerError.message || 'حدث خطأ أثناء تشغيل الفيديو';
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
                this.retryLoad();
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
        
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    this.player.paused() ? this.player.play() : this.player.pause();
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
                case 'm':
                    this.player.muted(!this.player.muted());
                    break;
                case 'arrowleft':
                    this.player.currentTime(this.player.currentTime() - 10);
                    break;
                case 'arrowright':
                    this.player.currentTime(this.player.currentTime() + 10);
                    break;
                case 'arrowup':
                    this.player.volume(Math.min(this.player.volume() + 0.1, 1));
                    break;
                case 'arrowdown':
                    this.player.volume(Math.max(this.player.volume() - 0.1, 0));
                    break;
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
        if (!this.isFullscreen) {
            if (this.player.requestFullscreen) {
                this.player.requestFullscreen();
            } else if (this.player.mozRequestFullScreen) {
                this.player.mozRequestFullScreen();
            } else if (this.player.webkitRequestFullscreen) {
                this.player.webkitRequestFullscreen();
            } else if (this.player.msRequestFullscreen) {
                this.player.msRequestFullscreen();
            }
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
        }
    }

    async togglePictureInPicture() {
        const videoElement = this.player.el().querySelector('video');
        
        try {
            if (!this.isPIP) {
                await videoElement.requestPictureInPicture();
                this.isPIP = true;
                this.showMessage('تفعيل وضع الصورة داخل الصورة', 'info');
            } else {
                await document.exitPictureInPicture();
                this.isPIP = false;
                this.showMessage('إلغاء وضع الصورة داخل الصورة', 'info');
            }
        } catch (error) {
            console.error('❌ خطأ في PiP:', error);
            this.showMessage('المتصفح لا يدعم الصورة داخل الصورة', 'warning');
        }
    }

    startMonitoring() {
        // تحديث حالة الاتصال كل 5 ثواني
        this.bufferInterval = setInterval(() => {
            this.updateConnectionStatus();
            this.updateBandwidth();
        }, 5000);
        
        // تحديث الوقت كل ثانية
        setInterval(() => {
            this.updateVideoTime();
        }, 1000);
    }

    updateConnectionStatus(status) {
        const connectionElement = document.getElementById('connection');
        if (!connectionElement) return;
        
        if (status) {
            connectionElement.textContent = status;
            connectionElement.style.color = '#28a745';
        } else {
            if (navigator.onLine) {
                if (this.player && !this.player.paused()) {
                    connectionElement.textContent = 'متصل - يعمل';
                    connectionElement.style.color = '#28a745';
                } else {
                    connectionElement.textContent = 'متصل - متوقف';
                    connectionElement.style.color = '#ffc107';
                }
            } else {
                connectionElement.textContent = 'غير متصل';
                connectionElement.style.color = '#dc3545';
            }
        }
    }

    updateBandwidth() {
        const bandwidthElement = document.getElementById('bandwidth');
        if (!bandwidthElement || !this.hls) return;
        
        const bitrate = this.hls.bandwidthEstimate || 0;
        bandwidthElement.textContent = Math.round(bitrate / 1000);
        
        // تحديث لون المؤشر حسب السرعة
        if (bitrate > 8000000) {
            bandwidthElement.style.color = '#00ff00';
        } else if (bitrate > 4000000) {
            bandwidthElement.style.color = '#00cc00';
        } else if (bitrate > 2000000) {
            bandwidthElement.style.color = '#ffcc00';
        } else if (bitrate > 1000000) {
            bandwidthElement.style.color = '#ff9900';
        } else {
            bandwidthElement.style.color = '#ff6600';
        }
    }

    updateBufferStatus() {
        const bufferElement = document.getElementById('buffer');
        if (!bufferElement || !this.player) return;
        
        const buffered = this.player.buffered();
        if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            const duration = this.player.duration();
            if (duration > 0) {
                const bufferPercent = (bufferedEnd / duration) * 100;
                bufferElement.textContent = Math.round(bufferPercent);
                
                // لون المؤشر حسب نسبة البافر
                if (bufferPercent > 50) {
                    bufferElement.style.color = '#28a745';
                } else if (bufferPercent > 20) {
                    bufferElement.style.color = '#ffc107';
                } else {
                    bufferElement.style.color = '#dc3545';
                }
            }
        }
    }

    updateVideoTime() {
        const timeElement = document.getElementById('videoTime');
        if (!timeElement || !this.player) return;
        
        const current = this.player.currentTime();
        const duration = this.player.duration();
        
        if (duration && !isNaN(duration)) {
            const currentStr = this.formatTime(current);
            const durationStr = this.formatTime(duration);
            timeElement.textContent = `${currentStr} / ${durationStr}`;
        } else {
            timeElement.textContent = this.formatTime(current);
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    incrementViewCount() {
        const channelId = this.currentChannel?.id;
        if (!channelId) return;
        
        try {
            let viewStats = JSON.parse(localStorage.getItem('view_stats') || '{}');
            
            if (!viewStats[channelId]) {
                viewStats[channelId] = { 
                    count: 0, 
                    lastView: null,
                    name: this.currentChannel.name 
                };
            }
            
            // زيادة العداد فقط إذا مرت 30 ثانية من المشاهدة الأخيرة
            const lastView = new Date(viewStats[channelId].lastView);
            const now = new Date();
            const diffSeconds = (now - lastView) / 1000;
            
            if (diffSeconds > 30 || !viewStats[channelId].lastView) {
                viewStats[channelId].count++;
                viewStats[channelId].lastView = now.toISOString();
                viewStats[channelId].name = this.currentChannel.name;
                
                localStorage.setItem('view_stats', JSON.stringify(viewStats));
                console.log(`👁️ زيادة عداد المشاهدات: ${viewStats[channelId].count}`);
                
                this.updateViewCount();
            }
        } catch (error) {
            console.warn('⚠️ فشل تحديث عداد المشاهدات:', error);
        }
    }

    updateViewCount() {
        const channelId = this.currentChannel?.id;
        if (!channelId) return;
        
        try {
            const viewStats = JSON.parse(localStorage.getItem('view_stats') || '{}');
            const channelStats = viewStats[channelId];
            
            const viewCountElement = document.getElementById('viewCount');
            if (viewCountElement && channelStats) {
                viewCountElement.textContent = channelStats.count;
            }
        } catch (error) {
            console.warn('⚠️ فشل تحديث عرض المشاهدات:', error);
        }
    }

    openInExternalPlayer() {
        if (!this.currentChannel?.streamUrl) return;
        
        // محاولة فتح في XPola Player
        const xpolaUrl = `intent://play?url=${encodeURIComponent(this.currentChannel.streamUrl)}#Intent;package=com.xpola.player;scheme=xpola;end`;
        window.location.href = xpolaUrl;
        
        // إذا فشل intent، افتح الرابط مباشرة
        setTimeout(() => {
            window.open(this.currentChannel.streamUrl, '_blank');
        }, 500);
    }

    loadRelatedChannels() {
        const container = document.getElementById('relatedChannelsGrid');
        if (!container) return;
        
        // محاكاة بيانات القنوات المشابهة
        const relatedChannels = [
            { id: '1', name: 'بي إن سبورت 1', image: 'https://via.placeholder.com/40/2F2562/FFFFFF?text=B1' },
            { id: '2', name: 'بي إن سبورت 2', image: 'https://via.placeholder.com/40/654FD4/FFFFFF?text=B2' },
            { id: '3', name: 'بي إن سبورت 3', image: 'https://via.placeholder.com/40/FF6B6B/FFFFFF?text=B3' },
            { id: '4', name: 'بي إن سبورت 4', image: 'https://via.placeholder.com/40/4ECDC4/FFFFFF?text=B4' },
            { id: '5', name: 'بي إن سبورت 5', image: 'https://via.placeholder.com/40/FFD166/FFFFFF?text=B5' },
            { id: '6', name: 'بي إن سبورت 6', image: 'https://via.placeholder.com/40/06D6A0/FFFFFF?text=B6' }
        ];
        
        container.innerHTML = relatedChannels.map(channel => `
            <div class="channel-card-small" onclick="window.videoPlayer.switchToRelatedChannel('${channel.id}', '${channel.name}', '${channel.image}')">
                <div class="channel-logo-tiny">
                    <img src="${channel.image}" alt="${channel.name}" 
                         onerror="this.src='https://via.placeholder.com/40/2F2562/FFFFFF?text=TV'">
                </div>
                <p class="channel-name-small">${channel.name}</p>
            </div>
        `).join('');
    }

    switchToRelatedChannel(channelId, channelName, channelImage) {
        console.log(`🔄 التبديل إلى القناة: ${channelName}`);
        
        // هنا يمكنك جلب رابط البث الحقيقي للقناة
        // حالياً نستخدم رابط افتراضي
        const newStreamUrl = `http://135.125.109.73:9000/beinsport${channelId}.m3u8`;
        
        this.currentChannel = {
            id: channelId,
            name: channelName,
            image: channelImage,
            streamUrl: newStreamUrl
        };
        
        this.backupStreams = this.generateBackupStreams(newStreamUrl);
        
        // تحديث الواجهة
        this.updateUI();
        
        // إعادة تحميل البث
        this.loadStream();
        
        this.showMessage(`تم التبديل إلى ${channelName}`, 'info');
    }

    retryLoad() {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            console.log(`🔄 إعادة المحاولة ${this.retryCount}/${this.maxRetries}`);
            this.showMessage(`إعادة المحاولة ${this.retryCount}/${this.maxRetries}`, 'warning');
            this.loadStream();
        } else {
            this.showError('فشلت جميع محاولات إعادة الاتصال', 
                'يرجى تحديث الصفحة أو المحاولة لاحقاً');
        }
    }

    showMessage(message, type = 'info') {
        // إزالة أي رسائل سابقة
        const oldMessages = document.querySelectorAll('.player-message');
        oldMessages.forEach(msg => msg.remove());
        
        // إنشاء الرسالة الجديدة
        const messageDiv = document.createElement('div');
        messageDiv.className = `player-message alert alert-${type} alert-dismissible fade show`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            animation: slideInRight 0.3s ease;
            border: none;
            border-radius: 10px;
            padding: 12px 15px;
        `;
        
        const icon = type === 'success' ? 'uil uil-check-circle' :
                    type === 'warning' ? 'uil uil-exclamation-triangle' :
                    type === 'error' ? 'uil uil-times-circle' :
                    'uil uil-info-circle';
        
        messageDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="${icon}" style="font-size: 1.2rem;"></i>
                <span>${message}</span>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()" 
                        style="margin-right: auto; padding: 0; background: transparent; border: none; font-size: 1.2rem;">
                </button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // إزالة تلقائية بعد 3 ثواني
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.classList.remove('show');
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, 3000);
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
        
        console.log('🧹 تم تنظيف المشغل');
    }
}

// بدء المشغل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 تهيئة مشغل الفيديو المتطور...');
    
    // التحقق من دعم HLS
    if (typeof Hls === 'undefined') {
        console.error('❌ HLS.js غير محمل');
        alert('خطأ: المكتبة المطلوبة غير محملة. يرجى تحديث الصفحة.');
        return;
    }
    
    // التحقق من دعم Video.js
    if (typeof videojs === 'undefined') {
        console.error('❌ Video.js غير محمل');
        alert('خطأ: مشغل الفيديو غير محمل. يرجى تحديث الصفحة.');
        return;
    }
    
    window.videoPlayer = new ProfessionalVideoPlayer();
});

// جعل الدوال متاحة عالمياً
window.reloadPlayer = function() {
    if (window.videoPlayer) {
        window.videoPlayer.loadStream();
    }
};

window.testStream = function(url) {
    if (window.videoPlayer) {
        window.videoPlayer.currentChannel.streamUrl = url;
        window.videoPlayer.loadStream();
    }
};

// إضافة دالة لتبديل القناة مباشرة
window.switchChannel = function(channelId, channelName, channelImage, streamUrl) {
    if (window.videoPlayer) {
        window.videoPlayer.currentChannel = {
            id: channelId,
            name: channelName,
            image: channelImage,
            streamUrl: streamUrl
        };
        window.videoPlayer.updateUI();
        window.videoPlayer.loadStream();
    }
};
