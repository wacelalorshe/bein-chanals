// firebase-security-fixed.js - نظام حماية متقدم لقاعدة البيانات
console.log("🔒 تحميل نظام حماية Firebase...");

// التحقق إذا كان النظام قد تم تحميله مسبقاً
if (window.firebaseProtection && window.firebaseProtection.__initialized) {
    console.log("✅ نظام الحماية مفعل مسبقاً");
} else {
    class FirebaseProtection {
        constructor() {
            this.allowedDomains = [
                'wacelalorshe.github.io',
                'jedwal.netlify.app',
                'localhost',
                '127.0.0.1',
                'wacel-live-pro.web.app',
                'wacel-live-pro.firebaseapp.com'
            ];
            
            this.encryptionKey = 'wacel_pro_2025_secret_key';
            this.isValidDomain = false;
            this.__initialized = true; // علامة على التهيئة
            
            this.init();
        }
        
        init() {
            this.checkDomain();
            this.protectFirebaseData();
            this.preventDataTheft();
        }
        
        checkDomain() {
            const currentDomain = window.location.hostname;
            console.log("🌐 التحقق من المجال:", currentDomain);
            
            this.isValidDomain = this.allowedDomains.some(domain => 
                currentDomain.includes(domain) || domain.includes(currentDomain)
            );
            
            if (!this.isValidDomain) {
                console.warn("⚠️ الوصول من مجال غير مصرح:", currentDomain);
                this.blockUnauthorizedAccess();
            } else {
                console.log("✅ الوصول من مجال مصرح");
            }
            
            return this.isValidDomain;
        }
        
        protectFirebaseData() {
            // حفظ مرجع لـ fetch الأصلي إذا لم يكن محفوظاً
            if (!window.__originalFetch) {
                window.__originalFetch = window.fetch;
            }
            
            if (!window.__originalXHROpen) {
                window.__originalXHROpen = XMLHttpRequest.prototype.open;
            }
            
            // حماية طلبات Firebase مرة واحدة فقط
            if (!window.__firebaseProtected) {
                window.fetch = function(...args) {
                    const url = args[0];
                    
                    if (url && url.includes('firebaseio.com') && !window.firebaseProtection?.isValidDomain) {
                        console.error("🚫 محاولة وصول غير مصرحة إلى Firebase");
                        return Promise.reject(new Error('Access Denied: Unauthorized Domain'));
                    }
                    
                    return window.__originalFetch.apply(this, args);
                };
                
                XMLHttpRequest.prototype.open = function(method, url, ...args) {
                    if (url && url.includes('firebaseio.com') && !window.firebaseProtection?.isValidDomain) {
                        console.error("🚫 محاولة وصول غير مصرحة عبر XHR");
                        throw new Error('Access Denied: Unauthorized Domain');
                    }
                    return window.__originalXHROpen.apply(this, [method, url, ...args]);
                };
                
                window.__firebaseProtected = true;
            }
        }
        
        preventDataTheft() {
            // إضافة العلامات المائية مرة واحدة
            this.addWatermarkOnce();
        }
        
        addWatermarkOnce() {
            if (window.__watermarkAdded) return;
            
            // إضافة علامة مائية مخفية للبيانات
            window.addDataWatermark = function(data) {
                if (!data || typeof data !== 'object') return data;
                
                const watermarkedData = {
                    ...data,
                    __watermark: {
                        domain: window.location.hostname,
                        timestamp: Date.now(),
                        project: 'wacel-live-pro',
                        signature: window.firebaseProtection?.generateSignature?.(data) || 'unknown'
                    }
                };
                
                return watermarkedData;
            };
            
            // التحقق من العلامة المائية
            window.verifyWatermark = function(data) {
                if (!data || !data.__watermark) {
                    console.warn("⚠️ بيانات بدون علامة مائية");
                    return false;
                }
                
                const watermark = data.__watermark;
                const isValid = watermark.domain === window.location.hostname &&
                              watermark.project === 'wacel-live-pro' &&
                              watermark.signature === (window.firebaseProtection?.generateSignature?.(data) || 'unknown');
                
                if (!isValid) {
                    console.warn("🚫 بيانات مقلدة أو مسروقة");
                    window.firebaseProtection?.logSuspiciousActivity?.('Data Tampering Detected');
                }
                
                return isValid;
            };
            
            window.__watermarkAdded = true;
        }
        
        generateSignature(data) {
            const str = JSON.stringify(data) + this.encryptionKey + window.location.hostname;
            let hash = 0;
            
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            
            return Math.abs(hash).toString(16);
        }
        
        logSuspiciousActivity(action) {
            const logEntry = {
                action,
                domain: window.location.hostname,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            console.warn("🚫 نشاط مشبوه:", logEntry);
        }
        
        blockUnauthorizedAccess() {
            if (window.location.pathname.includes('admin.html')) {
                document.body.innerHTML = this.getBlockMessage();
                window.stop();
            }
        }
        
        getBlockMessage() {
            return `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    padding: 20px;
                    z-index: 99999;
                ">
                    <div style="max-width: 500px;">
                        <h1 style="color: #ff6b6b; font-size: 2.5rem; margin-bottom: 20px;">
                            ⛔ محتوى محمي
                        </h1>
                        <p style="font-size: 1.2rem; margin-bottom: 30px;">
                            لوحة التحكم متاحة فقط من النطاقات المصرح بها.
                        </p>
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            padding: 20px;
                            border-radius: 10px;
                            margin-bottom: 30px;
                        ">
                            <p style="margin-bottom: 10px;">
                                <strong>النطاق الحالي:</strong><br>
                                ${window.location.hostname}
                            </p>
                            <p>
                                <strong>النطاقات المسموحة:</strong><br>
                                wacelalorshe.github.io<br>
                                jedwal.netlify.app
                            </p>
                        </div>
                        <a href="https://wacelalorshe.github.io/jedwal/" 
                           style="
                               display: inline-block;
                               padding: 15px 30px;
                               background: white;
                               color: #667eea;
                               text-decoration: none;
                               border-radius: 50px;
                               font-weight: bold;
                               font-size: 1.1rem;
                           ">
                           🔗 الانتقال للموقع الرسمي
                        </a>
                    </div>
                </div>
            `;
        }
    }
    
    // إنشاء نسخة واحدة فقط
    window.firebaseProtection = new FirebaseProtection();
    console.log("✅ نظام حماية Firebase مفعل بنجاح");
}
