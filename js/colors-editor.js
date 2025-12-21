// js/colors-editor.js
class ColorsEditor {
    constructor() {
        this.colorVariables = {
            '--primary-color': '#3545FF',
            '--secondary-color': '#FF5200',
            '--dark-bg': '#151825',
            '--darker-bg': '#0d111c',
            '--card-bg': '#2F2562',
            '--text-light': '#F0F0F0',
            '--success-color': '#80FF00',
            '--danger-color': '#FF0005',
            '--accent-glow': '#5d72d6',
            '--accent-color-match': '#5d72d6',
            '--text-secondary': '#a8b1e1'
        };
        
        this.presets = [
            {
                id: 'default',
                name: 'المظهر الافتراضي',
                description: 'المظهر الأساسي للتطبيق',
                colors: this.getCurrentColors()
            },
            {
                id: 'dark-blue',
                name: 'أزرق داكن',
                description: 'مظهر أزرق داكن أنيق',
                colors: {
                    '--primary-color': '#2B6CB0',
                    '--secondary-color': '#4299E1',
                    '--dark-bg': '#1A202C',
                    '--darker-bg': '#171923',
                    '--card-bg': '#2D3748',
                    '--text-light': '#E2E8F0',
                    '--success-color': '#48BB78',
                    '--danger-color': '#F56565',
                    '--accent-glow': '#4299E1',
                    '--accent-color-match': '#4299E1',
                    '--text-secondary': '#A0AEC0'
                }
            },
            {
                id: 'purple-dark',
                name: 'بنفسجي داكن',
                description: 'مظهر بنفسجي جذاب',
                colors: {
                    '--primary-color': '#9F7AEA',
                    '--secondary-color': '#D6BCFA',
                    '--dark-bg': '#322659',
                    '--darker-bg': '#282144',
                    '--card-bg': '#44337A',
                    '--text-light': '#FAF5FF',
                    '--success-color': '#68D391',
                    '--danger-color': '#FC8181',
                    '--accent-glow': '#9F7AEA',
                    '--accent-color-match': '#9F7AEA',
                    '--text-secondary': '#D6BCFA'
                }
            },
            {
                id: 'green-dark',
                name: 'أخضر داكن',
                description: 'مظهر أخضر مريح للعين',
                colors: {
                    '--primary-color': '#38A169',
                    '--secondary-color': '#68D391',
                    '--dark-bg': '#1C4532',
                    '--darker-bg': '#153424',
                    '--card-bg': '#276749',
                    '--text-light': '#F0FFF4',
                    '--success-color': '#9AE6B4',
                    '--danger-color': '#FC8181',
                    '--accent-glow': '#38A169',
                    '--accent-color-match': '#38A169',
                    '--text-secondary': '#C6F6D5'
                }
            }
        ];
        
        this.init();
    }
    
    init() {
        console.log('🎨 تهيئة محرر الألوان...');
        
        // تعيين سنة حقوق الطبع
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // تحميل الألوان المحفوظة
        this.loadSavedColors();
        
        // إعداد معالجات الأحداث
        this.setupEventListeners();
        
        // تحميل المظاهر الجاهزة
        this.loadPresets();
        
        // تحديث معاينات الألوان
        this.updateColorPreviews();
        
        console.log('✅ محرر الألوان جاهز للاستخدام');
    }
    
    setupEventListeners() {
        // معالجات أزرار التحكم بالألوان
        document.getElementById('applyColors').addEventListener('click', () => this.applyColors());
        document.getElementById('resetColors').addEventListener('click', () => this.resetColors());
        document.getElementById('savePreset').addEventListener('click', () => this.showSavePresetModal());
        document.getElementById('confirmSave').addEventListener('click', () => this.saveNewPreset());
        document.getElementById('cancelSave').addEventListener('click', () => this.hideSavePresetModal());
        
        // معالجات مدخلات الألوان
        const colorInputs = [
            'primaryColor', 'secondaryColor', 'successColor', 'dangerColor',
            'darkBg', 'darkerBg', 'cardBg', 'textLight', 'textSecondary', 'accentGlow'
        ];
        
        colorInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', (e) => this.onColorChange(id, e.target.value));
            }
        });
        
        // إغلاق نافذة الحفظ بالنقر خارجها
        document.getElementById('savePresetModal').addEventListener('click', (e) => {
            if (e.target.id === 'savePresetModal') {
                this.hideSavePresetModal();
            }
        });
    }
    
    getCurrentColors() {
        const root = document.documentElement;
        const colors = {};
        
        Object.keys(this.colorVariables).forEach(variable => {
            const value = getComputedStyle(root).getPropertyValue(variable).trim();
            colors[variable] = value;
        });
        
        return colors;
    }
    
    loadSavedColors() {
        const savedColors = localStorage.getItem('userColors');
        
        if (savedColors) {
            try {
                const colors = JSON.parse(savedColors);
                Object.keys(colors).forEach(variable => {
                    if (this.colorVariables.hasOwnProperty(variable)) {
                        this.colorVariables[variable] = colors[variable];
                        
                        // تحديث مدخلات الألوان
                        const inputId = this.getInputIdFromVariable(variable);
                        const input = document.getElementById(inputId);
                        if (input) {
                            let colorValue = colors[variable];
                            
                            // تحويل rgba إلى hex إذا لزم الأمر
                            if (colorValue.startsWith('rgba')) {
                                colorValue = this.rgbaToHex(colorValue);
                            }
                            
                            if (colorValue.startsWith('#')) {
                                input.value = colorValue;
                            }
                        }
                    }
                });
                
                console.log('🎨 تم تحميل الألوان المحفوظة');
            } catch (error) {
                console.error('❌ خطأ في تحميل الألوان المحفوظة:', error);
            }
        }
    }
    
    getInputIdFromVariable(variable) {
        const mapping = {
            '--primary-color': 'primaryColor',
            '--secondary-color': 'secondaryColor',
            '--success-color': 'successColor',
            '--danger-color': 'dangerColor',
            '--dark-bg': 'darkBg',
            '--darker-bg': 'darkerBg',
            '--card-bg': 'cardBg',
            '--text-light': 'textLight',
            '--text-secondary': 'textSecondary',
            '--accent-glow': 'accentGlow'
        };
        
        return mapping[variable] || variable.replace('--', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }
    
    rgbaToHex(rgba) {
        const parts = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
        
        if (!parts) return '#000000';
        
        const r = parseInt(parts[1]).toString(16).padStart(2, '0');
        const g = parseInt(parts[2]).toString(16).padStart(2, '0');
        const b = parseInt(parts[3]).toString(16).padStart(2, '0');
        
        return `#${r}${g}${b}`;
    }
    
    onColorChange(inputId, colorValue) {
        const variable = this.getVariableFromInputId(inputId);
        this.colorVariables[variable] = colorValue;
        
        // تحديث القيمة المعروضة
        const valueElement = document.getElementById(`${inputId}Value`);
        if (valueElement) {
            valueElement.textContent = colorValue;
        }
        
        // تحديث المعاينة
        const previewElement = document.getElementById(`${inputId}Preview`);
        if (previewElement) {
            previewElement.style.backgroundColor = colorValue;
            
            // تغيير لون النص حسب سطوع الخلفية
            const brightness = this.getColorBrightness(colorValue);
            previewElement.style.color = brightness > 128 ? '#000' : '#FFF';
        }
    }
    
    getVariableFromInputId(inputId) {
        const mapping = {
            'primaryColor': '--primary-color',
            'secondaryColor': '--secondary-color',
            'successColor': '--success-color',
            'dangerColor': '--danger-color',
            'darkBg': '--dark-bg',
            'darkerBg': '--darker-bg',
            'cardBg': '--card-bg',
            'textLight': '--text-light',
            'textSecondary': '--text-secondary',
            'accentGlow': '--accent-glow'
        };
        
        return mapping[inputId] || `--${inputId.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    }
    
    getColorBrightness(hexColor) {
        // تحويل hex إلى RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        // حساب السطوع باستخدام صيغة NTSC
        return (r * 299 + g * 587 + b * 114) / 1000;
    }
    
    applyColors() {
        const root = document.documentElement;
        
        Object.keys(this.colorVariables).forEach(variable => {
            const colorValue = this.colorVariables[variable];
            root.style.setProperty(variable, colorValue);
        });
        
        // حفظ الألوان في localStorage
        this.saveColors();
        
        this.showAlert('تم تطبيق الألوان الجديدة بنجاح!', 'success');
        
        console.log('🎨 تم تطبيق الألوان الجديدة');
    }
    
    resetColors() {
        if (confirm('هل أنت متأكد من إعادة تعيين الألوان إلى القيم الافتراضية؟')) {
            // إعادة تعيين المتغيرات إلى القيم الافتراضية
            this.colorVariables = {
                '--primary-color': '#3545FF',
                '--secondary-color': '#FF5200',
                '--dark-bg': '#151825',
                '--darker-bg': '#0d111c',
                '--card-bg': '#2F2562',
                '--text-light': '#F0F0F0',
                '--success-color': '#80FF00',
                '--danger-color': '#FF0005',
                '--accent-glow': '#5d72d6',
                '--accent-color-match': '#5d72d6',
                '--text-secondary': '#a8b1e1'
            };
            
            // تحديث مدخلات الألوان
            Object.keys(this.colorVariables).forEach(variable => {
                const inputId = this.getInputIdFromVariable(variable);
                const input = document.getElementById(inputId);
                if (input) {
                    input.value = this.colorVariables[variable];
                }
                
                // تحديث القيم المعروضة
                const valueElement = document.getElementById(`${inputId}Value`);
                if (valueElement) {
                    valueElement.textContent = this.colorVariables[variable];
                }
            });
            
            // تحديث المعاينات
            this.updateColorPreviews();
            
            // تطبيق الألوان
            this.applyColors();
            
            this.showAlert('تم إعادة تعيين الألوان إلى القيم الافتراضية', 'info');
        }
    }
    
    updateColorPreviews() {
        Object.keys(this.colorVariables).forEach(variable => {
            const inputId = this.getInputIdFromVariable(variable);
            const previewElement = document.getElementById(`${inputId}Preview`);
            const colorValue = this.colorVariables[variable];
            
            if (previewElement) {
                previewElement.style.backgroundColor = colorValue;
                
                // تغيير لون النص حسب سطوع الخلفية
                const brightness = this.getColorBrightness(colorValue);
                previewElement.style.color = brightness > 128 ? '#000' : '#FFF';
                previewElement.textContent = this.getColorName(variable);
            }
        });
    }
    
    getColorName(variable) {
        const names = {
            '--primary-color': 'Primary Color',
            '--secondary-color': 'Secondary Color',
            '--dark-bg': 'Dark Background',
            '--darker-bg': 'Darker Background',
            '--card-bg': 'Card Background',
            '--text-light': 'Light Text',
            '--success-color': 'Success Color',
            '--danger-color': 'Danger Color',
            '--accent-glow': 'Accent Glow',
            '--text-secondary': 'Secondary Text'
        };
        
        return names[variable] || variable;
    }
    
    saveColors() {
        try {
            localStorage.setItem('userColors', JSON.stringify(this.colorVariables));
            console.log('💾 تم حفظ الألوان في localStorage');
        } catch (error) {
            console.error('❌ خطأ في حفظ الألوان:', error);
        }
    }
    
    loadPresets() {
        const presetsGrid = document.getElementById('presetsGrid');
        
        if (!presetsGrid) return;
        
        // تحميل المظاهر المحفوظة من المستخدم
        const userPresets = this.loadUserPresets();
        const allPresets = [...this.presets, ...userPresets];
        
        presetsGrid.innerHTML = allPresets.map(preset => {
            const colors = preset.colors;
            const colorKeys = Object.keys(colors);
            
            return `
                <div class="preset-item" onclick="window.colorsEditor.applyPreset('${preset.id}')">
                    <div class="preset-preview">
                        ${colorKeys.slice(0, 4).map(key => 
                            `<div class="preset-color" style="background-color: ${colors[key]}"></div>`
                        ).join('')}
                    </div>
                    <h4 class="preset-name">${preset.name}</h4>
                    <p class="preset-desc">${preset.description}</p>
                    ${preset.userCreated ? '<small style="color: var(--success-color);">مخصص</small>' : ''}
                </div>
            `;
        }).join('');
    }
    
    loadUserPresets() {
        const savedPresets = localStorage.getItem('userColorPresets');
        
        if (savedPresets) {
            try {
                return JSON.parse(savedPresets);
            } catch (error) {
                console.error('❌ خطأ في تحميل المظاهر المحفوظة:', error);
                return [];
            }
        }
        
        return [];
    }
    
    applyPreset(presetId) {
        let preset;
        
        // البحث في المظاهر المضمنة
        preset = this.presets.find(p => p.id === presetId);
        
        // إذا لم يكن في المضمنة، ابحث في المظاهر المحفوظة
        if (!preset) {
            const userPresets = this.loadUserPresets();
            preset = userPresets.find(p => p.id === presetId);
        }
        
        if (!preset) {
            this.showAlert('لم يتم العثور على المظهر المحدد', 'error');
            return;
        }
        
        // تطبيق الألوان
        Object.keys(preset.colors).forEach(variable => {
            const colorValue = preset.colors[variable];
            this.colorVariables[variable] = colorValue;
            
            // تحديث مدخلات الألوان
            const inputId = this.getInputIdFromVariable(variable);
            const input = document.getElementById(inputId);
            if (input) {
                let hexColor = colorValue;
                
                // تحويل rgba إلى hex إذا لزم الأمر
                if (colorValue.startsWith('rgba')) {
                    hexColor = this.rgbaToHex(colorValue);
                }
                
                if (hexColor.startsWith('#')) {
                    input.value = hexColor;
                }
            }
            
            // تحديث القيم المعروضة
            const valueElement = document.getElementById(`${inputId}Value`);
            if (valueElement) {
                valueElement.textContent = colorValue;
            }
        });
        
        // تحديث المعاينات
        this.updateColorPreviews();
        
        // تطبيق الألوان
        this.applyColors();
        
        this.showAlert(`تم تطبيق مظهر "${preset.name}" بنجاح`, 'success');
    }
    
    showSavePresetModal() {
        document.getElementById('savePresetModal').style.display = 'flex';
    }
    
    hideSavePresetModal() {
        document.getElementById('savePresetModal').style.display = 'none';
        document.getElementById('presetName').value = '';
        document.getElementById('presetDescription').value = '';
    }
    
    saveNewPreset() {
        const name = document.getElementById('presetName').value.trim();
        const description = document.getElementById('presetDescription').value.trim();
        
        if (!name) {
            this.showAlert('يرجى إدخال اسم للمظهر', 'error');
            return;
        }
        
        if (!description) {
            this.showAlert('يرجى إدخال وصف للمظهر', 'error');
            return;
        }
        
        // إنشاء معرف فريد للمظهر
        const presetId = 'user_' + Date.now();
        
        const newPreset = {
            id: presetId,
            name: name,
            description: description,
            colors: { ...this.colorVariables },
            userCreated: true,
            createdAt: new Date().toISOString()
        };
        
        // تحميل المظاهر الحالية
        let userPresets = this.loadUserPresets();
        
        // إضافة المظهر الجديد
        userPresets.push(newPreset);
        
        // حفظ المظاهر
        try {
            localStorage.setItem('userColorPresets', JSON.stringify(userPresets));
            this.showAlert('تم حفظ المظهر الجديد بنجاح', 'success');
            this.hideSavePresetModal();
            this.loadPresets();
        } catch (error) {
            console.error('❌ خطأ في حفظ المظهر:', error);
            this.showAlert('حدث خطأ في حفظ المظهر', 'error');
        }
    }
    
    showAlert(message, type = 'info') {
        // إزالة أي تنبيهات سابقة
        const oldAlert = document.querySelector('.alert-message');
        if (oldAlert) {
            oldAlert.remove();
        }
        
        // إنشاء التنبيه الجديد
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-message alert-${type}`;
        alertDiv.textContent = message;
        
        // إضافة الأيقونة المناسبة
        const icon = type === 'success' ? 'uil-check-circle' : 
                    type === 'error' ? 'uil-times-circle' : 
                    'uil-info-circle';
        
        alertDiv.innerHTML = `<i class="uil ${icon} me-2"></i> ${message}`;
        
        document.body.appendChild(alertDiv);
        
        // إزالة التنبيه تلقائياً بعد 3 ثوان
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }
}

// تهيئة محرر الألوان عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.colorsEditor = new ColorsEditor();
});