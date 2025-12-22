// ============================================
// matches.js - النسخة المعدلة مع إضافة خيار عدم المشاهدة مرة أخرى وقاعدة بيانات الأندية والمنتخبات
// ============================================

class MatchApp {
    constructor() {
        this.matchesList = [];
        this.channelsList = [];
        this.hasAppInstalled = localStorage.getItem('app_installed') === 'true';
        this.dontShowAgain = localStorage.getItem('dont_show_modal') === 'true';
        this.currentFilter = 'today';
        this.isFirebaseAvailable = false;
        
        // 🆕 إضافة: قاعدة بيانات الأندية والمنتخبات فقط
        this.teamLogos = this.getTeamLogos();
        
        this.initializeApp();
    }
    
    // 🔹 قاعدة بيانات شعارات الأندية والمنتخبات (URLs حقيقية من Wikimedia Commons)
    // 🔹 قاعدة بيانات شعارات الأندية والمنتخبات (مُحدثة بناءً على الروابط المقدمة)
    getTeamLogos() {
        return {
            // ===================================
            // المنتخبات الوطنية (مدموجة من أقسام كأس العالم، وكأس الأمم، وكوبا أمريكا، وكأس العرب)
            // ===================================

                 // المنتخبات العربية
            'السعودية': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/ksa.png', color: '#006C3E' },
            'قطر': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/qat.png', color: '#8A1538' },
            'الإمارات': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/uae.png', color: '#DC3545' },
            'مصر': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/egy.png', color: '#DC3545' },
            'المغرب': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/mar.png', color: '#C1272D' },
            'الجزائر': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/alg.png', color: '#008000' },
            'تونس': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/tun.png', color: '#E9BC03' },
            'العراق': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/irq.png', color: '#DC3545' },
            'الأردن': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/jor.png', color: '#000000' },
            'عمان': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/oma.png', color: '#DC3545' },
            'البحرين': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/bhr.png', color: '#DC3545' },
            'سوريا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/syr.png', color: '#DC3545' },
            'لبنان': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/lib.png', color: '#DC3545' },
            'فلسطين': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/ple.png', color: '#009739' },
            'السودان': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/sud.png', color: '#000000' },
            'ليبيا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/lby.png', color: '#008C49' },

            // المنتخبات الأوروبية
            'فرنسا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/fra.png', color: '#0055A4' },
            'ألمانيا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/ger.png', color: '#000000' },
            'إسبانيا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/esp.png', color: '#AA151B' },
            'إنجلترا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/eng.png', color: '#FFFFFF' },
            'البرتغال': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/por.png', color: '#E42514' },
            'هولندا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/ned.png', color: '#FF6600' },
            'بلجيكا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/bel.png', color: '#EF3340' },
            'كرواتيا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/cro.png', color: '#DC052B' },
            'إيطاليا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/ita.png', color: '#009246' },
            'الدنمارك': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/den.png', color: '#DC052B' },
            'سويسرا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/sui.png', color: '#DC052B' },
            'السويد': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/swe.png', color: '#FFD700' },
            'بولندا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/pol.png', color: '#DC052B' },
            'أوكرانيا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/ukr.png', color: '#FFD700' },
            'النمسا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/aut.png', color: '#DC3545' },
            'تركيا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/tur.png', color: '#DC052B' },

            // المنتخبات الأخرى (لأغراض الشمولية)
            'البرازيل': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/bra.png', color: '#009F4D' },
            'الأرجنتين': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/arg.png', color: '#75AADB' },
            'الأوروغواي': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/uru.png', color: '#75AADB' },
            'الولايات المتحدة': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/usa.png', color: '#002654' },
            'اليابان': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/jpn.png', color: '#000080' },
            'كوريا الجنوبية': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/kor.png', color: '#DC052B' },
            'إيران': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/irn.png', color: '#DC052B' },
            'السنغال': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/sen.png', color: '#00843D' },
            'نيجيريا': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/nga.png', color: '#008C51' },
            'الكاميرون': { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/countries/500/cmr.png', color: '#008000' },

            // ===================================
            // ⚽ أندية الدوريات الأوروبية الكبرى
            // ===================================
            
            // الدوري الإنجليزي الممتاز
            "نوتينغهام": { url: 'https://resources.premierleague.com/premierleague/badges/50/t25.png', color: '#DC3545' },
            "برينتفورد": { url: 'https://resources.premierleague.com/premierleague/badges/50/t94.png', color: '#DC3545' },
            "أرسنال": { url: 'https://resources.premierleague.com/premierleague/badges/50/t3.png', color: '#EF0107' },
            "تشيلسي": { url: 'https://resources.premierleague.com/premierleague/badges/50/t8.png', color: '#034694' },
            "ليفربول": { url: 'https://resources.premierleague.com/premierleague/badges/50/t14.png', color: '#C8102E' },
            "مانشستر يونايتد": { url: 'https://resources.premierleague.com/premierleague/badges/50/t1.png', color: '#DC241F' },
            "مانشستر سيتي": { url: 'https://resources.premierleague.com/premierleague/badges/50/t43.png', color: '#6CABDD' },
            "توتنهام": { url: 'https://resources.premierleague.com/premierleague/badges/50/t6.png', color: '#FFFFFF' },
            "نيوكاسل": { url: 'https://resources.premierleague.com/premierleague/badges/50/t4.png', color: '#241F20' },
            "أستون فيلا": { url: 'https://resources.premierleague.com/premierleague/badges/50/t7.png', color: '#670E36' },
            "ويست هام": { url: 'https://resources.premierleague.com/premierleague/badges/50/t21.png', color: '#7C2C3G' },
            "آرسنال": { url: 'https://jdwel.com/image/teams/2999.png', color: '#DC052B' },
            "بريتون": { url: 'https://resources.premierleague.com/premierleague/badges/50/t36.png', color: '#0057B8' },
            "فولهام": { url: 'https://resources.premierleague.com/premierleague/badges/50/t54.png', color: '#000000' },
            "كريستال بالاس": { url: 'https://resources.premierleague.com/premierleague/badges/50/t31.png', color: '#1B458F' },
            "وولفرهامبتون": { url: 'https://resources.premierleague.com/premierleague/badges/50/t39.png', color: '#FDB913' },
            "إيفرتون": { url: 'https://resources.premierleague.com/premierleague/badges/50/t11.png', color: '#003399' },
            "بورنموث": { url: 'https://resources.premierleague.com/premierleague/badges/50/t91.png', color: '#DC052B' },
            "ليدز يونايتد": { url: 'https://resources.premierleague.com/premierleague/badges/50/t2.png', color: '#FFFFFF' },
            "ليستر سيتي": { url: 'https://resources.premierleague.com/premierleague/badges/50/t13.png', color: '#003090' },
         "وست هام": { url: 'https://jdwel.com/image/teams/5168.png', color: '#003090' },
         "توتنهام هوتسبير": { url: 'https://resources.premierleague.com/premierleague/badges/50/t6.png', color: '#DC052B' },
            "ساوثهامبتون": { url: 'https://resources.premierleague.com/premierleague/badges/50/t20.png', color: '#DC052B' },
            
            
            // الدوري الإسباني
            "ريال مدريد": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/86.png', color: '#FFFFFF' },
            "برشلونة": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/83.png', color: '#A50044' },
            "أتلتيكو مدريد": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/1068.png', color: '#C1272D' },
            "إشبيلية": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/243.png', color: '#DC052B' },
            "فيلارريال": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/367.png', color: '#F0CC00' },
            "ريال بيتيس": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/90.png', color: '#008447' },
            "ريال سوسيداد": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/96.png', color: '#0066AA' },
            "أتلتيك بيلباو": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/331.png', color: '#DC052B' },
            "فالنسيا": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/95.png', color: '#F8D600' },
            "خيتافي": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/244.png', color: '#000040' },
            "اوساسونا": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/97.png', color: '#DC052B' },
            "سلتا فيغو": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/463.png', color: '#0066AA' },
            "رايو فايكانو": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/536.png', color: '#DC052B' },
            "ايلتشى": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/445.png', color: '#008C49' },

            // الدوري الإيطالي
            "يوفنتوس": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/111.png', color: '#000000' },
            "إنتر ميلان": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/110.png', color: '#010E49' },
            "ميلان": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/103.png', color: '#FB090B' },
            "نابولي": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/114.png', color: '#0970C3' },
            "روما": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/104.png', color: '#8C1F2E' },
            "لاتسيو": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/112.png', color: '#0066AA' },
            "فيورنتينا": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/109.png', color: '#4E2A84' },
            "أتالانتا": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/102.png', color: '#000000' },
            "بولونيا": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/113.png', color: '#DC052B' },
            "تورينو": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/239.png', color: '#7B002C' },

            // الدوري الألماني
            "بايرن ميونخ": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/132.png', color: '#DC052B' },
            "بوروسيا دورتموند": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/124.png', color: '#FDE100' },
            "باير ليفركوزن": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/138.png', color: '#E60028' },
            "لايبزيغ": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/393.png', color: '#000040' },
            "يونيون برلين": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/125.png', color: '#DC052B' },
            "فولفسبورج": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/131.png', color: '#009933' },
            "آينتراخت فرانكفورت": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/182.png', color: '#000000' },
            "بوروسيا مونشنغلادباخ": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/127.png', color: '#000000' },

            // الدوري الفرنسي
            "باريس سان جيرمان": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/160.png', color: '#000040' },
            "مارسيليا": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/176.png', color: '#00338D' },
            "ليون": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/175.png', color: '#DC052B' },
            "موناكو": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/174.png', color: '#E30613' },
            "ليل": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/108.png', color: '#DC052B' },
            "نيس": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/181.png', color: '#DC052B' },
            "رين": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/179.png', color: '#DC052B' },
            "نانت": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/173.png', color: '#FFD700' },

            // 🇸🇦 الدوري السعودي
            "الهلال": { url: 'https://upload.wikimedia.org/wikipedia/ar/archive/1/12/20230512223726%21Al_Hilal_SFC_logo_2022.svg', color: '#004494' },
            "النصر": { url: 'https://upload.wikimedia.org/wikipedia/ar/thumb/a/ac/Al_Nassr_FC_Logo.svg/1513px-Al_Nassr_FC_Logo.svg.png', color: '#FFD700' },
            "الاتحاد": { url: 'https://upload.wikimedia.org/wikipedia/ar/thumb/e/e1/Ittihad_logo.svg/1759px-Ittihad_logo.svg.png', color: '#FF5200' },
            "الأهلي": { url: 'https://upload.wikimedia.org/wikipedia/ar/thumb/b/b2/Al-Ahli_Logo.svg/1511px-Al-Ahli_Logo.svg.png', color: '#006C3E' },
            "الشباب": { url: 'https://upload.wikimedia.org/wikipedia/ar/archive/1/1c/20231126084956%21Shabab-logo.png', color: '#000000' },
            "القادسية": { url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Al-Qadsiah_Logo.svg', color: '#FFD700' },
            "الاتفاق": { url: 'https://upload.wikimedia.org/wikipedia/ar/thumb/3/3b/%D8%B4%D8%B9%D8%A7%D8%B1_%D9%86%D8%A7%D8%AF%D9%8A_%D8%A7%D9%84%D8%A7%D8%AA%D9%81%D8%A7%D9%82_2022.svg/1200px-%D8%B4%D8%B9%D8%A7%D8%B1_%D9%86%D8%A7%D8%AF%D9%8A_%D8%A7%D9%84%D8%A7%D8%AA%D9%81%D8%A7%D9%82_2022.svg.png', color: '#E90000' },
            "التعاون": { url: 'https://upload.wikimedia.org/wikipedia/ar/c/c6/%D8%B4%D8%B9%D8%A7%D8%B1_%D9%86%D8%A7%D8%AF%D9%8A_%D8%A7%D9%84%D8%AA%D8%B9%D8%A7%D9%88%D9%86.svg', color: '#B59410' },

            // أندية دوري أبطال آسيا
            "الاتحاد السوري": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/9846.png', color: '#DC3545' },
            "باختاكور": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10304.png', color: '#FFD700' },
            "استقلال": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10308.png', color: '#0066AA' },
            "برسبوليس": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10307.png', color: '#DC052B' },
            "الهلال الأزرق": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10309.png', color: '#004494' },
            "كاوازاكي": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10310.png', color: '#0066AA' },
            "أوراوا": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10311.png', color: '#DC052B' },
            "غوانغجو": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10312.png', color: '#DC052B' },
            "شاندونغ": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10313.png', color: '#FFD700' },
            "جيونبوك": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10314.png', color: '#008C49' },
            "اولسان": { url: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/10315.png', color: '#004494' },
            
           'default': { 
            url: 'data:image/jpg;base64,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',
            color: '#42318F',
            size: 40 // يمكنك تغيير هذا الرقم كما تريد
        }
    };
}
            
            

    async initializeApp() {
        console.log('⚽ بدء تشغيل جدول المباريات...');
        this.setCurrentYear();
        await this.loadAllData();
        this.setupUserInterface();
        console.log('✅ تم تهيئة جدول المباريات بنجاح');
    }

    setCurrentYear() {
        const yearElement = document.getElementById('currentYear');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }

    async loadAllData() {
        console.log('📥 جاري تحميل بيانات المباريات...');
        this.showLoadingState();
        
        try {
            try {
                await this.loadDataFromFirebase();
                console.log('✅ تم تحميل البيانات من Firebase');
            } catch (firebaseError) {
                console.warn('⚠️ فشل تحميل Firebase:', firebaseError.message);
                try {
                    await this.loadDataFromLocalStorage();
                    console.log('✅ تم تحميل البيانات من localStorage');
                } catch (localStorageError) {
                    console.warn('⚠️ فشل تحميل localStorage:', localStorageStorageError.message);
                    this.loadDefaultData();
                    console.log('✅ تم تحميل البيانات الافتراضية');
                }
            }
        } catch (error) {
            console.error('❌ خطأ عام في تحميل البيانات:', error);
            this.showErrorMessage('حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.');
        }
    }

    // ============================================
    // 🔹 الجزء 2: دوال تحميل البيانات
    // ============================================

    async loadDataFromFirebase() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('🔥 جاري تحميل البيانات من Firebase...');
                
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase SDK غير محمل');
                }
                
                let db;
                if (window.firebaseApp && window.firebaseApp.getDB) {
                    db = window.firebaseApp.getDB();
                } else {
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
                        firebase.initializeApp(firebaseConfig);
                    }
                    db = firebase.firestore();
                }
                
                if (!db) throw new Error('قاعدة البيانات غير متاحة');
                
                // جلب جميع المباريات من Firebase
                let matchesSnapshot;
                try {
                    matchesSnapshot = await db.collection('matches').get();
                } catch (queryError) {
                    console.warn('⚠️ خطأ في استعلام المباريات:', queryError);
                    matchesSnapshot = await db.collection('matches').get();
                }
                
                if (matchesSnapshot.empty) {
                    console.log('ℹ️ لا توجد مباريات في قاعدة البيانات');
                    this.matchesList = [];
                } else {
                    this.matchesList = matchesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    console.log(`✅ تم تحميل ${this.matchesList.length} مباراة`);
                }
                
                try {
                    const channelsSnapshot = await db.collection('channels').get();
                    if (channelsSnapshot.empty) {
                        console.log('ℹ️ لا توجد قنوات في قاعدة البيانات');
                        this.channelsList = [];
                    } else {
                        this.channelsList = channelsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        console.log(`✅ تم تحميل ${this.channelsList.length} قناة`);
                    }
                } catch (channelError) {
                    console.warn('⚠️ خطأ في تحميل القنوات:', channelError);
                    this.channelsList = [];
                }
                
                this.saveDataToLocalStorage();
                this.isFirebaseAvailable = true;
                this.renderMatches();
                resolve(true);
                
            } catch (error) {
                console.error('❌ فشل تحميل Firebase:', error);
                this.isFirebaseAvailable = false;
                reject(error);
            }
        });
    }

    async loadDataFromLocalStorage() {
        return new Promise((resolve, reject) => {
            try {
                console.log('💾 جاري تحميل البيانات من التخزين المحلي...');
                
                const savedMatches = localStorage.getItem('bein_matches');
                if (!savedMatches) {
                    throw new Error('لا توجد بيانات محلية للمباريات');
                }
                
                this.matchesList = JSON.parse(savedMatches);
                console.log(`✅ تم تحميل ${this.matchesList.length} مباراة من localStorage`);
                
                const savedChannels = localStorage.getItem('bein_channels');
                if (savedChannels) {
                    this.channelsList = JSON.parse(savedChannels);
                    console.log(`✅ تم تحميل ${this.channelsList.length} قناة من localStorage`);
                } else {
                    this.channelsList = [];
                }
                
                this.renderMatches();
                resolve(true);
                
            } catch (error) {
                console.error('❌ فشل تحميل البيانات المحلية:', error);
                reject(error);
            }
        });
    }

    loadDefaultData() {
        console.log('📋 استخدام البيانات الافتراضية...');
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        this.matchesList = [
            {
                id: 'match1',
                team1: 'النادي الأهلي',
                team2: 'الهلال',
                competition: 'الدوري السعودي',
                matchDate: today.toISOString().split('T')[0],
                matchTime: '20:00',
                channelId: 'channel1',
                status: 'upcoming'
            },
            {
                id: 'match2',
                team1: 'برشلونة',
                team2: 'ريال مدريد',
                competition: 'الدوري الإسباني',
                matchDate: today.toISOString().split('T')[0],
                matchTime: '22:00',
                channelId: 'channel2',
                status: 'live'
            },
            {
                id: 'match3',
                team1: 'مانشستر يونايتد',
                team2: 'ليفربول',
                competition: 'الدوري الإنجليزي',
                matchDate: tomorrow.toISOString().split('T')[0],
                matchTime: '18:00',
                channelId: 'channel1',
                status: 'upcoming'
            },
            {
                id: 'match4',
                team1: 'يوفنتوس',
                team2: 'ميلان',
                competition: 'الدوري الإيطالي',
                matchDate: yesterday.toISOString().split('T')[0],
                matchTime: '20:30',
                channelId: 'channel2',
                status: 'finished'
            }
        ];
        
        this.channelsList = [
            {
                id: 'channel1',
                name: 'بي إن سبورت 1',
                image: 'https://via.placeholder.com/200x100/2F2562/FFFFFF?text=BEIN+1',
                url: 'https://www.example.com/channel1',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player'
            },
            {
                id: 'channel2',
                name: 'بي إن سبورت 2',
                image: 'https://via.placeholder.com/200x100/2F2562/FFFFFF?text=BEIN+2',
                url: 'https://www.example.com/channel2',
                appUrl: 'https://play.google.com/store/apps/details?id=com.xpola.player'
            }
        ];
        
        this.saveDataToLocalStorage();
        this.renderMatches();
    }

    saveDataToLocalStorage() {
        try {
            localStorage.setItem('bein_matches', JSON.stringify(this.matchesList));
            localStorage.setItem('bein_channels', JSON.stringify(this.channelsList));
            console.log('💾 تم حفظ البيانات في التخزين المحلي');
        } catch (error) {
            console.error('❌ خطأ في حفظ البيانات محلياً:', error);
        }
    }

    // ============================================
    // 🔹 الجزء 3: دوال عرض الواجهة
    // ============================================

    showLoadingState() {
        const container = document.getElementById('matchesContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <div class="spinner" style="width: 50px; height: 50px; border: 5px solid #654FD4; border-top: 5px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <style>
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    </style>
                    <p style="color: #fff; font-size: 18px;">جاري تحميل المباريات...</p>
                    <small style="color: #B8B8B8;">يرجى الانتظار</small>
                </div>
            `;
        }
    }

    showErrorMessage(message) {
        const container = document.getElementById('matchesContainer');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 20px;">
                    <i class="uil uil-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i>
                    <p style="color: #FF5200; font-size: 16px; margin-top: 20px;">${message}</p>
                    <div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px; margin: 20px auto;">
                        <button onclick="window.matchApp.retryLoadData()" style="background: linear-gradient(135deg, #42318F, #654FD4); color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="uil uil-redo"></i> إعادة المحاولة
                        </button>
                        <button onclick="window.matchApp.useLocalData()" style="background: rgba(66, 49, 143, 0.3); color: white; border: 1px solid #654FD4; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="uil uil-database"></i> استخدام البيانات المحلية
                        </button>
                    </div>
                </div>
            `;
        }
    }

    renderMatches() {
        const container = document.getElementById('matchesContainer');
        if (!container) {
            console.error('❌ حاوية المباريات غير موجودة');
            return;
        }

        let filteredMatches = this.filterMatchesByDate(this.currentFilter);
        
        // 🆕 التعديل: فرز المباريات - المباشر أولاً، ثم القادمة، ثم المنتهية
        filteredMatches.sort((a, b) => {
            // تحديد حالة كل مباراة
            const statusA = this.determineMatchStatus(a);
            const statusB = this.determineMatchStatus(b);
            
            // ترتيب الأولوية: مباشر > قادم > منتهي
            const priority = { 'live': 1, 'upcoming': 2, 'finished': 3 };
            
            if (priority[statusA] !== priority[statusB]) {
                return priority[statusA] - priority[statusB];
            }
            
            // إذا كانت نفس الحالة، فرز حسب التاريخ والوقت
            const dateA = new Date(`${a.matchDate}T${a.matchTime}`);
            const dateB = new Date(`${b.matchDate}T${b.matchTime}`);
            
            return dateA - dateB;
        });
        
        if (filteredMatches.length === 0) {
            let message = '';
            switch(this.currentFilter) {
                case 'today': message = 'لا توجد مباريات اليوم'; break;
                case 'tomorrow': message = 'لا توجد مباريات غداً أو أمس'; break;
                case 'week': message = 'لا توجد مباريات هذا الأسبوع'; break;
                default: message = 'لا توجد مباريات متاحة';
            }
            
            container.innerHTML = `
                <div class="no-matches">
                    <i class="uil uil-calendar-slash" style="font-size: 60px; color: #6c757d; margin-bottom: 20px;"></i>
                    <h4 style="color: #fff; margin-bottom: 10px;">${message}</h4>
                    <p style="color: #B8B8B8;">سيتم إضافة المباريات قريباً</p>
                </div>
            `;
            return;
        }

        console.log(`🎯 عرض ${filteredMatches.length} مباراة`);
        
        container.innerHTML = `
            <div class="matches-grid">
                ${filteredMatches.map(match => this.createMatchCard(match)).join('')}
            </div>
        `;

        this.addMatchClickListeners();
        console.log('✅ تم عرض المباريات بنجاح');
    }

    // 🆕 دالة مساعدة لتحديد حالة المباراة
    determineMatchStatus(match) {
        const now = new Date();
        const matchDateTime = new Date(`${match.matchDate}T${match.matchTime}`);
        const diffInMinutes = (matchDateTime.getTime() - now.getTime()) / (1000 * 60);
        const matchDurationMinutes = 120;
        
        if (match.status === 'live' || match.isLive || (diffInMinutes <= 0 && diffInMinutes > -matchDurationMinutes)) {
            return 'live';
        } else if (diffInMinutes < -matchDurationMinutes) {
            return 'finished';
        } else {
            return 'upcoming';
        }
    }

    createMatchCard(match) {
        const channel = this.channelsList.find(c => c.id === match.channelId);
        
        // تحديد حالة المباراة
        const status = this.determineMatchStatus(match);
        let statusText, statusIcon;
        
        switch(status) {
            case 'live':
                statusText = 'مباشر';
                statusIcon = 'uil uil-play-circle';
                break;
            case 'finished':
                statusText = 'انتهت';
                statusIcon = 'uil uil-check-circle';
                break;
            default:
                statusText = 'قريباً';
                statusIcon = 'uil uil-clock';
                break;
        }
        
        // جلب معلومات شعارات الفرق
        const team1Info = this.teamLogos[match.team1] || this.teamLogos.default;
        const team2Info = this.teamLogos[match.team2] || this.teamLogos.default;
        
        const formattedDate = this.formatMatchDate(match.matchDate);
        const formattedTime = this.formatTimeEnglish(match.matchTime);
        
        return `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-teams">
                    <div class="teams-container">
                        <div class="team">
                            <div class="team-logo-container">
                                <img src="${team1Info.url}" alt="${match.team1} Logo" style="width: ${team1Info.size || 50}px; height: ${team1Info.size || 50}px; border-radius: 50%; border: 0px solid ${team1Info.color};">
                            </div>
                            <div class="team-name glow">${match.team1}</div>
                        </div>
                        
                        <div class="vs-container">
                            <div class="vs">VS</div>
                            <div class="match-time-small">${formattedTime}</div>
                        </div>
                        
                        <div class="team">
                            <div class="team-logo-container">
                                <img src="${team2Info.url}" alt="${match.team2} Logo" style="width: ${team2Info.size || 50}px; height: ${team2Info.size || 50}px; border-radius: 50%; border: 0px solid ${team2Info.color};">
                            </div>
                            <div class="team-name glow">${match.team2}</div>
                        </div>
                    </div>
                </div>
                
                <div class="match-status-container">
                    <div class="match-status ${status}">
                        <i class="${statusIcon}"></i>
                        ${statusText}
                    </div>
                </div>
                <div class="watch-btn-container">
                    <button class="watch-btn" onclick="window.matchApp.openMatch('${match.id}'); event.stopPropagation()">
                        <i class="uil uil-play-circle"></i> مشاهدة المباراة
                    </button>
                </div>
                
                <div class="match-info-horizontal">
                    <div class="info-item channel" title="${channel ? channel.name : 'قناة غير محددة'}">
                        <div class="info-content">
                            <i class="uil uil-tv-retro info-icon"></i>
                            <div class="info-text">
                                <div class="info-label">القناة</div>
                                <div class="info-value">${channel ? channel.name : 'غير محدد'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-item date" title="تاريخ المباراة">
                        <div class="info-content">
                            <i class="uil uil-calendar-alt info-icon"></i>
                            <div class="info-text">
                                <div class="info-label">التاريخ</div>
                                <div class="info-value">${formattedDate}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-item league" title="${match.competition || 'بطولة'}">
                        <div class="info-content">
                            <i class="uil uil-trophy info-icon" style="color: #FFD700; font-size: 25px; margin-left: 10px;"></i>
                            <div class="info-text">
                                <div class="info-label">البطولة</div>
                                <div class="info-value">${match.competition || 'غير محدد'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatMatchDate(dateString) {
        if (!dateString) return '--/--';
        try {
            const date = new Date(dateString);
            const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
            const dayName = days[date.getDay()];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            // تنسيق مختصر: الاثنين 12/15
            return `${dayName} ${month}/${day}`;
        } catch (error) {
            return '--/--';
        }
    }

    formatTimeEnglish(timeString) {
        if (!timeString) return '--:--';
        try {
            const [hours, minutes] = timeString.split(':');
            
            const arabicToEnglish = {
                '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
                '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
            };
            
            let hourNum = hours;
            let minuteNum = minutes || '00';
            
            if (/\u0660-\u0669/.test(hourNum)) {
                hourNum = hourNum.split('').map(char => arabicToEnglish[char] || char).join('');
            }
            if (/\u0660-\u0669/.test(minuteNum)) {
                minuteNum = minuteNum.split('').map(char => arabicToEnglish[char] || char).join('');
            }
            
            hourNum = parseInt(hourNum, 10);
            minuteNum = parseInt(minuteNum, 10);
            
            return `${hourNum}:${minuteNum < 10 ? '0' + minuteNum : minuteNum}`;
        } catch (error) {
            return timeString;
        }
    }

    // ============================================
    // 🔹 الجزء 4: دوال الفلترة
    // ============================================

    filterMatchesByDate(filter) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        return this.matchesList.filter(match => {
            if (!match.matchDate) return false;
            const matchDate = new Date(match.matchDate);
            matchDate.setHours(0, 0, 0, 0);
            
            switch(filter) {
                case 'today': 
                    return matchDate.getTime() === today.getTime();
                case 'tomorrow': 
                    // 🆕 التعديل: عرض مباريات الغد والأمس معاً
                    return matchDate.getTime() === tomorrow.getTime() || 
                           matchDate.getTime() === yesterday.getTime();
                case 'week': 
                    return matchDate >= lastWeek && matchDate <= nextWeek;
                case 'all': 
                    return true;
                default: 
                    return matchDate.getTime() === today.getTime();
            }
        });
    }

    filterMatches(filter) {
        this.currentFilter = filter;
        document.querySelectorAll('.date-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`.date-btn[onclick*="filterMatches('${filter}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        this.renderMatches();
    }

    // ============================================
    // 🔹 الجزء 5: دوال إدارة المباريات
    // ============================================

    openMatch(matchId) {
        const match = this.matchesList.find(m => m.id === matchId);
        if (!match) return;
        
        console.log(`▶️ فتح المباراة: ${match.team1} vs ${match.team2}`);
        
        if (!match.channelId) {
            this.showErrorMessage('لم يتم تحديد قناة لهذه المباراة');
            return;
        }
        
        const channel = this.channelsList.find(c => c.id === match.channelId);
        if (!channel) {
            this.showErrorMessage('القناة الناقلة غير متاحة');
            return;
        }
        
        // التحقق من إعداد عدم عرض النافذة
        if (this.dontShowAgain) {
            // إذا اختار المستخدم عدم المشاهدة مرة أخرى، فتح القناة مباشرة
            this.openChannel(channel);
        } else {
            // عرض نافذة التأكيد
            this.showInstallModal(channel);
        }
    }

    // 🔹 الدالة: showInstallModal (تم تحديث لون الخلفية والحدود)
    showInstallModal(channel) {
        // إزالة أي نافذة موجودة مسبقاً
        const existingModal = document.getElementById('installModal');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }
        
        // إنشاء نافذة جديدة مع خيار عدم المشاهدة مرة أخرى
        const modalHTML = `
            <div id="installModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: linear-gradient(#16213e, #1a1a2e); border-radius: 15px; padding: 30px; max-width: 450px; width: 90%; border: 2px solid #654FD4; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                    <i class="uil uil-mobile-android-alt" style="font-size: 50px; color: #654FD4; margin-bottom: 20px;"></i>
                    <h3 style="color: white; margin-bottom: 10px;">مشاهدة المباراة</h3>
                    <p style="color: #B8B8B8; margin-bottom: 25px;">اختر الطريقة التي تريد بها مشاهدة المباراة</p>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button id="installAppBtn" style="background: linear-gradient(135deg, #42318F, #654FD4); color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="uil uil-download-alt"></i> تثبيت التطبيق ومشاهدة
                        </button>
                        <button id="openChannelBtn" style="background: linear-gradient(135deg, #42318F, #654FD4); color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="uil uil-play-circle"></i> مشاهدة مباشرة
                        </button>
                        <button id="dontShowAgainBtn" style="background: rgba(184, 184, 184, 0.2); color: #B8B8B8; border: 1px solid #B8B8B8; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="uil uil-ban"></i> عدم المشاهدة مرة أخرى
                        </button>
                        <button id="cancelModalBtn" style="background: transparent; color: #FF5200; border: 1px solid #FF5200; padding: 10px 20px; border-radius: 25px; cursor: pointer; margin-top: 10px;">
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv);
        
        // إضافة مستمعي الأحداث
        document.getElementById('installAppBtn').addEventListener('click', () => {
            this.installApp(channel);
            document.body.removeChild(modalDiv);
        });
        
        document.getElementById('openChannelBtn').addEventListener('click', () => {
            this.openChannel(channel);
            document.body.removeChild(modalDiv);
        });
        
        document.getElementById('dontShowAgainBtn').addEventListener('click', () => {
            this.setDontShowAgain(channel);
            document.body.removeChild(modalDiv);
        });
        
        document.getElementById('cancelModalBtn').addEventListener('click', () => {
            document.body.removeChild(modalDiv);
        });
    }

    // 🔹 الدالة: setDontShowAgain
    setDontShowAgain(channel) {
        console.log('🚫 تم تعيين عدم عرض النافذة مرة أخرى');
        
        // حفظ التفضيل في localStorage
        this.dontShowAgain = true;
        localStorage.setItem('dont_show_modal', 'true');
        
        // عرض رسالة تأكيد
        this.showConfirmationMessage('لن تظهر هذه النافذة مرة أخرى. يمكنك تغيير هذا الإعداد من إعدادات التطبيق.');
        
        // فتح القناة مباشرة
        this.openChannel(channel);
    }

    // 🔹 الدالة: showConfirmationMessage
    showConfirmationMessage(message) {
        // إزالة أي رسالة موجودة مسبقاً
        const existingMsg = document.getElementById('confirmationMessage');
        if (existingMsg) {
            document.body.removeChild(existingMsg);
        }
        
        const messageHTML = `
            <div id="confirmationMessage" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 15px 25px; border-radius: 25px; z-index: 10001; border: 1px solid #654FD4;">
                <i class="uil uil-check-circle" style="color: #4CAF50; margin-right: 10px;"></i>
                ${message}
            </div>
        `;
        
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = messageHTML;
        document.body.appendChild(messageDiv);
        
        // إزالة الرسالة بعد 3 ثواني
        setTimeout(() => {
            if (document.body.contains(messageDiv)) {
                document.body.removeChild(messageDiv);
            }
        }, 3000);
    }

    // 🔹 الدالة: installApp
    installApp(channel) {
        console.log('📱 تثبيت التطبيق...');
        
        // فتح رابط التحميل في نافذة جديدة
        const appUrl = channel.appUrl || 'https://play.google.com/store/apps/details?id=com.xpola.player';
        window.open(appUrl, '_blank');
        
        // تعيين التطبيق كمثبت
        this.hasAppInstalled = true;
        localStorage.setItem('app_installed', 'true');
        
        // فتح القناة بعد 3 ثواني
        setTimeout(() => {
            this.openChannel(channel);
        }, 3000);
    }

    // 🔹 الدالة: openChannel
    openChannel(channel) {
        console.log(`📺 فتح القناة: ${channel.name}`);
        
        if (!channel.url || channel.url === '#') {
            // عرض البث في iframe إذا كان الرابط غير متوفر
            this.showStreamInIframe(channel);
            return;
        }
        
        // فتح رابط البث في نافذة جديدة
        window.open(channel.url, '_blank');
        this.logMatchView(channel);
    }

    // 🔹 الدالة: showStreamInIframe
    showStreamInIframe(channel) {
        // إزالة أي نافذة موجودة مسبقاً
        const existingStream = document.getElementById('streamModal');
        if (existingStream) {
            document.body.removeChild(existingStream);
        }
        
        const streamHTML = `
            <div id="streamModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; align-items: center; justify-content: center;">
                <div style="width: 95%; max-width: 800px; background: #1a1a2e; border-radius: 15px; overflow: hidden; border: 2px solid #654FD4;">
                    <div style="padding: 15px; background: #16213e; display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="color: white; margin: 0;">${channel.name}</h4>
                        <button id="closeStream" style="background: #FF5200; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-weight: bold;">×</button>
                    </div>
                    <div style="padding: 20px; text-align: center;">
                        <p style="color: #B8B8B8;">رابط البث غير متوفر حالياً</p>
                        <p style="color: #FF5200; margin-top: 20px;">يرجى تثبيت التطبيق لمشاهدة المباراة</p>
                        <button onclick="window.open('https://play.google.com/store/apps/details?id=com.xpola.player', '_blank')" style="background: linear-gradient(135deg, #FF5200, #FF0005); color: white; border: none; padding: 10px 20px; border-radius: 25px; cursor: pointer; font-weight: bold; margin-top: 20px;">
                            <i class="uil uil-download-alt"></i> تثبيت التطبيق
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const streamDiv = document.createElement('div');
        streamDiv.innerHTML = streamHTML;
        document.body.appendChild(streamDiv);
        
        // إضافة مستمع حدث لإغلاق النافذة
        document.getElementById('closeStream').addEventListener('click', () => {
            document.body.removeChild(streamDiv);
        });
    }

    // ============================================
    // 🔹 الجزء 6: دوال مساعدة
    // ============================================

    setupUserInterface() {
        window.filterMatches = (filter) => this.filterMatches(filter);
        
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.history.back();
            });
        }
        
        // إضافة زر لإعادة تفعيل النافذة المنبثقة (للإعدادات)
        this.addSettingsButton();
    }

    // 🔹 الدالة: addSettingsButton
    addSettingsButton() {
        // البحث عن شريط التنقل أو مكان مناسب لوضع الزر
        const nav = document.querySelector('nav') || document.querySelector('.navbar') || document.querySelector('.header');
        if (nav) {
            const settingsBtn = document.createElement('button');
            settingsBtn.innerHTML = '<i class="uil uil-setting"></i>';
            settingsBtn.style.background = 'transparent';
            settingsBtn.style.color = 'white';
            settingsBtn.style.border = '1px solid #654FD4';
            settingsBtn.style.borderRadius = '50%';
            settingsBtn.style.width = '40px';
            settingsBtn.style.height = '40px';
            settingsBtn.style.cursor = 'pointer';
            settingsBtn.style.marginLeft = '10px';
            settingsBtn.title = 'إعدادات العرض';
            
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
            
            nav.appendChild(settingsBtn);
        }
    }

    // 🔹 الدالة: showSettingsModal
    showSettingsModal() {
        const modalHTML = `
            <div id="settingsModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10002; display: flex; align-items: center; justify-content: center;">
                <div style="background: linear-gradient(#16213e, #1a1a2e); border-radius: 15px; padding: 30px; max-width: 400px; width: 90%; border: 2px solid #654FD4; text-align: center;">
                    <h3 style="color: white; margin-bottom: 20px;"><i class="uil uil-setting"></i> إعدادات العرض</h3>
                    
                    <div style="text-align: right; margin-bottom: 20px;">
                        <label style="color: #B8B8B8; display: flex; align-items: center; justify-content: space-between; padding: 10px; background: rgba(101, 79, 212, 0.1); border-radius: 8px;">
                            <span>عرض نافذة المشاهدة</span>
                            <input type="checkbox" id="showModalToggle" ${this.dontShowAgain ? '' : 'checked'} 
                                   style="transform: scale(1.2);">
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="saveSettings" style="background: linear-gradient(135deg, #42318F, #654FD4); color: white; border: none; padding: 12px 25px; border-radius: 25px; cursor: pointer; font-weight: bold;">
                            حفظ
                        </button>
                        <button id="closeSettings" style="background: transparent; color: #B8B8B8; border: 1px solid #B8B8B8; padding: 12px 25px; border-radius: 25px; cursor: pointer;">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv);
        
        // إضافة مستمعي الأحداث
        document.getElementById('saveSettings').addEventListener('click', () => {
            const showModal = document.getElementById('showModalToggle').checked;
            this.dontShowAgain = !showModal;
            localStorage.setItem('dont_show_modal', this.dontShowAgain ? 'true' : 'false');
            
            // عرض رسالة تأكيد
            this.showConfirmationMessage(
                showModal ? 
                'تم تفعيل عرض نافذة المشاهدة' : 
                'تم إيقاف عرض نافذة المشاهدة'
            );
            
            document.body.removeChild(modalDiv);
        });
        
        document.getElementById('closeSettings').addEventListener('click', () => {
            document.body.removeChild(modalDiv);
        });
    }

    addMatchClickListeners() {
        const matchCards = document.querySelectorAll('.match-card');
        matchCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.watch-btn')) {
                    const matchId = card.getAttribute('data-match-id');
                    this.openMatch(matchId);
                }
            });
        });
    }

    logMatchView(channel) {
        try {
            console.log(`📊 تسجيل مشاهدة المباراة على القناة: ${channel.name}`);
        } catch (error) {
            console.warn('⚠️ فشل تسجيل المشاهدة:', error);
        }
    }

    retryLoadData() {
        console.log('🔄 إعادة محاولة تحميل بيانات المباريات...');
        this.loadAllData();
    }

    useLocalData() {
        this.loadDataFromLocalStorage();
    }
}

// ============================================
// 🔹 تهيئة التطبيق
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📂 تهيئة صفحة المباريات...');
    window.matchApp = new MatchApp();
});

// 🔹 دوال مساعدة متاحة عالمياً
window.reloadMatchesData = function() {
    if (window.matchApp) {
        window.matchApp.retryLoadData();
    }
};

window.updateMatches = function(matches) {
    if (window.matchApp) {
        window.matchApp.matchesList = matches;
        window.matchApp.saveDataToLocalStorage();
        window.matchApp.renderMatches();
    }
};

window.updateChannels = function(channels) {
    if (window.matchApp) {
        window.matchApp.channelsList = channels;
        window.matchApp.saveDataToLocalStorage();
        window.matchApp.renderMatches();
    }
};

// 🔹 دالة لإعادة تفعيل النافذة المنبثقة
window.resetModalSettings = function() {
    localStorage.removeItem('dont_show_modal');
    if (window.matchApp) {
        window.matchApp.dontShowAgain = false;
        alert('تم إعادة تفعيل نافذة المشاهدة');
    }
};

console.log("✅ تم تحميل matches.js بنسخته النهائية مع التحديثات الزمنية والترتيب");