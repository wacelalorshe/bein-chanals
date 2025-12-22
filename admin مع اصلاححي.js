// ============================================
// admin.js
// نظام إدارة متكامل مع دعم التعديل والإشعارات والمباريات
// ============================================

// ============================================
// الجزء 1: تعريف فئة AdminManager
// ============================================
class AdminManager {
    constructor() {
        this.isAuthenticated = false;                 // 🔹 حالة تسجيل الدخول
        this.firebaseAvailable = false;               // 🔹 حالة اتصال Firebase
        this.firestoreAvailable = false;              // 🔹 حالة اتصال Firestore
        this.sections = [];                           // 🔹 مصفوفة الأقسام
        this.channels = [];                           // 🔹 مصفوفة القنوات
        this.notifications = [];                      // 🔹 مصفوفة الإشعارات
        this.matches = [];                            // 🔹 مصفوفة المباريات (جديد)
        this.editingSection = null;                   // 🔹 القسم قيد التعديل
        this.editingChannel = null;                   // 🔹 القناة قيد التعديل
        this.editingNotification = null;              // 🔹 الإشعار قيد التعديل
        this.editingMatch = null;                     // 🔹 المباراة قيد التعديل (جديد)
        this.init();                                   // 🔹 بدء التهيئة
    }

    // 🔹 الدالة: init()
    // 🔹 الوظيفة: تهيئة النظام
    // 🔹 الاستخدام: يتم استدعاؤها تلقائياً عند إنشاء الكائن
    async init() {
        console.log('AdminManager initializing...');
        
        this.checkAuthentication();
        await this.checkFirebase();
        this.setupUI();
    }

    checkAuthentication() {
        const storedAuth = localStorage.getItem('adminAuth');
        const storedEmail = localStorage.getItem('adminEmail');
        
        console.log('Authentication check:', { storedAuth, storedEmail });
        
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

            await firebaseUtils.initializeFirebase();
            const db = firebaseUtils.getDB();
            
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

    // 🔹 الدالة: initializeFirebase()
    // 🔹 الوظيفة: تهيئة Firebase
    // 🔹 الاستخدام: عند التحقق من الاتصال
    async initializeFirebase() {
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

    // 🔹 الدالة: getDB()
    // 🔹 الوظيفة: الحصول على كائن قاعدة البيانات
    // 🔹 الاستخدام: عند الحاجة للتعامل مع Firestore
    getDB() {
        return firebase.firestore();
    }

    // ============================================
    // الجزء 3: دوال عرض الواجهة
    // ============================================

    // 🔹 الدالة: showFirebaseStatus()
    // 🔹 الوظيفة: عرض حالة اتصال Firebase
    // 🔹 الاستخدام: عند التحقق من الاتصال
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

    // 🔹 الدالة: showAdminPanel()
    // 🔹 الوظيفة: عرض لوحة التحكم
    // 🔹 الاستخدام: بعد تسجيل الدخول الناجح
    showAdminPanel() {
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('loginRequired').style.display = 'none';
        this.loadAdminInterface();
    }

    // 🔹 الدالة: showLoginRequired()
    // 🔹 الوظيفة: عرض رسالة تسجيل الدخول المطلوب
    // 🔹 الاستخدام: عند عدم تسجيل الدخول
    showLoginRequired() {
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('loginRequired').style.display = 'block';
    }

    // 🔹 الدالة: loadAdminInterface()
    // 🔹 الوظيفة: تحميل واجهة لوحة التحكم
    // 🔹 الاستخدام: بعد عرض لوحة التحكم
    loadAdminInterface() {
        const adminPanel = document.getElementById('adminPanel');
        
        adminPanel.innerHTML = `
            <!-- 🔹 حالة اتصال Firebase -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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

        this.loadData();
        this.setupTabsEvents();
    }

    // ============================================
    // الجزء 4: دوال تحميل البيانات
    // ============================================

    // 🔹 الدالة: loadData()
    // 🔹 الوظيفة: تحميل جميع البيانات من قاعدة البيانات
    // 🔹 الاستخدام: عند بدء لوحة التحكم
    async loadData() {
        if (this.firestoreAvailable) {
            await this.loadDataFromFirestore();
        } else {
            this.loadDataFromLocalStorage();
        }
    }

    // 🔹 الدالة: loadDataFromFirestore()
    // 🔹 الوظيفة: تحميل البيانات من Firebase
    // 🔹 الاستخدام: عندما يكون اتصال Firebase متاحاً
    async loadDataFromFirestore() {
        try {
            const db = this.getDB();
            
            // 🔹 تحميل الأقسام
            const sectionsSnapshot = await db.collection('sections').orderBy('order').get();
            this.sections = sectionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // 🔹 تحميل القنوات
            const channelsSnapshot = await db.collection('channels').orderBy('order').get();
            this.channels = channelsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // 🔹 تحميل المباريات
            const matchesSnapshot = await db.collection('matches').orderBy('matchDate').get();
            this.matches = matchesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // 🔹 تحميل الإشعارات
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

    // 🔹 الدالة: loadDataFromLocalStorage()
    // 🔹 الوظيفة: تحميل البيانات من التخزين المحلي
    // 🔹 الاستخدام: عند عدم توفر اتصال Firebase
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

    // 🔹 الدالة: saveToLocalStorage()
    // 🔹 الوظيفة: حفظ البيانات في التخزين المحلي
    // 🔹 الاستخدام: عند إضافة أو تعديل بيانات
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
    // الجزء 5: دوال عرض التبويبات
    // ============================================

    // 🔹 الدالة: loadSectionsTab()
    // 🔹 الوظيفة: تحميل واجهة تبويب الأقسام
    // 🔹 الاستخدام: عند النقر على تبويب الأقسام
    loadSectionsTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل قسم -->
            <div class="card mb-5" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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
                            <input type="text" id="sectionImage" class="form-control" placeholder="رابط الصورة (URL)">
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
            <div class="card" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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

    // 🔹 الدالة: loadChannelsTab()
    // 🔹 الوظيفة: تحميل واجهة تبويب القنوات
    // 🔹 الاستخدام: عند النقر على تبويب القنوات
    loadChannelsTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل قناة -->
            <div class="card mb-5" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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
                                    <input type="text" id="channelImage" class="form-control" placeholder="https://example.com/image.jpg">
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
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">رابط التطبيق</label>
                                    <input type="text" id="channelAppUrl" class="form-control" placeholder="https://play.google.com/store/apps/details?id=com.xpola.player">
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
            <div class="card" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
                <div class="card-header card-header-custom">
                    <h4 class="mb-0 text-white">
                        <i class="uil uil-tv"></i> القنوات المضافة
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

    // 🔹 الدالة: loadMatchesTab()
    // 🔹 الوظيفة: تحميل واجهة تبويب المباريات
    // 🔹 الاستخدام: عند النقر على تبويب المباريات
    loadMatchesTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل مباراة -->
            <div class="card mb-5" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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
                                <!-- 🔹 حل المشكلة هنا: إضافة id للعنصر select -->
                                <div class="form-group mb-3">
                                    <label class="form-label">القناة الناقلة *</label>
                                    <select id="matchChannel" class="form-control" required>
                                        <option value="">اختر القناة الناقلة</option>
                                        <!-- 🔹 سيتم تعبئة القنوات هنا تلقائياً -->
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
            <div class="card" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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

    // 🔹 الدالة: loadNotificationsTab()
    // 🔹 الوظيفة: تحميل واجهة تبويب الإشعارات
    // 🔹 الاستخدام: عند النقر على تبويب الإشعارات
    loadNotificationsTab() {
        return `
            <!-- 🔹 نموذج إضافة/تعديل إشعار -->
            <div class="card mb-5" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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
            <div class="card" style="background: rgba(0,0,0,0.7); border: 1px solid #42318F;">
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

    // ============================================
    // الجزء 6: دوال التعبئة والعرض
    // ============================================

    // 🔹 الدالة: renderData()
    // 🔹 الوظيفة: عرض جميع البيانات في الواجهة
    // 🔹 الاستخدام: بعد تحميل البيانات
    renderData() {
        this.renderSectionsList();                     // 🔹 عرض قائمة الأقسام
        this.renderChannelsList();                     // 🔹 عرض قائمة القنوات
        this.renderMatchesList();                      // 🔹 عرض قائمة المباريات
        this.renderNotificationsList();                // 🔹 عرض قائمة الإشعارات
        this.updateStats();                            // 🔹 تحديث الإحصائيات
        this.populateDropdowns();                      // 🔹 تعبئة القوائم المنسدلة
    }

    // 🔹 الدالة: populateDropdowns()
    // 🔹 الوظيفة: تعبئة جميع القوائم المنسدلة
    // 🔹 الاستخدام: بعد تحميل البيانات
    populateDropdowns() {
        this.populateSectionDropdown();                // 🔹 تعبئة قائمة الأقسام للقنوات
        this.populateChannelDropdown();                // 🔹 تعبئة قائمة القنوات للمباريات (الحل هنا)
    }

    // 🔹 الدالة: populateSectionDropdown()
    // 🔹 الوظيفة: تعبئة قائمة الأقسام في نموذج القنوات
    // 🔹 الاستخدام: عند إضافة قناة جديدة
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

    // 🔹 الدالة: populateChannelDropdown()
    // 🔹 الوظيفة: تعبئة قائمة القنوات في نموذج المباريات (هذا هو الحل)
    // 🔹 الاستخدام: عند إضافة مباراة جديدة
    populateChannelDropdown() {
        const dropdown = document.getElementById('matchChannel');
        if (!dropdown) {
            console.log('❌ عنصر matchChannel غير موجود في الصفحة');
            return;
        }
        
        console.log('🔍 جاري تعبئة قائمة القنوات...');
        console.log('📊 عدد القنوات المتاحة:', this.channels.length);
        
        dropdown.innerHTML = '<option value="">اختر القناة الناقلة</option>';
        
        // 🔹 ترتيب القنوات حسب الاسم
        const sortedChannels = [...this.channels].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        sortedChannels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.id;
            option.textContent = channel.name;
            dropdown.appendChild(option);
        });
        
        console.log('✅ تم تعبئة قائمة القنوات بـ ' + sortedChannels.length + ' قناة');
    }

    // ============================================
    // الجزء 7: دوال عرض القوائم
    // ============================================

    // 🔹 الدالة: renderSectionsList()
    // 🔹 الوظيفة: عرض قائمة الأقسام
    // 🔹 الاستخدام: في renderData()
    renderSectionsList() {
        const container = document.getElementById('sectionsList');
        const countElement = document.getElementById('sectionsCount');
        
        if (!container) return;
        
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
        
        container.innerHTML = this.sections.map(section => `
            <div class="section-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="section-info">
                            <h5 class="text-white mb-1">${section.name}</h5>
                            <div class="text-muted">
                                <small>الترتيب: ${section.order || 1}</small>
                                <span class="mx-2">•</span>
                                <small class="${section.isActive !== false ? 'text-success' : 'text-danger'}">
                                    ${section.isActive !== false ? 'نشط' : 'غير نشط'}
                                </small>
                            </div>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-warning btn-sm me-1" onclick="adminManager.editSection('${section.id}')">
                            <i class="uil uil-edit"></i> تعديل
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminManager.deleteSection('${section.id}')">
                            <i class="uil uil-trash-alt"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        if (countElement) countElement.textContent = this.sections.length;
    }

    // 🔹 الدالة: renderChannelsList()
    // 🔹 الوظيفة: عرض قائمة القنوات
    // 🔹 الاستخدام: في renderData()
    renderChannelsList() {
        const container = document.getElementById('channelsList');
        const countElement = document.getElementById('channelsCount');
        
        if (!container) return;
        
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
        
        container.innerHTML = this.channels.map(channel => {
            const section = this.sections.find(s => s.id === channel.sectionId);
            
            return `
                <div class="channel-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="channel-info">
                                <h5 class="text-white mb-1">${channel.name}</h5>
                                <div class="text-muted">
                                    <small>الترتيب: ${channel.order || 1}</small>
                                    ${section ? `<span class="mx-2">•</span><small>القسم: ${section.name}</small>` : ''}
                                    <span class="mx-2">•</span>
                                    <small class="${channel.url ? 'text-success' : 'text-danger'}">
                                        ${channel.url ? '🔗 رابط متاح' : '❌ بدون رابط'}
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-warning btn-sm me-1" onclick="adminManager.editChannel('${channel.id}')">
                                <i class="uil uil-edit"></i> تعديل
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="adminManager.deleteChannel('${channel.id}')">
                                <i class="uil uil-trash-alt"></i> حذف
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (countElement) countElement.textContent = this.channels.length;
    }

    // 🔹 الدالة: renderMatchesList()
    // 🔹 الوظيفة: عرض قائمة المباريات
    // 🔹 الاستخدام: في renderData()
    renderMatchesList() {
        const container = document.getElementById('matchesList');
        const countElement = document.getElementById('matchesCount');
        
        if (!container) return;
        
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

    // 🔹 الدالة: renderNotificationsList()
    // 🔹 الوظيفة: عرض قائمة الإشعارات
    // 🔹 الاستخدام: في renderData()
    renderNotificationsList() {
        const container = document.getElementById('notificationsList');
        const countElement = document.getElementById('notificationsCount');
        
        if (!container) return;
        
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
    // الجزء 8: دوال تحديث الإحصائيات
    // ============================================

    // 🔹 الدالة: updateStats()
    // 🔹 الوظيفة: تحديث الإحصائيات العامة
    // 🔹 الاستخدام: في renderData()
    updateStats() {
        // 🔹 تحديث عدد الأقسام
        const totalSections = document.getElementById('totalSections');
        if (totalSections) totalSections.textContent = this.sections.length;
        
        // 🔹 تحديث عدد القنوات
        const totalChannels = document.getElementById('totalChannels');
        if (totalChannels) totalChannels.textContent = this.channels.length;
        
        // 🔹 تحديث عدد المباريات
        const totalMatches = document.getElementById('totalMatches');
        if (totalMatches) totalMatches.textContent = this.matches.length;
        
        // 🔹 تحديث عدد الإشعارات النشطة
        const activeNotifications = document.getElementById('activeNotifications');
        if (activeNotifications) {
            const activeCount = this.notifications.filter(n => n.status === 'active').length;
            activeNotifications.textContent = activeCount;
        }
    }

    // ============================================
    // الجزء 9: دوال إدارة الأقسام
    // ============================================

    // 🔹 الدالة: saveSection()
    // 🔹 الوظيفة: حفظ قسم (إضافة أو تعديل)
    // 🔹 الاستخدام: عند إرسال نموذج القسم
    async saveSection(event) {
        event.preventDefault();
        
        const sectionData = {
            name: document.getElementById('sectionName').value,
            order: parseInt(document.getElementById('sectionOrder').value),
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
            this.resetSectionForm();
            
        } catch (error) {
            console.error('❌ خطأ في حفظ القسم:', error);
            this.showAlert('خطأ في حفظ القسم: ' + error.message, 'error');
        }
    }

    // 🔹 الدالة: editSection()
    // 🔹 الوظيفة: تحميل بيانات قسم للتعديل
    // 🔹 الاستخدام: عند النقر على زر تعديل قسم
    editSection(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) return;
        
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
    }

    // 🔹 الدالة: cancelEditSection()
    // 🔹 الوظيفة: إلغاء تعديل قسم
    // 🔹 الاستخدام: عند النقر على زر إلغاء
    cancelEditSection() {
        this.editingSection = null;
        this.resetSectionForm();
    }

    // 🔹 الدالة: resetSectionForm()
    // 🔹 الوظيفة: إعادة تعيين نموذج القسم
    // 🔹 الاستخدام: بعد الحفظ أو الإلغاء
    resetSectionForm() {
        document.getElementById('sectionForm').reset();
        document.getElementById('sectionId').value = '';
        document.getElementById('sectionFormTitle').textContent = 'إضافة قسم جديد';
        document.getElementById('sectionSaveButton').textContent = 'حفظ القسم';
        document.getElementById('cancelSectionEdit').style.display = 'none';
    }

    // 🔹 الدالة: deleteSection()
    // 🔹 الوظيفة: حذف قسم
    // 🔹 الاستخدام: عند النقر على زر حذف قسم
    async deleteSection(sectionId) {
        if (!confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
        
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                await db.collection('sections').doc(sectionId).delete();
            }
            
            this.sections = this.sections.filter(s => s.id !== sectionId);
            this.saveToLocalStorage();
            this.renderData();
            
            this.showAlert('تم حذف القسم بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في حذف القسم:', error);
            this.showAlert('خطأ في حذف القسم: ' + error.message, 'error');
        }
    }

    // ============================================
    // الجزء 10: دوال إدارة القنوات
    // ============================================

    // 🔹 الدالة: saveChannel()
    // 🔹 الوظيفة: حفظ قناة (إضافة أو تعديل)
    // 🔹 الاستخدام: عند إرسال نموذج القناة
    async saveChannel(event) {
        event.preventDefault();
        
        const channelData = {
            name: document.getElementById('channelName').value,
            image: document.getElementById('channelImage').value,
            url: document.getElementById('channelUrl').value,
            sectionId: document.getElementById('channelSection').value,
            order: parseInt(document.getElementById('channelOrder').value) || 1,
            appUrl: document.getElementById('channelAppUrl').value,
            updatedAt: new Date()
        };
        
        const channelId = document.getElementById('channelId').value;
        
        try {
            if (channelId) {
                // 🔹 تحديث قناة موجودة
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
                // 🔹 إضافة قناة جديدة
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
            this.resetChannelForm();
            
        } catch (error) {
            console.error('❌ خطأ في حفظ القناة:', error);
            this.showAlert('خطأ في حفظ القناة: ' + error.message, 'error');
        }
    }

    // 🔹 الدالة: editChannel()
    // 🔹 الوظيفة: تحميل بيانات قناة للتعديل
    // 🔹 الاستخدام: عند النقر على زر تعديل قناة
    editChannel(channelId) {
        const channel = this.channels.find(c => c.id === channelId);
        if (!channel) return;
        
        this.editingChannel = channel;
        
        document.getElementById('channelId').value = channel.id;
        document.getElementById('channelName').value = channel.name;
        document.getElementById('channelImage').value = channel.image || '';
        document.getElementById('channelUrl').value = channel.url || '';
        document.getElementById('channelSection').value = channel.sectionId || '';
        document.getElementById('channelOrder').value = channel.order || 1;
        document.getElementById('channelAppUrl').value = channel.appUrl || '';
        
        document.getElementById('channelFormTitle').textContent = 'تعديل القناة';
        document.getElementById('channelSaveButton').textContent = 'تحديث القناة';
        document.getElementById('cancelChannelEdit').style.display = 'block';
    }

    // 🔹 الدالة: cancelEditChannel()
    // 🔹 الوظيفة: إلغاء تعديل قناة
    // 🔹 الاستخدام: عند النقر على زر إلغاء
    cancelEditChannel() {
        this.editingChannel = null;
        this.resetChannelForm();
    }

    // 🔹 الدالة: resetChannelForm()
    // 🔹 الوظيفة: إعادة تعيين نموذج القناة
    // 🔹 الاستخدام: بعد الحفظ أو الإلغاء
    resetChannelForm() {
        document.getElementById('channelForm').reset();
        document.getElementById('channelId').value = '';
        document.getElementById('channelFormTitle').textContent = 'إضافة قناة جديدة';
        document.getElementById('channelSaveButton').textContent = 'حفظ القناة';
        document.getElementById('cancelChannelEdit').style.display = 'none';
        document.getElementById('channelAppUrl').value = 'https://play.google.com/store/apps/details?id=com.xpola.player';
    }

    // 🔹 الدالة: deleteChannel()
    // 🔹 الوظيفة: حذف قناة
    // 🔹 الاستخدام: عند النقر على زر حذف قناة
    async deleteChannel(channelId) {
        if (!confirm('هل أنت متأكد من حذف هذه القناة؟')) return;
        
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                await db.collection('channels').doc(channelId).delete();
            }
            
            this.channels = this.channels.filter(c => c.id !== channelId);
            this.saveToLocalStorage();
            this.renderData();
            
            this.showAlert('تم حذف القناة بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في حذف القناة:', error);
            this.showAlert('خطأ في حذف القناة: ' + error.message, 'error');
        }
    }

    // ============================================
    // الجزء 11: دوال إدارة المباريات
    // ============================================

    // 🔹 الدالة: saveMatch()
    // 🔹 الوظيفة: حفظ مباراة (إضافة أو تعديل)
    // 🔹 الاستخدام: عند إرسال نموذج المباراة
    async saveMatch(event) {
        event.preventDefault();
        console.log('💾 بدء حفظ المباراة...');
        
        const matchData = {
            team1: document.getElementById('team1').value,
            team2: document.getElementById('team2').value,
            competition: document.getElementById('competition').value,
            matchDate: document.getElementById('matchDate').value,
            matchTime: document.getElementById('matchTime').value,
            channelId: document.getElementById('matchChannel').value, // 🔹 هذا هو الحقل المهم
            status: document.getElementById('matchStatus').value,
            updatedAt: new Date()
        };
        
        console.log('📋 بيانات المباراة:', matchData);
        
        // 🔹 التحقق من اختيار قناة
        if (!matchData.channelId) {
            this.showAlert('يرجى اختيار القناة الناقلة', 'error');
            return;
        }
        
        const matchId = document.getElementById('matchId').value;
        
        try {
            if (matchId) {
                // 🔹 تحديث مباراة موجودة
                console.log('✏️ تحديث مباراة موجودة:', matchId);
                
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
                // 🔹 إضافة مباراة جديدة
                console.log('➕ إضافة مباراة جديدة');
                
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
            this.resetMatchForm();
            
        } catch (error) {
            console.error('❌ خطأ في حفظ المباراة:', error);
            this.showAlert('خطأ في حفظ المباراة: ' + error.message, 'error');
        }
    }

    // 🔹 الدالة: editMatch()
    // 🔹 الوظيفة: تحميل بيانات مباراة للتعديل
    // 🔹 الاستخدام: عند النقر على زر تعديل مباراة
    editMatch(matchId) {
        const match = this.matches.find(m => m.id === matchId);
        if (!match) return;
        
        this.editingMatch = match;
        
        console.log('✏️ تحميل مباراة للتعديل:', match);
        
        document.getElementById('matchId').value = match.id;
        document.getElementById('team1').value = match.team1;
        document.getElementById('team2').value = match.team2;
        document.getElementById('competition').value = match.competition;
        document.getElementById('matchDate').value = match.matchDate;
        document.getElementById('matchTime').value = match.matchTime;
        document.getElementById('matchChannel').value = match.channelId; // 🔹 هنا يتم تعيين القناة
        document.getElementById('matchStatus').value = match.status || 'upcoming';
        
        document.getElementById('matchFormTitle').textContent = 'تعديل المباراة';
        document.getElementById('matchSaveButton').textContent = 'تحديث المباراة';
        document.getElementById('cancelMatchEdit').style.display = 'block';
        
        console.log('✅ تم تحميل بيانات المباراة، القناة المختارة:', match.channelId);
    }

    // 🔹 الدالة: cancelEditMatch()
    // 🔹 الوظيفة: إلغاء تعديل مباراة
    // 🔹 الاستخدام: عند النقر على زر إلغاء
    cancelEditMatch() {
        this.editingMatch = null;
        this.resetMatchForm();
    }

    // 🔹 الدالة: resetMatchForm()
    // 🔹 الوظيفة: إعادة تعيين نموذج المباراة
    // 🔹 الاستخدام: بعد الحفظ أو الإلغاء
    resetMatchForm() {
        document.getElementById('matchForm').reset();
        document.getElementById('matchId').value = '';
        document.getElementById('matchFormTitle').textContent = 'إضافة مباراة جديدة';
        document.getElementById('matchSaveButton').textContent = 'حفظ المباراة';
        document.getElementById('cancelMatchEdit').style.display = 'none';
        document.getElementById('matchStatus').value = 'upcoming';
        
        // 🔹 تعيين تاريخ اليوم كتاريخ افتراضي
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('matchDate').value = today;
    }

    // 🔹 الدالة: deleteMatch()
    // 🔹 الوظيفة: حذف مباراة
    // 🔹 الاستخدام: عند النقر على زر حذف مباراة
    async deleteMatch(matchId) {
        if (!confirm('هل أنت متأكد من حذف هذه المباراة؟')) return;
        
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                await db.collection('matches').doc(matchId).delete();
            }
            
            this.matches = this.matches.filter(m => m.id !== matchId);
            this.saveToLocalStorage();
            this.renderData();
            
            this.showAlert('تم حذف المباراة بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في حذف المباراة:', error);
            this.showAlert('خطأ في حذف المباراة: ' + error.message, 'error');
        }
    }

    // ============================================
    // الجزء 12: دوال إدارة الإشعارات
    // ============================================

    // 🔹 الدالة: saveNotification()
    // 🔹 الوظيفة: حفظ إشعار (إضافة أو تعديل)
    // 🔹 الاستخدام: عند إرسال نموذج الإشعار
    async saveNotification(event) {
        event.preventDefault();
        
        const notificationData = {
            title: document.getElementById('notificationTitle').value,
            message: document.getElementById('notificationMessage').value,
            type: document.getElementById('notificationType').value,
            status: document.getElementById('notificationStatus').value,
            updatedAt: new Date()
        };
        
        const notificationId = document.getElementById('notificationId').value;
        
        try {
            if (notificationId) {
                // 🔹 تحديث إشعار موجود
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
                // 🔹 إضافة إشعار جديد
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
            this.resetNotificationForm();
            
        } catch (error) {
            console.error('❌ خطأ في حفظ الإشعار:', error);
            this.showAlert('خطأ في حفظ الإشعار: ' + error.message, 'error');
        }
    }

    // 🔹 الدالة: editNotification()
    // 🔹 الوظيفة: تحميل بيانات إشعار للتعديل
    // 🔹 الاستخدام: عند النقر على زر تعديل إشعار
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

    // 🔹 الدالة: cancelEditNotification()
    // 🔹 الوظيفة: إلغاء تعديل إشعار
    // 🔹 الاستخدام: عند النقر على زر إلغاء
    cancelEditNotification() {
        this.editingNotification = null;
        this.resetNotificationForm();
    }

    // 🔹 الدالة: resetNotificationForm()
    // 🔹 الوظيفة: إعادة تعيين نموذج الإشعار
    // 🔹 الاستخدام: بعد الحفظ أو الإلغاء
    resetNotificationForm() {
        document.getElementById('notificationForm').reset();
        document.getElementById('notificationId').value = '';
        document.getElementById('notificationFormTitle').textContent = 'إرسال إشعار جديد';
        document.getElementById('notificationSaveButton').textContent = 'إرسال الإشعار';
        document.getElementById('cancelNotificationEdit').style.display = 'none';
        document.getElementById('notificationType').value = 'info';
        document.getElementById('notificationStatus').value = 'active';
    }

    // 🔹 الدالة: deleteNotification()
    // 🔹 الوظيفة: حذف إشعار
    // 🔹 الاستخدام: عند النقر على زر حذف إشعار
    async deleteNotification(notificationId) {
        if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) return;
        
        try {
            if (this.firestoreAvailable) {
                const db = this.getDB();
                await db.collection('notifications').doc(notificationId).delete();
            }
            
            this.notifications = this.notifications.filter(n => n.id !== notificationId);
            this.saveToLocalStorage();
            this.renderData();
            
            this.showAlert('تم حذف الإشعار بنجاح', 'success');
            
        } catch (error) {
            console.error('❌ خطأ في حذف الإشعار:', error);
            this.showAlert('خطأ في حذف الإشعار: ' + error.message, 'error');
        }
    }

    // ============================================
    // الجزء 13: دوال مساعدة
    // ============================================

    // 🔹 الدالة: setupTabsEvents()
    // 🔹 الوظيفة: إعداد أحداث التبويبات
    // 🔹 الاستخدام: عند تحميل واجهة لوحة التحكم
    setupTabsEvents() {
        const tabs = document.querySelectorAll('#adminTabs .nav-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // 🔹 عند النقر على تبويب المباريات، قم بتعبئة القائمة المنسدلة
                if (tab.getAttribute('href') === '#matchesTab') {
                    console.log('📋 تم النقر على تبويب المباريات، جاري تحديث القنوات...');
                    setTimeout(() => {
                        this.populateChannelDropdown();
                    }, 100);
                }
            });
        });
    }

    // 🔹 الدالة: showAlert()
    // 🔹 الوظيفة: عرض رسالة تنبيه
    // 🔹 الاستخدام: عند نجاح أو فشل عملية
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

    // 🔹 الدالة: retryFirebaseConnection()
    // 🔹 الوظيفة: إعادة محاولة الاتصال بـ Firebase
    // 🔹 الاستخدام: عند النقر على زر إعادة المحاولة
    async retryFirebaseConnection() {
        this.showFirebaseStatus('جاري إعادة الاتصال بقاعدة البيانات...', 'warning');
        await this.checkFirebase();
        
        if (this.firestoreAvailable) {
            await this.loadDataFromFirestore();
        }
    }

    // 🔹 الدالة: logout()
    // 🔹 الوظيفة: تسجيل الخروج
    // 🔹 الاستخدام: عند النقر على زر تسجيل الخروج
    logout() {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// ============================================
// الجزء 14: تهيئة النظام
// ============================================

// 🔹 الحدث: DOMContentLoaded
// 🔹 الوظيفة: بدء النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 بدء تشغيل لوحة التحكم...');
    window.adminManager = new AdminManager();
});