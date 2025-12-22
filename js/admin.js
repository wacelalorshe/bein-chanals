// ============================================
// admin.js - نظام إدارة متكامل (الإصدار الكامل)
// ============================================

// ============================================
// القسم 1: تعريف فئة AdminManager الأساسية
// ============================================
class AdminManager {
    constructor() {
        this.isAuthenticated = false;
        this.firebaseAvailable = false;
        this.firestoreAvailable = false;
        this.sections = [];
        this.channels = [];
        this.notifications = [];
        this.matches = [];
        this.editingSection = null;
        this.editingChannel = null;
        this.editingNotification = null;
        this.editingMatch = null;
        this.filteredChannels = null;
        this.currentSectionFilter = '';
        this.expandedSections = new Set();
        this.init();
    }

    async init() {
        console.log('AdminManager initializing...');
        this.checkAuthentication();
        await this.checkFirebase();
        this.setupUI();
    }

    // ============================================
    // القسم 2: دوال المصادقة والاتصال
    // ============================================
    checkAuthentication() {
        const storedAuth = localStorage.getItem('adminAuth');
        const storedEmail = localStorage.getItem('adminEmail');
        
        this.isAuthenticated = storedAuth === 'true' && storedEmail;
        
        if (this.isAuthenticated) {
            console.log('User authenticated:', storedEmail);
            this.showAdminPanel();
        } else {
            console.log('User not authenticated');
            this.showLoginRequired();
        }
    }

    async checkFirebase() {
        try {
            if (typeof firebase === 'undefined') {
                this.showFirebaseStatus('Firebase غير متاح', 'error');
                return;
            }

            await this.initializeFirebase();
            const db = this.getDB();
            
            // اختبار الاتصال
            const testDoc = db.collection('test_connection').doc('test');
            await testDoc.set({ 
                test: true, 
                timestamp: new Date(),
                message: 'Testing Firestore connection'
            });
            await testDoc.delete();
            
            this.firebaseAvailable = true;
            this.firestoreAvailable = true;
            this.showFirebaseStatus('الاتصال بقاعدة البيانات ناجح', 'success');
            
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            
            if (error.code === 'permission-denied') {
                this.showFirebaseStatus('صلاحيات غير كافية - تحقق من قواعد Firestore', 'error');
            } else if (error.code === 'unavailable') {
                this.showFirebaseStatus('لا يمكن الاتصال بقاعدة البيانات', 'warning');
            } else {
                this.showFirebaseStatus('خطأ في الاتصال بقاعدة البيانات: ' + error.message, 'error');
            }
            
            this.firebaseAvailable = false;
            this.firestoreAvailable = false;
        }
    }

    initializeFirebase() {
        return new Promise((resolve, reject) => {
            try {
                const firebaseConfig = {
                    apiKey: "AIzaSyAkgEiYYlmpMe0NLewulheovlTQMz5C980",
                    authDomain: "bein-42f9e.firebaseapp.com",
                    projectId: "bein-42f9e",
                    storageBucket: "bein-42f9e.firebasestorage.app",
                    messagingSenderId: "143741167050",
                    appId: "1:143741167050:web:922d3a0cddb40f67b21b33",
                    measurementId: "G-JH198SKCFS"
                };

                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig, 'AdminApp');
                }
                
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    getDB() {
        return firebase.firestore();
    }

    // ============================================
    // القسم 3: عرض الواجهة
    // ============================================
    showFirebaseStatus(message, type) {
        const statusElement = document.getElementById('firebaseStatus');
        const statusText = document.getElementById('firebaseStatusText');
        
        if (statusElement && statusText) {
            statusElement.style.display = 'block';
            statusText.textContent = message;
            
            statusElement.className = 'firebase-status';
            
            if (type === 'success') {
                statusElement.classList.add('firebase-success');
            } else if (type === 'error') {
                statusElement.classList.add('firebase-error');
            } else if (type === 'warning') {
                statusElement.classList.add('firebase-warning');
            }
        }
    }

    showAdminPanel() {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('loginRequired').style.display = 'none';
        this.loadAdminInterface();
    }

    showLoginRequired() {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('loginRequired').style.display = 'block';
    }

    loadAdminInterface() {
        const adminPanel = document.getElementById('adminPanel');
        
        if (!adminPanel) {
            console.error('❌ عنصر adminPanel غير موجود في الصفحة');
            return;
        }
        
        this.addCustomCSS();
        adminPanel.innerHTML = this.getAdminInterfaceHTML();
        
        this.loadData();
        this.setupTabsEvents();
    }

    addCustomCSS() {
        if (document.getElementById('admin-custom-css')) return;
        
        const style = document.createElement('style');
        style.id = 'admin-custom-css';
        style.textContent = `
            /* CSS المخصص الكامل */
            .section-channels {
                background: rgba(66, 49, 143, 0.1);
                border-radius: 10px;
                padding: 15px;
                border-left: 3px solid #42318F;
                margin-top: 10px;
                transition: all 0.3s;
            }
            
            .channel-sub-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 8px;
                border: 1px solid rgba(66, 49, 143, 0.3);
                transition: all 0.3s;
            }
            
            .channel-sub-item:hover {
                background: rgba(66, 49, 143, 0.2);
                border-color: #654FD4;
                transform: translateY(-2px);
            }
            
            .channel-sub-item .action-buttons {
                display: flex;
                gap: 5px;
            }
            
            .channel-sub-item .channel-order-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, #42318F, #654FD4);
                border-radius: 50%;
                font-weight: bold;
                font-size: 12px;
                color: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .move-up-btn, .move-down-btn {
                background: linear-gradient(135deg, #17a2b8, #138496);
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            .move-up-btn:hover:not(.disabled), 
            .move-down-btn:hover:not(.disabled) {
                background: linear-gradient(135deg, #138496, #117a8b);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            .move-up-btn.disabled, 
            .move-down-btn.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .card {
                background: rgba(0,0,0,0.7) !important;
                border: 1px solid #42318F !important;
                margin-bottom: 20px;
            }
            
            .card-header-custom {
                background: rgba(66, 49, 143, 0.3) !important;
                border-bottom: 1px solid #42318F !important;
            }
            
            .stats-card {
                background: rgba(66, 49, 143, 0.2);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                border: 1px solid #42318F;
                transition: all 0.3s;
            }
            
            .stats-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.3);
            }
            
            .stats-number {
                font-size: 32px;
                font-weight: bold;
                color: #654FD4;
                margin-bottom: 10px;
            }
            
            .stats-label {
                color: #fff;
                font-size: 14px;
            }
            
            .nav-tabs-custom .nav-link {
                color: #999;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(66,49,143,0.3);
                margin: 0 5px;
                transition: all 0.3s;
            }
            
            .nav-tabs-custom .nav-link:hover {
                color: #fff;
                background: rgba(66,49,143,0.3);
            }
            
            .nav-tabs-custom .nav-link.active {
                color: #fff;
                background: #42318F;
                border-color: #42318F;
            }
            
            .match-item, .notification-item {
                background: rgba(255,255,255,0.05);
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 10px;
                border: 1px solid rgba(66,49,143,0.3);
                transition: all 0.3s;
            }
            
            .match-item:hover, .notification-item:hover {
                background: rgba(66,49,143,0.2);
                border-color: #654FD4;
            }
            
            .section-image-preview {
                max-width: 200px;
                max-height: 150px;
                margin-top: 10px;
                border-radius: 8px;
                border: 2px solid #42318F;
                display: none;
            }
            
            .order-changes-alert {
                animation: slideIn 0.3s ease;
                border: 1px solid #ffc107;
            }
            
            .section-item {
                margin-bottom: 15px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                border: 1px solid rgba(66, 49, 143, 0.3);
            }
            
            .section-header {
                cursor: pointer;
                padding: 10px;
                border-radius: 8px;
                transition: background 0.3s;
            }
            
            .section-header:hover {
                background: rgba(66, 49, 143, 0.2);
            }
            
            .section-toggle-icon {
                transition: transform 0.3s;
            }
            
            .section-toggle-icon.rotated {
                transform: rotate(180deg);
            }
            
            .section-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .channel-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 10px;
                border: 1px solid rgba(66, 49, 143, 0.3);
                transition: all 0.3s;
            }
            
            .channel-item:hover {
                background: rgba(66, 49, 143, 0.2);
                border-color: #654FD4;
            }
            
            .channel-thumbnail {
                width: 60px;
                height: 40px;
                object-fit: cover;
                border-radius: 6px;
                border: 2px solid rgba(255,255,255,0.1);
            }
            
            .channel-order-badge-main {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 30px;
                height: 30px;
                background: linear-gradient(135deg, #42318F, #654FD4);
                border-radius: 50%;
                font-weight: bold;
                font-size: 14px;
                color: white;
                box-shadow: 0 3px 6px rgba(0,0,0,0.3);
            }
            
            .action-buttons {
                display: flex;
                gap: 5px;
            }
            
            .action-buttons .btn-sm {
                padding: 6px 10px;
                font-size: 13px;
                transition: all 0.2s ease;
            }
            
            .action-buttons .btn-sm:hover:not(.disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            .section-badge {
                background: rgba(101, 79, 212, 0.2);
                padding: 2px 8px;
                border-radius: 4px;
                border: 1px solid #654FD4;
                transition: all 0.3s ease;
            }
            
            .section-badge:hover {
                background: rgba(101, 79, 212, 0.4);
                cursor: pointer;
            }
            
            /* خيارات التشغيل الجديدة */
            .play-option-btn {
                display: flex;
                align-items: center;
                padding: 12px 15px;
                width: 100%;
                text-align: left;
                border-radius: 8px;
                transition: all 0.3s;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .play-option-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .play-option-btn .option-text {
                flex: 1;
            }
            
            .play-option-btn .option-text small {
                opacity: 0.8;
                font-size: 12px;
            }
            
            /* زر التشغيل في القائمة */
            .action-buttons .btn-success {
                background: linear-gradient(135deg, #28a745, #20c997);
                border: none;
            }
            
            .action-buttons .btn-success:hover {
                background: linear-gradient(135deg, #218838, #1e9e8a);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
            }
            
            .action-buttons .btn-success:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            @keyframes slideIn {
                from { transform: translateY(-10px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    getAdminInterfaceHTML() {
        return `
            <!-- 🔹 حالة اتصال Firebase -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5><i class="uil uil-database"></i> حالة قاعدة البيانات</h5>
                            <p id="dbStatusText" class="mb-0">
                                ${this.firestoreAvailable ? 
                                    '<span class="text-success">✅ متصل بقاعدة البيانات</span>' : 
                                    '<span class="text-warning">⚠️ قاعدة البيانات غير متاحة</span>'
                                }
                            </p>
                            ${!this.firestoreAvailable ? `
                                <div class="mt-3">
                                    <button class="btn btn-sm btn-warning me-2" onclick="adminManager.retryFirebaseConnection()">
                                        <i class="uil uil-refresh"></i> إعادة المحاولة
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 🔹 إحصائيات عامة -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number" id="totalSections">0</div>
                        <div class="stats-label">عدد الأقسام</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number" id="totalChannels">0</div>
                        <div class="stats-label">عدد القنوات</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number" id="totalMatches">0</div>
                        <div class="stats-label">عدد المباريات</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number" id="activeNotifications">0</div>
                        <div class="stats-label">الإشعارات النشطة</div>
                    </div>
                </div>
            </div>

            <!-- 🔹 تبويبات التنقل -->
            <ul class="nav nav-tabs nav-tabs-custom mb-4" id="adminTabs">
                <li class="nav-item">
                    <a class="nav-link active" data-bs-toggle="tab" href="#sectionsTab">
                        <i class="uil uil-folder"></i> إدارة الأقسام
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#channelsTab">
                        <i class="uil uil-tv"></i> إدارة القنوات
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#matchesTab">
                        <i class="uil uil-football"></i> إدارة المباريات
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#notificationsTab">
                        <i class="uil uil-bell"></i> الإشعارات
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#backupTab">
                        <i class="uil uil-database-alt"></i> النسخ الاحتياطي
                    </a>
                </li>
            </ul>

            <!-- 🔹 محتوى التبويبات -->
            <div class="tab-content">
                <!-- 🔹 تبويب إدارة الأقسام -->
                <div class="tab-pane fade show active" id="sectionsTab">
                    ${this.loadSectionsTab()}
                </div>

                <!-- 🔹 تبويب إدارة القنوات -->
                <div class="tab-pane fade" id="channelsTab">
                    ${this.loadChannelsTab()}
                </div>

                <!-- 🔹 تبويب إدارة المباريات -->
                <div class="tab-pane fade" id="matchesTab">
                    ${this.loadMatchesTab()}
                </div>

                <!-- 🔹 تبويب الإشعارات -->
                <div class="tab-pane fade" id="notificationsTab">
                    ${this.loadNotificationsTab()}
                </div>

                <!-- 🔹 تبويب النسخ الاحتياطي -->
                <div class="tab-pane fade" id="backupTab">
                    ${this.loadBackupTab()}
                </div>
            </div>

            <!-- 🔹 أزرار التنقل -->
            <div class="mt-5 text-center">
                <a href="index.html" class="btn btn-primary me-3">
                    <i class="uil uil-home"></i> العودة للرئيسية
                </a>
                <button onclick="adminManager.logout()" class="btn btn-danger">
                    <i class="uil uil-signout"></i> تسجيل الخروج
                </button>
            </div>
        `;
    }

    // ============================================
    // القسم 4: نماذج التبويبات
    // ============================================
    loadSectionsTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل قسم -->
            <div class="card mb-5">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-plus-circle"></i> 
                        <span id="sectionFormTitle">إضافة قسم جديد</span>
                    </h4>
                </div>
                <div class="card-body">
                    <form id="sectionForm" onsubmit="adminManager.saveSection(event)">
                        <input type="hidden" id="sectionId">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">اسم القسم *</label>
                                    <input type="text" id="sectionName" class="form-control" required placeholder="أدخل اسم القسم">
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">ترتيب العرض *</label>
                                    <input type="number" id="sectionOrder" class="form-control" value="1" min="1" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">حالة القسم</label>
                                    <select id="sectionStatus" class="form-control">
                                        <option value="active">نشط</option>
                                        <option value="inactive">غير نشط</option>
                                    </select>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">وصف القسم (اختياري)</label>
                                    <textarea id="sectionDescription" class="form-control" rows="3" placeholder="أدخل وصفاً للقسم"></textarea>
                                </div>
                            </div>
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label">صورة القسم (اختياري)</label>
                            <input type="text" id="sectionImage" class="form-control" placeholder="رابط الصورة (URL)" oninput="adminManager.updateImagePreview(this.value, 'sectionImagePreview')">
                            <img id="sectionImagePreview" class="section-image-preview" alt="معاينة الصورة">
                        </div>
                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-success flex-fill py-3">
                                <i class="uil uil-save"></i> 
                                <span id="sectionSaveButton">حفظ القسم</span>
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="adminManager.cancelEditSection()" id="cancelSectionEdit" style="display: none;">
                                <i class="uil uil-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- 🔹 قائمة الأقسام -->
            <div class="card">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-folder"></i> الأقسام المضافة
                        <span id="sectionsCount" class="badge bg-primary ms-2">0</span>
                    </h4>
                </div>
                <div class="card-body">
                    <div id="sectionsList">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">جاري التحميل...</span>
                            </div>
                            <p class="mt-3 text-muted">جاري تحميل الأقسام...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadChannelsTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل قناة -->
            <div class="card mb-5">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-plus-circle"></i> 
                        <span id="channelFormTitle">إضافة قناة جديدة</span>
                    </h4>
                </div>
                <div class="card-body">
                    <form id="channelForm" onsubmit="adminManager.saveChannel(event)">
                        <input type="hidden" id="channelId">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">اسم القناة *</label>
                                    <input type="text" id="channelName" class="form-control" required placeholder="أدخل اسم القناة">
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">القسم *</label>
                                    <select id="channelSection" class="form-control" required>
                                        <option value="">اختر القسم</option>
                                    </select>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">رابط الصورة</label>
                                    <input type="text" id="channelImage" class="form-control" placeholder="https://example.com/image.jpg" oninput="adminManager.updateImagePreview(this.value, 'channelImagePreview')">
                                    <img id="channelImagePreview" class="section-image-preview" alt="معاينة الصورة">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">رابط البث *</label>
                                    <textarea id="channelUrl" class="form-control" rows="3" required placeholder="أدخل رابط البث"></textarea>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">ترتيب العرض</label>
                                    <input type="number" id="channelOrder" class="form-control" value="1" min="1">
                                    <small class="text-muted" id="orderHelpText">الترتيب داخل القسم</small>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">رابط التطبيق</label>
                                    <input type="text" id="channelAppUrl" class="form-control" value="https://play.google.com/store/apps/details?id=com.xpola.player">
                                </div>
                            </div>
                        </div>
                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-success flex-fill py-3">
                                <i class="uil uil-save"></i> 
                                <span id="channelSaveButton">حفظ القناة</span>
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="adminManager.cancelEditChannel()" id="cancelChannelEdit" style="display: none;">
                                <i class="uil uil-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- 🔹 قائمة القنوات -->
            <div class="card">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-tv"></i> جميع القنوات
                        <span id="channelsCount" class="badge bg-primary ms-2">0</span>
                    </h4>
                </div>
                <div class="card-body">
                    <div id="channelsList">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">جاري التحميل...</span>
                            </div>
                            <p class="mt-3 text-muted">جاري تحميل القنوات...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadMatchesTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل مباراة -->
            <div class="card mb-5">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-plus-circle"></i> 
                        <span id="matchFormTitle">إضافة مباراة جديدة</span>
                    </h4>
                </div>
                <div class="card-body">
                    <form id="matchForm" onsubmit="adminManager.saveMatch(event)">
                        <input type="hidden" id="matchId">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">الفريق الأول *</label>
                                    <input type="text" id="team1" class="form-control" required placeholder="أدخل اسم الفريق الأول">
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">الفريق الثاني *</label>
                                    <input type="text" id="team2" class="form-control" required placeholder="أدخل اسم الفريق الثاني">
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">البطولة *</label>
                                    <input type="text" id="competition" class="form-control" required placeholder="اسم البطولة">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">تاريخ المباراة *</label>
                                    <input type="date" id="matchDate" class="form-control" required>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">وقت المباراة *</label>
                                    <input type="time" id="matchTime" class="form-control" required>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">القناة الناقلة *</label>
                                    <select id="matchChannel" class="form-control" required>
                                        <option value="">اختر القناة الناقلة</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label">حالة المباراة</label>
                            <select id="matchStatus" class="form-control">
                                <option value="upcoming">قادمة</option>
                                <option value="live">مباشرة</option>
                                <option value="finished">منتهية</option>
                            </select>
                        </div>
                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-success flex-fill py-3">
                                <i class="uil uil-save"></i> 
                                <span id="matchSaveButton">حفظ المباراة</span>
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="adminManager.cancelEditMatch()" id="cancelMatchEdit" style="display: none;">
                                <i class="uil uil-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- 🔹 قائمة المباريات -->
            <div class="card">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-football"></i> المباريات المضافة
                        <span id="matchesCount" class="badge bg-primary ms-2">0</span>
                    </h4>
                </div>
                <div class="card-body">
                    <div id="matchesList">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">جاري التحميل...</span>
                            </div>
                            <p class="mt-3 text-muted">جاري تحميل المباريات...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadNotificationsTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل إشعار -->
            <div class="card mb-5">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-plus-circle"></i> 
                        <span id="notificationFormTitle">إرسال إشعار جديد</span>
                    </h4>
                </div>
                <div class="card-body">
                    <form id="notificationForm" onsubmit="adminManager.saveNotification(event)">
                        <input type="hidden" id="notificationId">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">عنوان الإشعار *</label>
                                    <input type="text" id="notificationTitle" class="form-control" required placeholder="أدخل عنوان الإشعار">
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">نوع الإشعار</label>
                                    <select id="notificationType" class="form-control">
                                        <option value="info">معلومات</option>
                                        <option value="success">نجاح</option>
                                        <option value="warning">تحذير</option>
                                        <option value="error">خطأ</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group mb-3">
                                    <label class="form-label">حالة الإشعار</label>
                                    <select id="notificationStatus" class="form-control">
                                        <option value="active">نشط</option>
                                        <option value="inactive">غير نشط</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="form-group mb-3">
                            <label class="form-label">نص الإشعار *</label>
                            <textarea id="notificationMessage" class="form-control" rows="4" required placeholder="أدخل نص الإشعار"></textarea>
                        </div>
                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-success flex-fill py-3">
                                <i class="uil uil-megaphone"></i> 
                                <span id="notificationSaveButton">إرسال الإشعار</span>
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="adminManager.cancelEditNotification()" id="cancelNotificationEdit" style="display: none;">
                                <i class="uil uil-times"></i> إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- 🔹 قائمة الإشعارات -->
            <div class="card">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-bell"></i> الإشعارات المرسلة
                        <span id="notificationsCount" class="badge bg-primary ms-2">0</span>
                    </h4>
                </div>
                <div class="card-body">
                    <div id="notificationsList">
                        <div class="text-center py-5">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">جاري التحميل...</span>
                            </div>
                            <p class="mt-3 text-muted">جاري تحميل الإشعارات...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    loadBackupTab() {
        return `
            <!-- 🔹 إحصائيات النسخ الاحتياطي -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number backup-section-count">${this.sections.length}</div>
                        <div class="stats-label">الأقسام</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number backup-channel-count">${this.channels.length}</div>
                        <div class="stats-label">القنوات</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number backup-match-count">${this.matches.length}</div>
                        <div class="stats-label">المباريات</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stats-card">
                        <div class="stats-number backup-notification-count">${this.notifications.length}</div>
                        <div class="stats-label">الإشعارات</div>
                    </div>
                </div>
            </div>

            <!-- 🔹 زر تصدير جميع البيانات -->
            <div class="card mb-4">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-export"></i> تصدير البيانات
                    </h4>
                </div>
                <div class="card-body">
                    <p class="text-white mb-3">قم بتحميل نسخة احتياطية من جميع البيانات بصيغة JSON</p>
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <button class="btn btn-success w-100" onclick="adminManager.exportAllData()">
                                <i class="uil uil-download-alt"></i> تصدير الكل
                            </button>
                        </div>
                        <div class="col-md-3 mb-3">
                            <button class="btn btn-primary w-100" onclick="adminManager.exportData('sections')">
                                <i class="uil uil-folder"></i> تصدير الأقسام
                            </button>
                        </div>
                        <div class="col-md-3 mb-3">
                            <button class="btn btn-primary w-100" onclick="adminManager.exportData('channels')">
                                <i class="uil uil-tv"></i> تصدير القنوات
                            </button>
                        </div>
                        <div class="col-md-3 mb-3">
                            <button class="btn btn-primary w-100" onclick="adminManager.exportData('matches')">
                                <i class="uil uil-football"></i> تصدير المباريات
                            </button>
                        </div>
                        <div class="col-md-3 mb-3">
                            <button class="btn btn-primary w-100" onclick="adminManager.exportData('notifications')">
                                <i class="uil uil-bell"></i> تصدير الإشعارات
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 🔹 استيراد البيانات -->
            <div class="card mb-4">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-import"></i> استيراد البيانات
                    </h4>
                </div>
                <div class="card-body">
                    <p class="text-white mb-3">قم باستيراد البيانات من ملف JSON</p>
                    <div class="alert alert-warning mb-3">
                        <i class="uil uil-exclamation-triangle"></i>
                        <strong>تحذير:</strong> الاستيراد سيعيد كتابة البيانات الحالية. تأكد من حفظ نسخة احتياطية أولاً.
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">اختر نوع البيانات</label>
                        <select id="importDataType" class="form-control">
                            <option value="all">جميع البيانات</option>
                            <option value="sections">الأقسام فقط</option>
                            <option value="channels">القنوات فقط</option>
                            <option value="matches">المباريات فقط</option>
                            <option value="notifications">الإشعارات فقط</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">اختر ملف JSON</label>
                        <input type="file" id="importFile" class="form-control" accept=".json">
                    </div>
                    
                    <button class="btn btn-warning w-100" onclick="adminManager.importData()">
                        <i class="uil uil-upload"></i> استيراد البيانات
                    </button>
                </div>
            </div>

            <!-- 🔹 إدارة النسخ المحلية -->
            <div class="card">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-sync"></i> مزامنة البيانات
                    </h4>
                </div>
                <div class="card-body">
                    <p class="text-white mb-3">مزامنة البيانات بين Firebase والتخزين المحلي</p>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-info w-100" onclick="adminManager.syncToFirebase()" ${!this.firestoreAvailable ? 'disabled' : ''}>
                                <i class="uil uil-cloud-upload"></i> رفع إلى Firebase
                            </button>
                            <small class="text-muted">رفع البيانات المحلية إلى قاعدة البيانات</small>
                        </div>
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-info w-100" onclick="adminManager.syncFromFirebase()" ${!this.firestoreAvailable ? 'disabled' : ''}>
                                <i class="uil uil-cloud-download"></i> تنزيل من Firebase
                            </button>
                            <small class="text-muted">تنزيل البيانات من قاعدة البيانات</small>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-outline-primary w-100" onclick="adminManager.clearLocalData()">
                                <i class="uil uil-trash-alt"></i> مسح البيانات المحلية
                            </button>
                            <small class="text-muted">مسح البيانات من التخزين المحلي فقط</small>
                        </div>
                        <div class="col-md-6 mb-3">
                            <button class="btn btn-outline-danger w-100" onclick="adminManager.resetAllData()">
                                <i class="uil uil-redo"></i> إعادة تعيين الكل
                            </button>
                            <small class="text-muted">مسح جميع البيانات (محلي + Firebase)</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // القسم 5: تحميل البيانات
    // ============================================
    async loadData() {
        if (this.firestoreAvailable) {
            await this.loadDataFromFirestore();
        } else {
            this.loadDataFromLocalStorage();
        }
    }

    async loadDataFromFirestore() {
        try {
            const db = this.getDB();
            
            const sectionsSnapshot = await db.collection('sections').orderBy('order').get();
            this.sections = sectionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const channelsSnapshot = await db.collection('channels').orderBy('order').get();
            this.channels = channelsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const matchesSnapshot = await db.collection('matches').orderBy('matchDate').get();
            this.matches = matchesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const notificationsSnapshot = await db.collection('notifications').get();
            this.notifications = notificationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.renderData();
            console.log('✅ تم تحميل جميع البيانات من Firebase');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات:', error);
            this.loadDataFromLocalStorage();
        }
    }

    loadDataFromLocalStorage() {
        try {
            const savedSections = localStorage.getItem('bein_sections');
            const savedChannels = localStorage.getItem('bein_channels');
            const savedMatches = localStorage.getItem('bein_matches');
            const savedNotifications = localStorage.getItem('bein_notifications');
            
            if (savedSections) this.sections = JSON.parse(savedSections);
            if (savedChannels) this.channels = JSON.parse(savedChannels);
            if (savedMatches) this.matches = JSON.parse(savedMatches);
            if (savedNotifications) this.notifications = JSON.parse(savedNotifications);
            
            this.renderData();
            console.log('📱 تم تحميل البيانات من التخزين المحلي');
            
        } catch (error) {
            console.error('❌ خطأ في تحميل البيانات المحلية:', error);
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('bein_sections', JSON.stringify(this.sections));
            localStorage.setItem('bein_channels', JSON.stringify(this.channels));
            localStorage.setItem('bein_matches', JSON.stringify(this.matches));
            localStorage.setItem('bein_notifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات محلياً:', error);
        }
    }

    // ============================================
    // القسم 6: عرض البيانات
    // ============================================
    renderData() {
        this.renderSectionsList();
        this.renderChannelsList();
        this.renderMatchesList();
        this.renderNotificationsList();
        this.updateStats();
        this.updateBackupStats();
        this.populateDropdowns();
    }

    populateDropdowns() {
        this.populateSectionDropdown();
        this.populateChannelDropdown();
    }

    populateSectionDropdown() {
        const dropdown = document.getElementById('channelSection');
        if (!dropdown) return;
        
        dropdown.innerHTML = '<option value="">اختر القسم</option>';
        this.sections.forEach(section => {
            const option = document.createElement('option');
            option.value = section.id;
            option.textContent = section.name;
            dropdown.appendChild(option);
        });
    }

    populateChannelDropdown() {
        const dropdown = document.getElementById('matchChannel');
        if (!dropdown) return;
        
        dropdown.innerHTML = '<option value="">اختر القناة الناقلة</option>';
        
        const sortedChannels = [...this.channels].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        sortedChannels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.textContent = channel.name;
            dropdown.appendChild(option);
        });
    }

    // ============================================
    // القسم 7: عرض القوائم
    // ============================================
    renderSectionsList() {
        const container = document.getElementById('sectionsList');
        const countElement = document.getElementById('sectionsCount');
        
        if (!container) {
            console.error('❌ عنصر sectionsList غير موجود');
            return;
        }
        
        if (this.sections.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="uil uil-folder" style="font-size: 80px; color: #6c757d;"></i>
                    <h5 class="mt-3 text-muted">لا توجد أقسام مضافة</h5>
                </div>
            `;
            if (countElement) countElement.textContent = '0';
            return;
        }
        
        let html = `
            <div class="alert alert-info mb-3">
                <i class="uil uil-info-circle"></i>
                يمكنك ترتيب القنوات داخل كل قسم باستخدام أزرار الأعلى/الأسفل. الترتيب يعمل داخل كل قسم على حدة.
            </div>
            
            <div class="section-controls mb-3">
                <button class="btn btn-info btn-sm me-2" onclick="adminManager.expandAllSections()">
                    <i class="uil uil-expand-arrows"></i> عرض جميع القنوات
                </button>
                <button class="btn btn-secondary btn-sm me-2" onclick="adminManager.collapseAllSections()">
                    <i class="uil uil-compress-arrows"></i> إخفاء جميع القنوات
                </button>
                <button class="btn btn-warning btn-sm" onclick="adminManager.reorderAllSectionsChannels()">
                    <i class="uil uil-sort-amount-down"></i> إعادة ترتيب جميع القنوات
                </button>
            </div>
        `;
        
        const sortedSections = [...this.sections].sort((a, b) => (a.order || 999) - (b.order || 999));
        
        html += sortedSections.map(section => {
            const sectionChannels = this.channels
                .filter(channel => channel.sectionId === section.id)
                .sort((a, b) => (a.order || 1) - (b.order || 1));
            
            const channelsCount = sectionChannels.length;
            const isExpanded = this.expandedSections.has(section.id);
            
            return `
                <div class="section-item" id="section-${section.id}">
                    <div class="section-header" onclick="adminManager.toggleSection('${section.id}')">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="uil uil-folder section-toggle-icon ${isExpanded ? 'rotated' : ''}" id="toggle-icon-${section.id}"></i>
                                <div class="section-info ms-3">
                                    <h5 class="text-white mb-1">
                                        ${section.name}
                                        <span class="badge bg-primary ms-2">${channelsCount} قناة</span>
                                    </h5>
                                    <div class="text-muted">
                                        <small>ترتيب القسم: ${section.order || 1}</small>
                                        <span class="mx-2">•</span>
                                        <small class="${section.isActive !== false ? 'text-success' : 'text-danger'}">
                                            ${section.isActive !== false ? 'نشط' : 'غير نشط'}
                                        </small>
                                        <span class="mx-2">•</span>
                                        <small>${section.description ? section.description.substring(0, 50) + '...' : 'لا يوجد وصف'}</small>
                                    </div>
                                </div>
                            </div>
                            <div class="action-buttons" onclick="event.stopPropagation()">
                                <button class="btn btn-warning btn-sm me-1" onclick="adminManager.editSection('${section.id}', event)">
                                    <i class="uil uil-edit"></i> تعديل
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="adminManager.deleteSection('${section.id}')">
                                    <i class="uil uil-trash-alt"></i> حذف
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 🔹 قنوات القسم -->
                    <div class="section-channels mt-3" id="channels-${section.id}" style="display: ${isExpanded ? 'block' : 'none'};">
                        ${channelsCount === 0 ? `
                            <div class="text-center py-3">
                                <p class="text-muted mb-0">
                                    <i class="uil uil-tv-retro"></i> لا توجد قنوات في هذا القسم
                                </p>
                            </div>
                        ` : `
                            <div class="channels-list" id="channels-list-${section.id}">
                                ${sectionChannels.map((channel, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === sectionChannels.length - 1;
                                    
                                    return `
                                    <div class="channel-sub-item" data-channel-id="${channel.id}" data-order="${channel.order}">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div class="d-flex align-items-center">
                                                <div class="channel-order-badge me-2" title="الترتيب الحالي: ${channel.order || 1}">
                                                    <span>${channel.order || 1}</span>
                                                </div>
                                                <div class="channel-info">
                                                    <h6 class="text-white mb-1">${channel.name}</h6>
                                                    <div class="text-muted">
                                                        <small>${channel.url ? '🔗 رابط متاح' : '❌ بدون رابط'}</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="action-buttons">
                                                <!-- 🔹 زر التشغيل الجديد -->
                                                <button class="btn btn-success btn-sm me-1" onclick="adminManager.playChannel('${channel.id}')" 
                                                        title="تشغيل القناة" ${!channel.url ? 'disabled' : ''}>
                                                    <i class="uil uil-play"></i>
                                                </button>
                                                
                                                <button class="btn btn-info btn-sm move-up-btn ${isFirst ? 'disabled' : ''}" 
                                                        onclick="${isFirst ? '' : `adminManager.moveChannelUpInSection('${section.id}', '${channel.id}')`}" 
                                                        title="${isFirst ? 'القناة في الأعلى' : 'تحريك للأعلى'}" ${isFirst ? 'disabled' : ''}>
                                                    <i class="uil uil-arrow-up"></i>
                                                </button>
                                                <button class="btn btn-info btn-sm move-down-btn ${isLast ? 'disabled' : ''}" 
                                                        onclick="${isLast ? '' : `adminManager.moveChannelDownInSection('${section.id}', '${channel.id}')`}" 
                                                        title="${isLast ? 'القناة في الأسفل' : 'تحريك للأسفل'}" ${isLast ? 'disabled' : ''}>
                                                    <i class="uil uil-arrow-down"></i>
                                                </button>
                                                <button class="btn btn-warning btn-sm me-1" onclick="adminManager.editChannelFromSection('${channel.id}', event)">
                                                    <i class="uil uil-edit"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="adminManager.deleteChannel('${channel.id}')">
                                                    <i class="uil uil-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                        
                        <!-- 🔹 زر إضافة قناة جديدة لهذا القسم -->
                        <div class="text-center mt-3">
                            <button class="btn btn-success btn-sm" onclick="adminManager.addChannelToSection('${section.id}')">
                                <i class="uil uil-plus"></i> إضافة قناة جديدة
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        
        if (countElement) countElement.textContent = this.sections.length;
    }

    renderChannelsList() {
        const container = document.getElementById('channelsList');
        const countElement = document.getElementById('channelsCount');
        
        if (!container) {
            console.error('❌ عنصر channelsList غير موجود');
            return;
        }
        
        if (this.channels.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="uil uil-tv-retro" style="font-size: 80px; color: #6c757d;"></i>
                    <h5 class="mt-3 text-muted">لا توجد قنوات مضافة</h5>
                </div>
            `;
            if (countElement) countElement.textContent = '0';
            return;
        }
        
        const sortedChannels = [...this.channels].sort((a, b) => {
            if (a.sectionId === b.sectionId) {
                return (a.order || 999) - (b.order || 999);
            }
            return a.name.localeCompare(b.name);
        });
        
        container.innerHTML = sortedChannels.map(channel => {
            const section = this.sections.find(s => s.id === channel.sectionId);
            
            return `
            <div class="channel-item" data-channel-id="${channel.id}" data-order="${channel.order}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="channel-order-badge-main me-2" title="الترتيب في القسم: ${channel.order || 1}">
                            <span>${channel.order || 1}</span>
                        </div>
                        <img src="${channel.image || 'https://via.placeholder.com/60x40/2F2562/FFFFFF?text=TV'}" 
                             alt="${channel.name}" 
                             class="rounded me-3 channel-thumbnail"
                             onerror="this.src='https://via.placeholder.com/60x40/2F2562/FFFFFF?text=TV'">
                        <div>
                            <h6 class="text-white mb-1">${channel.name}</h6>
                            <div class="text-muted">
                                <small>الترتيب في القسم: ${channel.order || 1}</small>
                                ${section ? `
                                    <span class="mx-2">•</span>
                                    <small class="section-badge" onclick="adminManager.viewSection('${section.id}')" style="cursor: pointer;" title="عرض القسم">
                                        ${section.name}
                                    </small>
                                ` : ''}
                                <span class="mx-2">•</span>
                                <small class="${channel.url ? 'text-success' : 'text-danger'}">
                                    ${channel.url ? '🔗 رابط متاح' : '❌ بدون رابط'}
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <!-- 🔹 زر التشغيل الجديد -->
                        <button class="btn btn-success btn-sm me-1" onclick="adminManager.playChannel('${channel.id}')" 
                                title="تشغيل القناة" ${!channel.url ? 'disabled' : ''}>
                            <i class="uil uil-play"></i>
                        </button>
                        
                        <button class="btn btn-warning btn-sm me-1" onclick="adminManager.editChannel('${channel.id}', event)" title="تعديل القناة">
                            <i class="uil uil-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminManager.deleteChannel('${channel.id}')" title="حذف القناة">
                            <i class="uil uil-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="mt-2 text-muted small">
                    <span class="badge bg-secondary">#${channel.id.substring(0, 8)}</span>
                    ${channel.createdAt ? `<span class="mx-2">•</span><small>تم الإنشاء: ${new Date(channel.createdAt).toLocaleDateString('ar-SA')}</small>` : ''}
                </div>
            </div>
            `;
        }).join('');
        
        if (countElement) countElement.textContent = sortedChannels.length;
    }

    renderMatchesList() {
        const container = document.getElementById('matchesList');
        const countElement = document.getElementById('matchesCount');
        
        if (!container) {
            console.error('❌ عنصر matchesList غير موجود');
            return;
        }
        
        if (this.matches.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="uil uil-football" style="font-size: 80px; color: #6c757d;"></i>
                    <h5 class="mt-3 text-muted">لا توجد مباريات مضافة</h5>
                </div>
            `;
            if (countElement) countElement.textContent = '0';
            return;
        }
        
        container.innerHTML = this.matches.map(match => {
            const channel = this.channels.find(c => c.id === match.channelId);
            const channelName = channel ? channel.name : 'غير محدد';
            const matchDate = new Date(match.matchDate);
            const dateStr = matchDate.toLocaleDateString('ar-SA');
            
            return `
                <div class="match-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="match-info">
                            <h5 class="text-white mb-1">${match.team1} vs ${match.team2}</h5>
                            <div class="text-muted">
                                <small>البطولة: ${match.competition}</small>
                                <span class="mx-2">•</span>
                                <small>التاريخ: ${dateStr}</small>
                                <span class="mx-2">•</span>
                                <small>الوقت: ${match.matchTime}</small>
                                <span class="mx-2">•</span>
                                <small>القناة: ${channelName}</small>
                                <span class="mx-2">•</span>
                                <small class="badge bg-${match.status === 'live' ? 'danger' : match.status === 'upcoming' ? 'warning' : 'secondary'}">
                                    ${match.status === 'live' ? 'مباشرة' : match.status === 'upcoming' ? 'قادمة' : 'منتهية'}
                                </small>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-warning btn-sm me-1" onclick="adminManager.editMatch('${match.id}')">
                                <i class="uil uil-edit"></i> تعديل
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="adminManager.deleteMatch('${match.id}')">
                                <i class="uil uil-trash-alt"></i> حذف
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (countElement) countElement.textContent = this.matches.length;
    }

    renderNotificationsList() {
        const container = document.getElementById('notificationsList');
        const countElement = document.getElementById('notificationsCount');
        
        if (!container) {
            console.error('❌ عنصر notificationsList غير موجود');
            return;
        }
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="uil uil-bell-slash" style="font-size: 80px; color: #6c757d;"></i>
                    <h5 class="mt-3 text-muted">لا توجد إشعارات</h5>
                </div>
            `;
            if (countElement) countElement.textContent = '0';
            return;
        }
        
        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="notification-info">
                        <h5 class="text-white mb-1">${notification.title}</h5>
                        <div class="text-muted">
                            <small>${notification.message}</small>
                            <span class="mx-2">•</span>
                            <small class="badge bg-${notification.type === 'info' ? 'info' : notification.type === 'success' ? 'success' : notification.type === 'warning' ? 'warning' : 'danger'}">
                                ${notification.type === 'info' ? 'معلومات' : notification.type === 'success' ? 'نجاح' : notification.type === 'warning' ? 'تحذير' : 'خطأ'}
                            </small>
                            <span class="mx-2">•</span>
                            <small class="${notification.status === 'active' ? 'text-success' : 'text-danger'}">
                                ${notification.status === 'active' ? 'نشط' : 'غير نشط'}
                            </small>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-warning btn-sm me-1" onclick="adminManager.editNotification('${notification.id}')">
                            <i class="uil uil-edit"></i> تعديل
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminManager.deleteNotification('${notification.id}')">
                            <i class="uil uil-trash-alt"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (countElement) countElement.textContent = this.notifications.length;
    }

    // ============================================
    // القسم 8: تحديث الإحصائيات
    // ============================================
    updateStats() {
        const totalSections = document.getElementById('totalSections');
        if (totalSections) totalSections.textContent = this.sections.length;
        
        const totalChannels = document.getElementById('totalChannels');
        if (totalChannels) totalChannels.textContent = this.channels.length;
        
        const totalMatches = document.getElementById('totalMatches');
        if (totalMatches) totalMatches.textContent = this.matches.length;
        
        const activeNotifications = document.getElementById('activeNotifications');
        if (activeNotifications) {
            const activeCount = this.notifications.filter(n => n.status === 'active').length;
            activeNotifications.textContent = activeCount;
        }
    }

    updateBackupStats() {
        const sectionCount = document.querySelector('.backup-section-count');
        const channelCount = document.querySelector('.backup-channel-count');
        const matchCount = document.querySelector('.backup-match-count');
        const notificationCount = document.querySelector('.backup-notification-count');
        
        if (sectionCount) sectionCount.textContent = this.sections.length;
        if (channelCount) channelCount.textContent = this.channels.length;
        if (matchCount) matchCount.textContent = this.matches.length;
        if (notificationCount) notificationCount.textContent = this.notifications.length;
    }

    // ============================================
    // القسم 9: دوال التحكم في الأقسام
    // ============================================
    toggleSection(sectionId) {
        if (this.expandedSections.has(sectionId)) {
            this.expandedSections.delete(sectionId);
        } else {
            this.expandedSections.add(sectionId);
        }
        
        const channelsDiv = document.getElementById(`channels-${sectionId}`);
        const toggleIcon = document.getElementById(`toggle-icon-${sectionId}`);
        
        if (channelsDiv) {
            if (this.expandedSections.has(sectionId)) {
                channelsDiv.style.display = 'block';
                if (toggleIcon) {
                    toggleIcon.classList.add('rotated');
                }
            } else {
                channelsDiv.style.display = 'none';
                if (toggleIcon) {
                    toggleIcon.classList.remove('rotated');
                }
            }
        }
    }

    expandAllSections() {
        this.sections.forEach(section => {
            this.expandedSections.add(section.id);
            const channelsDiv = document.getElementById(`channels-${section.id}`);
            const toggleIcon = document.getElementById(`toggle-icon-${section.id}`);
            
            if (channelsDiv) {
                channelsDiv.style.display = 'block';
                if (toggleIcon) {
                    toggleIcon.classList.add('rotated');
                }
            }
        });
    }

    collapseAllSections() {
        this.sections.forEach(section => {
            this.expandedSections.delete(section.id);
            const channelsDiv = document.getElementById(`channels-${section.id}`);
            const toggleIcon = document.getElementById(`toggle-icon-${section.id}`);
            
            if (channelsDiv) {
                channelsDiv.style.display = 'none';
                if (toggleIcon) {
                    toggleIcon.classList.remove('rotated');
                }
            }
        });
    }

    addChannelToSection(sectionId) {
        this.expandedSections.add(sectionId);
        this.toggleSection(sectionId);
        
        setTimeout(() => {
            const channelsTab = document.querySelector('[href="#channelsTab"]');
            if (channelsTab) {
                const tab = new bootstrap.Tab(channelsTab);
                tab.show();
                
                setTimeout(() => {
                    const sectionSelect = document.getElementById('channelSection');
                    if (sectionSelect) {
                        sectionSelect.value = sectionId;
                    }
                    
                    const channelForm = document.getElementById('channelForm');
                    if (channelForm) {
                        channelForm.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 300);
            }
        }, 300);
    }

    viewSection(sectionId) {
        const sectionsTab = document.querySelector('[href="#sectionsTab"]');
        if (sectionsTab) {
            const tab = new bootstrap.Tab(sectionsTab);
            tab.show();
            
            setTimeout(() => {
                this.expandedSections.add(sectionId);
                this.renderSectionsList();
                
                const sectionElement = document.getElementById(`section-${sectionId}`);
                if (sectionElement) {
                    sectionElement.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        }
    }

    // ============================================
    // القسم 10: إدارة الأقسام (التعديل والحذف)
    // ============================================
    async saveSection(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const sectionName = document.getElementById('sectionName').value;
        const sectionOrder = document.getElementById('sectionOrder').value;
        
        if (!sectionName || !sectionOrder) {
            this.showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
            return false;
        }
        
        const sectionData = {
            name: sectionName,
            order: parseInt(sectionOrder),
            isActive: document.getElementById('sectionStatus').value === 'active',
            description: document.getElementById('sectionDescription').value,
            image: document.getElementById('sectionImage').value,
            updatedAt: new Date()
        };
        
        const sectionId = document.getElementById('sectionId').value;
        
        try {
            if (sectionId) {
                // 🔹 تحديث قسم موجود
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    await db.collection('sections').doc(sectionId).update(sectionData);
                }
                
                const index = this.sections.findIndex(s => s.id === sectionId);
                if (index !== -1) {
                    this.sections[index] = { ...this.sections[index], ...sectionData };
                }
                
                this.showAlert('تم تحديث القسم بنجاح', 'success');
            } else {
                // 🔹 إضافة قسم جديد
                sectionData.createdAt = new Date();
                let newSectionId;
                
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    const docRef = await db.collection('sections').add(sectionData);
                    newSectionId = docRef.id;
                } else {
                    newSectionId = 'local_' + Date.now();
                    sectionData.id = newSectionId;
                }
                
                this.sections.push({
                    id: newSectionId,
                    ...sectionData
                });
                
                this.showAlert('تم إضافة القسم بنجاح', 'success');
            }
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            this.resetSectionForm();
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في حفظ القسم:', error);
            this.showAlert('خطأ في حفظ القسم: ' + error.message, 'error');
            return false;
        }
    }

    editSection(sectionId, e) {
        if (e) e.stopPropagation();
        
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) {
            this.showAlert('القسم غير موجود', 'error');
            return;
        }
        
        this.editingSection = section;
        
        document.getElementById('sectionId').value = section.id;
        document.getElementById('sectionName').value = section.name;
        document.getElementById('sectionOrder').value = section.order || 1;
        document.getElementById('sectionStatus').value = section.isActive !== false ? 'active' : 'inactive';
        document.getElementById('sectionDescription').value = section.description || '';
        document.getElementById('sectionImage').value = section.image || '';
        
        document.getElementById('sectionFormTitle').textContent = 'تعديل القسم';
        document.getElementById('sectionSaveButton').textContent = 'تحديث القسم';
        document.getElementById('cancelSectionEdit').style.display = 'block';
        
        this.updateImagePreview(section.image, 'sectionImagePreview');
        
        const form = document.getElementById('sectionForm');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    cancelEditSection() {
        this.editingSection = null;
        this.resetSectionForm();
    }

    resetSectionForm() {
        const form = document.getElementById('sectionForm');
        if (form) form.reset();
        
        document.getElementById('sectionId').value = '';
        document.getElementById('sectionFormTitle').textContent = 'إضافة قسم جديد';
        document.getElementById('sectionSaveButton').textContent = 'حفظ القسم';
        document.getElementById('cancelSectionEdit').style.display = 'none';
        document.getElementById('sectionImagePreview').style.display = 'none';
        document.getElementById('sectionOrder').value = 1;
        document.getElementById('sectionStatus').value = 'active';
    }

    async deleteSection(sectionId) {
        if (event) event.stopPropagation();
        
        if (!confirm('⚠️ هل أنت متأكد من حذف هذا القسم؟\n\nسيتم حذف:\n• القسم نفسه\n• جميع القنوات المرتبطة به\n• جميع المباريات المرتبطة بتلك القنوات')) {
            return;
        }
        
        try {
            console.log(`🗑️ بدء حذف القسم: ${sectionId}`);
            
            const channelsToDelete = this.channels.filter(c => c.sectionId === sectionId);
            console.log(`📺 عدد القنوات المرتبطة: ${channelsToDelete.length}`);
            
            const channelIds = channelsToDelete.map(c => c.id);
            const matchesToDelete = this.matches.filter(m => channelIds.includes(m.channelId));
            console.log(`⚽ عدد المباريات المرتبطة: ${matchesToDelete.length}`);
            
            if (this.firestoreAvailable) {
                const db = this.getDB();
                
                console.log('🗑️ جاري حذف المباريات...');
                for (const match of matchesToDelete) {
                    try {
                        await db.collection('matches').doc(match.id).delete();
                        console.log(`✅ تم حذف المباراة: ${match.id}`);
                    } catch (matchError) {
                        console.error(`❌ خطأ في حذف المباراة ${match.id}:`, matchError);
                    }
                }
                
                console.log('🗑️ جاري حذف القنوات...');
                for (const channel of channelsToDelete) {
                    try {
                        await db.collection('channels').doc(channel.id).delete();
                        console.log(`✅ تم حذف القناة: ${channel.id}`);
                    } catch (channelError) {
                        console.error(`❌ خطأ في حذف القناة ${channel.id}:`, channelError);
                    }
                }
                
                console.log('🗑️ جاري حذف القسم...');
                await db.collection('sections').doc(sectionId).delete();
                console.log(`✅ تم حذف القسم: ${sectionId}`);
                
            } else {
                console.log('📱 حذف من التخزين المحلي فقط');
            }
            
            this.sections = this.sections.filter(s => s.id !== sectionId);
            this.channels = this.channels.filter(c => c.sectionId !== sectionId);
            this.matches = this.matches.filter(m => !channelIds.includes(m.channelId));
            
            this.expandedSections.delete(sectionId);
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
            const deleteCount = 1 + channelsToDelete.length + matchesToDelete.length;
            this.showAlert(`✅ تم حذف القسم و ${channelsToDelete.length} قناة و ${matchesToDelete.length} مباراة بنجاح`, 'success');
            
            console.log(`🎉 تم الانتهاء من حذف القسم ${sectionId} وجميع العناصر المرتبطة به`);
            
        } catch (error) {
            console.error('❌ خطأ في حذف القسم:', error);
            this.showAlert('خطأ في حذف القسم: ' + error.message, 'error');
        }
    }

    // ============================================
    // القسم 11: إدارة القنوات داخل الأقسام
    // ============================================
    async moveChannelUpInSection(sectionId, channelId) {
        const sectionChannels = this.channels
            .filter(c => c.sectionId === sectionId)
            .sort((a, b) => (a.order || 999) - (b.order || 999));
        
        const currentIndex = sectionChannels.findIndex(c => c.id === channelId);
        
        if (currentIndex > 0) {
            const previousChannel = sectionChannels[currentIndex - 1];
            const currentChannel = sectionChannels[currentIndex];
            
            const tempOrder = currentChannel.order;
            currentChannel.order = previousChannel.order;
            previousChannel.order = tempOrder;
            
            if (this.firestoreAvailable) {
                const db = this.getDB();
                await Promise.all([
                    db.collection('channels').doc(currentChannel.id).update({ 
                        order: currentChannel.order,
                        updatedAt: new Date()
                    }),
                    db.collection('channels').doc(previousChannel.id).update({ 
                        order: previousChannel.order,
                        updatedAt: new Date()
                    })
                ]);
            }
            
            this.saveToLocalStorage();
            this.renderSectionsList();
            this.showAlert('تم نقل القناة للأعلى داخل القسم', 'success');
        } else {
            this.showAlert('لا يمكن نقل القناة للأعلى، هي بالفعل في الأعلى داخل القسم', 'warning');
        }
    }

    async moveChannelDownInSection(sectionId, channelId) {
        const sectionChannels = this.channels
            .filter(c => c.sectionId === sectionId)
            .sort((a, b) => (a.order || 999) - (b.order || 999));
        
        const currentIndex = sectionChannels.findIndex(c => c.id === channelId);
        
        if (currentIndex < sectionChannels.length - 1) {
            const nextChannel = sectionChannels[currentIndex + 1];
            const currentChannel = sectionChannels[currentIndex];
            
            const tempOrder = currentChannel.order;
            currentChannel.order = nextChannel.order;
            nextChannel.order = tempOrder;
            
            if (this.firestoreAvailable) {
                const db = this.getDB();
                await Promise.all([
                    db.collection('channels').doc(currentChannel.id).update({ 
                        order: currentChannel.order,
                        updatedAt: new Date()
                    }),
                    db.collection('channels').doc(nextChannel.id).update({ 
                        order: nextChannel.order,
                        updatedAt: new Date()
                    })
                ]);
            }
            
            this.saveToLocalStorage();
            this.renderSectionsList();
            this.showAlert('تم نقل القناة للأسفل داخل القسم', 'success');
        } else {
            this.showAlert('لا يمكن نقل القناة للأسفل، هي بالفعل في الأسفل داخل القسم', 'warning');
        }
    }

    // 🔹 دالة جديدة: تعديل قناة مباشرة من داخل قسم
    editChannelFromSection(channelId, e) {
        if (e) e.stopPropagation();
        
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) {
            this.showAlert('القناة غير موجودة', 'error');
            return;
        }
        
        this.editingChannel = channel;
        
        // الانتقال إلى تبويب القنوات
        const channelsTab = document.querySelector('[href="#channelsTab"]');
        if (channelsTab) {
            const tab = new bootstrap.Tab(channelsTab);
            tab.show();
            
            // بعد الانتقال، تعبئة نموذج القناة
            setTimeout(() => {
                document.getElementById('channelId').value = channel.id;
                document.getElementById('channelName').value = channel.name;
                document.getElementById('channelSection').value = channel.sectionId;
                document.getElementById('channelImage').value = channel.image || '';
                document.getElementById('channelUrl').value = channel.url || '';
                document.getElementById('channelOrder').value = channel.order || 1;
                document.getElementById('channelAppUrl').value = channel.appUrl || 'https://play.google.com/store/apps/details?id=com.xpola.player';
                
                document.getElementById('channelFormTitle').textContent = 'تعديل القناة';
                document.getElementById('channelSaveButton').textContent = 'تحديث القناة';
                document.getElementById('cancelChannelEdit').style.display = 'block';
                
                this.updateImagePreview(channel.image, 'channelImagePreview');
                
                // تعبئة القوائم المنسدلة
                this.populateSectionDropdown();
                
                // التمرير إلى النموذج
                const form = document.getElementById('channelForm');
                if (form) {
                    form.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        }
    }

    async reorderAllSectionsChannels() {
        if (!confirm('هل أنت متأكد من إعادة ترتيب جميع القنوات داخل جميع الأقسام؟')) {
            return;
        }
        
        try {
            this.showAlert('جاري إعادة ترتيب جميع القنوات داخل الأقسام...', 'info');
            
            for (const section of this.sections) {
                await this.reorderSectionChannels(section.id);
            }
            
            this.saveToLocalStorage();
            this.renderSectionsList();
            this.showAlert('تم إعادة ترتيب جميع القنوات داخل جميع الأقسام تلقائياً', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في إعادة الترتيب:', error);
            this.showAlert('خطأ في إعادة الترتيب: ' + error.message, 'error');
        }
    }

    async reorderSectionChannels(sectionId) {
        const sectionChannels = this.channels
            .filter(c => c.sectionId === sectionId);
        
        if (sectionChannels.length === 0) return;
        
        sectionChannels.sort((a, b) => (a.order || 999) - (b.order || 999));
        
        console.log(`🔧 إعادة ترتيب ${sectionChannels.length} قناة في القسم ${sectionId}`);
        
        for (let i = 0; i < sectionChannels.length; i++) {
            const channel = sectionChannels[i];
            const newOrder = i + 1;
            
            if (channel.order !== newOrder) {
                channel.order = newOrder;
                console.log(`📝 تحديث الترتيب: ${channel.name} → ${newOrder}`);
                
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    await db.collection('channels').doc(channel.id).update({ 
                        order: newOrder,
                        updatedAt: new Date()
                    });
                }
            }
        }
        
        console.log(`✅ تم إعادة ترتيب القنوات في القسم ${sectionId}`);
    }

    // ============================================
    // القسم 12: إدارة القنوات (التعديل والحذف)
    // ============================================
    async saveChannel(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        try {
            const channelName = document.getElementById('channelName').value;
            const channelSection = document.getElementById('channelSection').value;
            const channelUrl = document.getElementById('channelUrl').value;
            
            if (!channelName || !channelSection || !channelUrl) {
                this.showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
                return false;
            }
            
            const channelData = {
                name: channelName,
                sectionId: channelSection,
                image: document.getElementById('channelImage').value,
                url: channelUrl,
                order: parseInt(document.getElementById('channelOrder').value) || 1,
                appUrl: document.getElementById('channelAppUrl').value || 'https://play.google.com/store/apps/details?id=com.xpola.player',
                updatedAt: new Date()
            };
            
            const channelId = document.getElementById('channelId').value;
            
            if (channelId) {
                // تحديث قناة موجودة
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    await db.collection('channels').doc(channelId).update(channelData);
                }
                
                const index = this.channels.findIndex(c => c.id === channelId);
                if (index !== -1) {
                    this.channels[index] = { ...this.channels[index], ...channelData };
                }
                
                this.showAlert('تم تحديث القناة بنجاح', 'success');
            } else {
                // إضافة قناة جديدة
                channelData.createdAt = new Date();
                let newChannelId;
                
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    const docRef = await db.collection('channels').add(channelData);
                    newChannelId = docRef.id;
                } else {
                    newChannelId = 'local_' + Date.now();
                    channelData.id = newChannelId;
                }
                
                this.channels.push({
                    id: newChannelId,
                    ...channelData
                });
                
                this.showAlert('تم إضافة القناة بنجاح', 'success');
            }
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            this.resetChannelForm();
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في حفظ القناة:', error);
            this.showAlert('خطأ في حفظ القناة: ' + error.message, 'error');
            return false;
        }
    }

    editChannel(channelId, e) {
        if (e) e.stopPropagation();
        
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) {
            this.showAlert('القناة غير موجودة', 'error');
            return;
        }
        
        this.editingChannel = channel;
        
        document.getElementById('channelId').value = channel.id;
        document.getElementById('channelName').value = channel.name;
        document.getElementById('channelSection').value = channel.sectionId;
        document.getElementById('channelImage').value = channel.image || '';
        document.getElementById('channelUrl').value = channel.url || '';
        document.getElementById('channelOrder').value = channel.order || 1;
        document.getElementById('channelAppUrl').value = channel.appUrl || 'https://play.google.com/store/apps/details?id=com.xpola.player';
        
        document.getElementById('channelFormTitle').textContent = 'تعديل القناة';
        document.getElementById('channelSaveButton').textContent = 'تحديث القناة';
        document.getElementById('cancelChannelEdit').style.display = 'block';
        
        this.updateImagePreview(channel.image, 'channelImagePreview');
        
        this.populateSectionDropdown();
        
        const form = document.getElementById('channelForm');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    cancelEditChannel() {
        this.editingChannel = null;
        this.resetChannelForm();
    }

    resetChannelForm() {
        const form = document.getElementById('channelForm');
        if (form) form.reset();
        
        document.getElementById('channelId').value = '';
        document.getElementById('channelFormTitle').textContent = 'إضافة قناة جديدة';
        document.getElementById('channelSaveButton').textContent = 'حفظ القناة';
        document.getElementById('cancelChannelEdit').style.display = 'none';
        document.getElementById('channelImagePreview').style.display = 'none';
        document.getElementById('channelOrder').value = 1;
        document.getElementById('channelAppUrl').value = 'https://play.google.com/store/apps/details?id=com.xpola.player';
        
        this.populateSectionDropdown();
    }

    async deleteChannel(channelId) {
        if (event) event.stopPropagation();
        
        if (!confirm('⚠️ هل أنت متأكد من حذف هذه القناة؟\n\nسيتم حذف:\n• القناة نفسها\n• جميع المباريات المرتبطة بهذه القناة')) {
            return;
        }
        
        try {
            console.log(`🗑️ بدء حذف القناة: ${channelId}`);
            
            const channelToDelete = this.channels.find(c => c.id === channelId);
            if (!channelToDelete) {
                this.showAlert('❌ القناة غير موجودة', 'error');
                return;
            }
            
            const sectionId = channelToDelete.sectionId;
            const channelName = channelToDelete.name;
            
            const matchesToDelete = this.matches.filter(m => m.channelId === channelId);
            console.log(`⚽ عدد المباريات المرتبطة: ${matchesToDelete.length}`);
            
            if (this.firestoreAvailable) {
                const db = this.getDB();
                
                console.log('🗑️ جاري حذف المباريات...');
                for (const match of matchesToDelete) {
                    try {
                        await db.collection('matches').doc(match.id).delete();
                        console.log(`✅ تم حذف المباراة: ${match.id}`);
                    } catch (matchError) {
                        console.error(`❌ خطأ في حذف المباراة ${match.id}:`, matchError);
                    }
                }
                
                console.log('🗑️ جاري حذف القناة...');
                await db.collection('channels').doc(channelId).delete();
                console.log(`✅ تم حذف القناة: ${channelId} (${channelName})`);
                
            } else {
                console.log('📱 حذف من التخزين المحلي فقط');
            }
            
            this.channels = this.channels.filter(c => c.id !== channelId);
            this.matches = this.matches.filter(m => m.channelId !== channelId);
            
            if (sectionId) {
                await this.reorderSectionChannels(sectionId);
            }
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
            const deleteCount = 1 + matchesToDelete.length;
            this.showAlert(`✅ تم حذف القناة "${channelName}" و ${matchesToDelete.length} مباراة بنجاح`, 'success');
            
            console.log(`🎉 تم الانتهاء من حذف القناة ${channelId}`);
            
        } catch (error) {
            console.error('❌ خطأ في حذف القناة:', error);
            this.showAlert('خطأ في حذف القناة: ' + error.message, 'error');
        }
    }

    // ============================================
    // القسم 13: إدارة المباريات
    // ============================================
    async saveMatch(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        try {
            const team1 = document.getElementById('team1').value;
            const team2 = document.getElementById('team2').value;
            const competition = document.getElementById('competition').value;
            const matchDate = document.getElementById('matchDate').value;
            const matchTime = document.getElementById('matchTime').value;
            const matchChannel = document.getElementById('matchChannel').value;
            
            if (!team1 || !team2 || !competition || !matchDate || !matchTime || !matchChannel) {
                this.showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
                return false;
            }
            
            const matchData = {
                team1: team1,
                team2: team2,
                competition: competition,
                matchDate: matchDate,
                matchTime: matchTime,
                channelId: matchChannel,
                status: document.getElementById('matchStatus').value || 'upcoming',
                updatedAt: new Date()
            };
            
            const matchId = document.getElementById('matchId').value;
            
            if (matchId) {
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    await db.collection('matches').doc(matchId).update(matchData);
                }
                
                const index = this.matches.findIndex(m => m.id === matchId);
                if (index !== -1) {
                    this.matches[index] = { ...this.matches[index], ...matchData };
                }
                
                this.showAlert('تم تحديث المباراة بنجاح', 'success');
            } else {
                matchData.createdAt = new Date();
                let newMatchId;
                
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    const docRef = await db.collection('matches').add(matchData);
                    newMatchId = docRef.id;
                } else {
                    newMatchId = 'local_' + Date.now();
                    matchData.id = newMatchId;
                }
                
                this.matches.push({
                    id: newMatchId,
                    ...matchData
                });
                
                this.showAlert('تم إضافة المباراة بنجاح', 'success');
            }
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            this.resetMatchForm();
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في حفظ المباراة:', error);
            this.showAlert('خطأ في حفظ المباراة: ' + error.message, 'error');
            return false;
        }
    }

    editMatch(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;
        
        this.editingMatch = match;
        
        document.getElementById('matchId').value = match.id;
        document.getElementById('team1').value = match.team1;
        document.getElementById('team2').value = match.team2;
        document.getElementById('competition').value = match.competition;
        document.getElementById('matchDate').value = match.matchDate;
        document.getElementById('matchTime').value = match.matchTime;
        document.getElementById('matchChannel').value = match.channelId;
        document.getElementById('matchStatus').value = match.status || 'upcoming';
        
        document.getElementById('matchFormTitle').textContent = 'تعديل المباراة';
        document.getElementById('matchSaveButton').textContent = 'تحديث المباراة';
        document.getElementById('cancelMatchEdit').style.display = 'block';
    }

    cancelEditMatch() {
        this.editingMatch = null;
        this.resetMatchForm();
    }

    resetMatchForm() {
        const form = document.getElementById('matchForm');
        if (form) form.reset();
        
        document.getElementById('matchId').value = '';
        document.getElementById('matchFormTitle').textContent = 'إضافة مباراة جديدة';
        document.getElementById('matchSaveButton').textContent = 'حفظ المباراة';
        document.getElementById('cancelMatchEdit').style.display = 'none';
        document.getElementById('matchStatus').value = 'upcoming';
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('matchDate').value = today;
        
        // ضبط الوقت الافتراضي
        const timeInput = document.getElementById('matchTime');
        if (timeInput && !timeInput.value) {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        }
    }

    async deleteMatch(matchId) {
        if (event) event.stopPropagation();
        
        if (!confirm('⚠️ هل أنت متأكد من حذف هذه المباراة؟')) {
            return;
        }
        
        try {
            console.log(`🗑️ بدء حذف المباراة: ${matchId}`);
            
            const matchToDelete = this.matches.find(m => m.id === matchId);
            if (!matchToDelete) {
                this.showAlert('❌ المباراة غير موجودة', 'error');
                return;
            }
            
            const matchInfo = `${matchToDelete.team1} vs ${matchToDelete.team2}`;
            
            if (this.firestoreAvailable) {
                const db = this.getDB();
                
                console.log('🗑️ جاري حذف المباراة من Firebase...');
                await db.collection('matches').doc(matchId).delete();
                console.log(`✅ تم حذف المباراة من Firebase: ${matchId} (${matchInfo})`);
                
            } else {
                console.log('📱 حذف من التخزين المحلي فقط');
            }
            
            this.matches = this.matches.filter(m => m.id !== matchId);
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
            this.showAlert(`✅ تم حذف المباراة "${matchInfo}" بنجاح`, 'success');
            
            console.log(`🎉 تم الانتهاء من حذف المباراة ${matchId}`);
            
        } catch (error) {
            console.error('❌ خطأ في حذف المباراة:', error);
            this.showAlert('خطأ في حذف المباراة: ' + error.message, 'error');
        }
    }

    // ============================================
    // القسم 14: إدارة الإشعارات
    // ============================================
    async saveNotification(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        try {
            const notificationTitle = document.getElementById('notificationTitle').value;
            const notificationMessage = document.getElementById('notificationMessage').value;
            
            if (!notificationTitle || !notificationMessage) {
                this.showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
                return false;
            }
            
            const notificationData = {
                title: notificationTitle,
                message: notificationMessage,
                type: document.getElementById('notificationType').value,
                status: document.getElementById('notificationStatus').value,
                updatedAt: new Date()
            };
            
            const notificationId = document.getElementById('notificationId').value;
            
            if (notificationId) {
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    await db.collection('notifications').doc(notificationId).update(notificationData);
                }
                
                const index = this.notifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    this.notifications[index] = { ...this.notifications[index], ...notificationData };
                }
                
                this.showAlert('تم تحديث الإشعار بنجاح', 'success');
            } else {
                notificationData.createdAt = new Date();
                let newNotificationId;
                
                if (this.firestoreAvailable) {
                    const db = this.getDB();
                    const docRef = await db.collection('notifications').add(notificationData);
                    newNotificationId = docRef.id;
                } else {
                    newNotificationId = 'local_' + Date.now();
                    notificationData.id = newNotificationId;
                }
                
                this.notifications.push({
                    id: newNotificationId,
                    ...notificationData
                });
                
                this.showAlert('تم إرسال الإشعار بنجاح', 'success');
            }
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            this.resetNotificationForm();
            
            return true;
            
        } catch (error) {
            console.error('❌ خطأ في حفظ الإشعار:', error);
            this.showAlert('خطأ في حفظ الإشعار: ' + error.message, 'error');
            return false;
        }
    }

    editNotification(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;
        
        this.editingNotification = notification;
        
        document.getElementById('notificationId').value = notification.id;
        document.getElementById('notificationTitle').value = notification.title;
        document.getElementById('notificationMessage').value = notification.message;
        document.getElementById('notificationType').value = notification.type || 'info';
        document.getElementById('notificationStatus').value = notification.status || 'active';
        
        document.getElementById('notificationFormTitle').textContent = 'تعديل الإشعار';
        document.getElementById('notificationSaveButton').textContent = 'تحديث الإشعار';
        document.getElementById('cancelNotificationEdit').style.display = 'block';
    }

    cancelEditNotification() {
        this.editingNotification = null;
        this.resetNotificationForm();
    }

    resetNotificationForm() {
        const form = document.getElementById('notificationForm');
        if (form) form.reset();
        
        document.getElementById('notificationId').value = '';
        document.getElementById('notificationFormTitle').textContent = 'إرسال إشعار جديد';
        document.getElementById('notificationSaveButton').textContent = 'إرسال الإشعار';
        document.getElementById('cancelNotificationEdit').style.display = 'none';
        document.getElementById('notificationType').value = 'info';
        document.getElementById('notificationStatus').value = 'active';
    }

    async deleteNotification(notificationId) {
        if (event) event.stopPropagation();
        
        if (!confirm('⚠️ هل أنت متأكد من حذف هذا الإشعار؟')) {
            return;
        }
        
        try {
            console.log(`🗑️ بدء حذف الإشعار: ${notificationId}`);
            
            const notificationToDelete = this.notifications.find(n => n.id === notificationId);
            if (!notificationToDelete) {
                this.showAlert('❌ الإشعار غير موجود', 'error');
                return;
            }
            
            const notificationTitle = notificationToDelete.title;
            
            if (this.firestoreAvailable) {
                const db = this.getDB();
                
                console.log('🗑️ جاري حذف الإشعار من Firebase...');
                await db.collection('notifications').doc(notificationId).delete();
                console.log(`✅ تم حذف الإشعار من Firebase: ${notificationId} (${notificationTitle})`);
                
            } else {
                console.log('📱 حذف من التخزين المحلي فقط');
            }
            
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
            this.showAlert(`✅ تم حذف الإشعار "${notificationTitle}" بنجاح`, 'success');
            
            console.log(`🎉 تم الانتهاء من حذف الإشعار ${notificationId}`);
            
        } catch (error) {
            console.error('❌ خطأ في حذف الإشعار:', error);
            this.showAlert('خطأ في حذف الإشعار: ' + error.message, 'error');
        }
    }

    // ============================================
    // القسم 15: النسخ الاحتياطي
    // ============================================
    exportAllData() {
        const allData = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                app: 'Bein Live Pro'
            },
            sections: this.sections,
            channels: this.channels,
            matches: this.matches,
            notifications: this.notifications,
            statistics: {
                totalSections: this.sections.length,
                totalChannels: this.channels.length,
                totalMatches: this.matches.length,
                totalNotifications: this.notifications.length
            }
        };
        
        this.downloadJSON(allData, `bein-backup-${new Date().toISOString().split('T')[0]}.json`);
        this.showAlert('تم تصدير جميع البيانات بنجاح', 'success');
    }

    exportData(dataType) {
        let data = {};
        let fileName = '';
        
        switch(dataType) {
            case 'sections':
                data = { sections: this.sections };
                fileName = `bein-sections-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'channels':
                data = { channels: this.channels };
                fileName = `bein-channels-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'matches':
                data = { matches: this.matches };
                fileName = `bein-matches-${new Date().toISOString().split('T')[0]}.json`;
                break;
            case 'notifications':
                data = { notifications: this.notifications };
                fileName = `bein-notifications-${new Date().toISOString().split('T')[0]}.json`;
                break;
        }
        
        if (Object.keys(data).length > 0) {
            this.downloadJSON(data, fileName);
            this.showAlert(`تم تصدير ${dataType} بنجاح`, 'success');
        }
    }

    downloadJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    async importData() {
        const fileInput = document.getElementById('importFile');
        const dataType = document.getElementById('importDataType').value;
        
        if (!fileInput.files.length) {
            this.showAlert('يرجى اختيار ملف JSON', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!confirm(`هل أنت متأكد من استيراد بيانات ${dataType}؟\nهذا سيعيد كتابة البيانات الحالية.`)) {
                    return;
                }
                
                switch(dataType) {
                    case 'all':
                        await this.importAllData(importedData);
                        break;
                    case 'sections':
                        await this.importSections(importedData.sections);
                        break;
                    case 'channels':
                        await this.importChannels(importedData.channels);
                        break;
                    case 'matches':
                        await this.importMatches(importedData.matches);
                        break;
                    case 'notifications':
                        await this.importNotifications(importedData.notifications);
                        break;
                }
                
                this.showAlert(`تم استيراد ${dataType} بنجاح`, 'success');
                fileInput.value = '';
                
            } catch (error) {
                console.error('❌ خطأ في استيراد البيانات:', error);
                this.showAlert('خطأ في استيراد البيانات: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    }

    async importAllData(data) {
        if (data.sections) {
            await this.importSections(data.sections);
        }
        
        if (data.channels) {
            await this.importChannels(data.channels);
        }
        
        if (data.matches) {
            await this.importMatches(data.matches);
        }
        
        if (data.notifications) {
            await this.importNotifications(data.notifications);
        }
    }

    async importSections(sectionsData) {
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                const batch = db.batch();
                
                const sectionsSnapshot = await db.collection('sections').get();
                sectionsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                sectionsData.forEach(section => {
                    const { id, ...sectionData } = section;
                    const docRef = db.collection('sections').doc();
                    batch.set(docRef, sectionData);
                });
                
                await batch.commit();
            }
            
            this.sections = sectionsData.map(section => ({
                ...section,
                id: this.firestoreAvailable ? undefined : section.id
            }));
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
        } catch (error) {
            throw error;
        }
    }

    async importChannels(channelsData) {
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                const batch = db.batch();
                
                const channelsSnapshot = await db.collection('channels').get();
                channelsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                channelsData.forEach(channel => {
                    const { id, ...channelData } = channel;
                    const docRef = db.collection('channels').doc();
                    batch.set(docRef, channelData);
                });
                
                await batch.commit();
            }
            
            this.channels = channelsData.map(channel => ({
                ...channel,
                id: this.firestoreAvailable ? undefined : channel.id
            }));
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
        } catch (error) {
            throw error;
        }
    }

    async importMatches(matchesData) {
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                const batch = db.batch();
                
                const matchesSnapshot = await db.collection('matches').get();
                matchesSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                matchesData.forEach(match => {
                    const { id, ...matchData } = match;
                    const docRef = db.collection('matches').doc();
                    batch.set(docRef, matchData);
                });
                
                await batch.commit();
            }
            
            this.matches = matchesData.map(match => ({
                ...match,
                id: this.firestoreAvailable ? undefined : match.id
            }));
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
        } catch (error) {
            throw error;
        }
    }

    async importNotifications(notificationsData) {
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                const batch = db.batch();
                
                const notificationsSnapshot = await db.collection('notifications').get();
                notificationsSnapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                notificationsData.forEach(notification => {
                    const { id, ...notificationData } = notification;
                    const docRef = db.collection('notifications').doc();
                    batch.set(docRef, notificationData);
                });
                
                await batch.commit();
            }
            
            this.notifications = notificationsData.map(notification => ({
                ...notification,
                id: this.firestoreAvailable ? undefined : notification.id
            }));
            
            this.saveToLocalStorage();
            this.renderData();
            this.updateBackupStats();
            
        } catch (error) {
            throw error;
        }
    }

    async syncToFirebase() {
        if (!this.firestoreAvailable) {
            this.showAlert('Firebase غير متاح', 'error');
            return;
        }
        
        if (!confirm('سيتم رفع جميع البيانات المحلية إلى Firebase. هل أنت متأكد؟')) {
            return;
        }
        
        try {
            const db = this.getDB();
            
            for (const section of this.sections) {
                const { id, ...sectionData } = section;
                await db.collection('sections').doc(id || undefined).set(sectionData);
            }
            
            for (const channel of this.channels) {
                const { id, ...channelData } = channel;
                await db.collection('channels').doc(id || undefined).set(channelData);
            }
            
            for (const match of this.matches) {
                const { id, ...matchData } = match;
                await db.collection('matches').doc(id || undefined).set(matchData);
            }
            
            for (const notification of this.notifications) {
                const { id, ...notificationData } = notification;
                await db.collection('notifications').doc(id || undefined).set(notificationData);
            }
            
            this.showAlert('تم مزامنة البيانات إلى Firebase بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في مزامنة البيانات:', error);
            this.showAlert('خطأ في مزامنة البيانات: ' + error.message, 'error');
        }
    }

    async syncFromFirebase() {
        if (!this.firestoreAvailable) {
            this.showAlert('Firebase غير متاح', 'error');
            return;
        }
        
        if (!confirm('سيتم تنزيل جميع البيانات من Firebase. هل أنت متأكد؟')) {
            return;
        }
        
        try {
            await this.loadDataFromFirestore();
            this.showAlert('تم مزامنة البيانات من Firebase بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في مزامنة البيانات:', error);
            this.showAlert('خطأ في مزامنة البيانات: ' + error.message, 'error');
        }
    }

    clearLocalData() {
        if (!confirm('سيتم مسح جميع البيانات من التخزين المحلي. هل أنت متأكد؟')) {
            return;
        }
        
        try {
            localStorage.removeItem('bein_sections');
            localStorage.removeItem('bein_channels');
            localStorage.removeItem('bein_matches');
            localStorage.removeItem('bein_notifications');
            
            this.sections = [];
            this.channels = [];
            this.matches = [];
            this.notifications = [];
            this.expandedSections.clear();
            
            this.renderData();
            this.updateBackupStats();
            this.showAlert('تم مسح البيانات المحلية بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في مسح البيانات المحلية:', error);
            this.showAlert('خطأ في مسح البيانات المحلية: ' + error.message, 'error');
        }
    }

    async resetAllData() {
        if (!confirm('تحذير: سيتم مسح جميع البيانات من Firebase والتخزين المحلي. هذه العملية لا يمكن التراجع عنها. هل أنت متأكد؟')) {
            return;
        }
        
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                
                const collections = ['sections', 'channels', 'matches', 'notifications'];
                
                for (const collectionName of collections) {
                    const snapshot = await db.collection(collectionName).get();
                    const batch = db.batch();
                    
                    snapshot.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    
                    await batch.commit();
                }
            }
            
            localStorage.removeItem('bein_sections');
            localStorage.removeItem('bein_channels');
            localStorage.removeItem('bein_matches');
            localStorage.removeItem('bein_notifications');
            
            this.sections = [];
            this.channels = [];
            this.matches = [];
            this.notifications = [];
            this.expandedSections.clear();
            
            this.renderData();
            this.updateBackupStats();
            this.showAlert('تم إعادة تعيين جميع البيانات بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في إعادة تعيين البيانات:', error);
            this.showAlert('خطأ في إعادة تعيين البيانات: ' + error.message, 'error');
        }
    }

    // ============================================
    // القسم 16: دوال مساعدة
    // ============================================
    setupUI() {
        if (typeof bootstrap === 'undefined') {
            console.error('❌ Bootstrap غير محمل');
            this.showAlert('Bootstrap غير محمل. يرجى تحميل مكتبة Bootstrap', 'error');
        }
    }

    setupTabsEvents() {
        const tabs = document.querySelectorAll('#adminTabs .nav-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                if (tab.getAttribute('href') === '#matchesTab') {
                    setTimeout(() => {
                        this.populateChannelDropdown();
                        
                        // ضبط التاريخ الافتراضي
                        const today = new Date().toISOString().split('T')[0];
                        const dateInput = document.getElementById('matchDate');
                        if (dateInput && !dateInput.value) {
                            dateInput.value = today;
                        }
                        
                        // ضبط الوقت الافتراضي
                        const timeInput = document.getElementById('matchTime');
                        if (timeInput && !timeInput.value) {
                            const now = new Date();
                            const hours = now.getHours().toString().padStart(2, '0');
                            const minutes = now.getMinutes().toString().padStart(2, '0');
                            timeInput.value = `${hours}:${minutes}`;
                        }
                    }, 100);
                }
                
                if (tab.getAttribute('href') === '#channelsTab') {
                    setTimeout(() => {
                        this.populateSectionDropdown();
                    }, 100);
                }
                
                if (tab.getAttribute('href') === '#backupTab') {
                    setTimeout(() => {
                        this.updateBackupStats();
                    }, 100);
                }
            });
        });
    }

    updateImagePreview(imageUrl, previewId) {
        const preview = document.getElementById(previewId);
        if (preview && imageUrl && imageUrl.trim() !== '') {
            preview.src = imageUrl;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.insertBefore(alertDiv, adminPanel.firstChild);
        }
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    retryFirebaseConnection = async function() {
        this.showFirebaseStatus('جاري إعادة الاتصال بقاعدة البيانات...', 'warning');
        await this.checkFirebase();
        
        if (this.firestoreAvailable) {
            await this.loadDataFromFirestore();
        }
    };

    logout() {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    // ============================================
    // القسم 17: تشغيل القنوات
    // ============================================

    playChannel(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        
        if (!channel) {
            this.showAlert('القناة غير موجودة', 'error');
            return;
        }
        
        if (!channel.url || channel.url === '#') {
            this.showAlert('رابط البث غير متوفر لهذه القناة', 'error');
            return;
        }
        
        console.log(`▶️ محاولة تشغيل القناة: ${channel.name}`);
        
        // طرق التشغيل المتعددة
        this.showPlayOptions(channel);
    }

    showPlayOptions(channel) {
        const optionsHTML = `
            <div class="modal fade" id="playOptionsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="background: rgba(0,0,0,0.9); border: 2px solid #42318F;">
                        <div class="modal-header" style="border-bottom: 1px solid #42318F;">
                            <h5 class="modal-title text-white">
                                <i class="uil uil-play-circle me-2"></i>تشغيل القناة
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <img src="${channel.image || 'https://via.placeholder.com/100/2F2562/FFFFFF?text=TV'}" 
                                     alt="${channel.name}"
                                     class="rounded mb-3"
                                     style="width: 100px; height: 60px; object-fit: cover; border: 2px solid #654FD4;"
                                     onerror="this.src='https://via.placeholder.com/100/2F2562/FFFFFF?text=TV'">
                                <h4 class="text-white">${channel.name}</h4>
                            </div>
                            
                            <div class="play-options">
                                <button class="play-option-btn btn btn-success mb-3" onclick="adminManager.openPlayerInTab('${channel.id}')">
                                    <i class="uil uil-external-link-alt me-2"></i>
                                    <div class="option-text">
                                        <strong>نافذة جديدة</strong>
                                        <small class="d-block">فتح المشغل في نافذة جديدة</small>
                                    </div>
                                </button>
                                
                                <button class="play-option-btn btn btn-primary mb-3" onclick="adminManager.openPlayerInCurrentTab('${channel.id}')">
                                    <i class="uil uil-play me-2"></i>
                                    <div class="option-text">
                                        <strong>تشغيل مباشر</strong>
                                        <small class="d-block">تشغيل في نفس الصفحة</small>
                                    </div>
                                </button>
                                
                                <button class="play-option-btn btn btn-warning mb-3" onclick="adminManager.copyStreamUrl('${channel.id}')">
                                    <i class="uil uil-copy me-2"></i>
                                    <div class="option-text">
                                        <strong>نسخ الرابط</strong>
                                        <small class="d-block">نسخ رابط البث للحفظ</small>
                                    </div>
                                </button>
                                
                                <button class="play-option-btn btn btn-info" onclick="adminManager.testStream('${channel.id}')">
                                    <i class="uil uil-search me-2"></i>
                                    <div class="option-text">
                                        <strong>اختبار البث</strong>
                                        <small class="d-block">فحص جودة البث</small>
                                    </div>
                                </button>
                            </div>
                            
                            <div class="stream-info mt-4 p-3 rounded" style="background: rgba(66, 49, 143, 0.2);">
                                <h6 class="text-white mb-2"><i class="uil uil-info-circle me-2"></i>معلومات البث</h6>
                                <div class="text-muted small">
                                    <div class="d-flex justify-content-between mb-1">
                                        <span>نوع الرابط:</span>
                                        <span class="${channel.url.includes('.m3u8') ? 'text-success' : 'text-warning'}">
                                            ${channel.url.includes('.m3u8') ? 'HLS (.m3u8)' : 
                                              channel.url.includes('.mpd') ? 'DASH (.mpd)' : 
                                              'مباشر'}
                                        </span>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <span>حالة الرابط:</span>
                                        <span class="${channel.url.startsWith('http') ? 'text-success' : 'text-danger'}">
                                            ${channel.url.startsWith('http') ? 'صالح' : 'غير صالح'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // إضافة المودال إلى الصفحة
        document.body.insertAdjacentHTML('beforeend', optionsHTML);
        
        // عرض المودال
        const playOptionsModal = new bootstrap.Modal(document.getElementById('playOptionsModal'));
        playOptionsModal.show();
        
        // تنظيف المودال بعد الإغلاق
        document.getElementById('playOptionsModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
        });
    }

    // 🔹 1. فتح المشغل في نافذة جديدة
    openPlayerInTab(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) return;
        
        // إغلاق مودال الخيارات
        const modal = bootstrap.Modal.getInstance(document.getElementById('playOptionsModal'));
        if (modal) modal.hide();
        
        // بناء رابط المشغل
        const playerUrl = this.buildPlayerUrl(channel);
        
        // فتح في نافذة جديدة
        const newWindow = window.open(playerUrl, '_blank', 
            `width=${screen.width * 0.8},height=${screen.height * 0.8},resizable=yes,scrollbars=yes,top=100,left=100`);
        
        if (newWindow) {
            this.showAlert(`جاري تشغيل ${channel.name} في نافذة جديدة`, 'success');
            newWindow.focus();
        } else {
            this.showAlert('تم منع النافذة المنبثقة، جاري فتح في نفس الصفحة', 'warning');
            setTimeout(() => {
                window.location.href = playerUrl;
            }, 1000);
        }
    }

    // 🔹 2. فتح المشغل في نفس الصفحة
    openPlayerInCurrentTab(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) return;
        
        // إغلاق مودال الخيارات
        const modal = bootstrap.Modal.getInstance(document.getElementById('playOptionsModal'));
        if (modal) modal.hide();
        
        // بناء رابط المشغل
        const playerUrl = this.buildPlayerUrl(channel);
        
        // فتح في نفس الصفحة
        window.location.href = playerUrl;
    }

    // 🔹 3. نسخ رابط البث
    copyStreamUrl(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel || !channel.url) return;
        
        // نسخ الرابط إلى الحافظة
        navigator.clipboard.writeText(channel.url).then(() => {
            this.showAlert('تم نسخ رابط البث إلى الحافظة ✓', 'success');
        }).catch(err => {
            console.error('فشل نسخ الرابط:', err);
            this.showAlert('تعذر نسخ الرابط', 'error');
        });
    }

    // 🔹 4. اختبار البث
    testStream(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel || !channel.url) return;
        
        // إغلاق مودال الخيارات
        const modal = bootstrap.Modal.getInstance(document.getElementById('playOptionsModal'));
        if (modal) modal.hide();
        
        this.showAlert('جاري اختبار البث، يرجى الانتظار...', 'info');
        
        // فتح صفحة اختبار
        const testUrl = `test-stream.html?url=${encodeURIComponent(channel.url)}&name=${encodeURIComponent(channel.name)}`;
        window.open(testUrl, '_blank', 'width=800,height=600');
    }

    // 🔹 دالة مساعدة لبناء رابط المشغل
    buildPlayerUrl(channel) {
        let playerUrl = 'player.html?';
        
        // إضافة معرف القناة
        if (channel.id) {
            playerUrl += `channel=${encodeURIComponent(channel.id)}`;
        }
        
        // إضافة الاسم
        if (channel.name) {
            playerUrl += `&name=${encodeURIComponent(channel.name)}`;
        }
        
        // إضافة الصورة
        if (channel.image) {
            playerUrl += `&logo=${encodeURIComponent(channel.image)}`;
        }
        
        // إضافة رابط البث المباشر (اختياري)
        if (channel.url && channel.url !== '#') {
            playerUrl += `&stream=${encodeURIComponent(channel.url)}`;
        }
        
        return playerUrl;
    }
}

// ============================================
// تهيئة النظام
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 بدء تشغيل لوحة التحكم...');
    window.adminManager = new AdminManager();
});