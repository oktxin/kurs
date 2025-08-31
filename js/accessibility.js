class AccessibilityManager {
    constructor() {
        this.isInitialized = false;
        this.settings = {
            fontSize: 'medium',
            colorScheme: 'default',
            imagesDisabled: false
        };
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.createAccessibilityPanel();
        this.loadSettings();
        this.applySettings();
        this.bindEvents();
        
        this.isInitialized = true;
    }

    createAccessibilityPanel() {
        const panelHTML = `
            <div class="accessibility-panel" id="accessibility-panel">
                <div class="accessibility-header">
                    <h3 data-i18n="accessibility.title">Версия для слабовидящих</h3>
                    <button class="accessibility-close" aria-label="Закрыть панель">×</button>
                </div>
                <div class="accessibility-content">
                    <div class="accessibility-group">
                        <h4 data-i18n="accessibility.fontSize">Размер шрифта</h4>
                        <div class="accessibility-buttons">
                            <button class="accessibility-btn" data-size="small" data-i18n="accessibility.small">Маленький</button>
                            <button class="accessibility-btn" data-size="medium" data-i18n="accessibility.medium">Средний</button>
                            <button class="accessibility-btn" data-size="large" data-i18n="accessibility.large">Большой</button>
                        </div>
                    </div>
                    <div class="accessibility-group">
                        <h4 data-i18n="accessibility.colorScheme">Цветовая схема</h4>
                        <div class="accessibility-buttons">
                            <button class="accessibility-btn" data-scheme="black-white" data-i18n="accessibility.blackWhite">Черный-Белый</button>
                            <button class="accessibility-btn" data-scheme="black-green" data-i18n="accessibility.blackGreen">Черный-Зеленый</button>
                            <button class="accessibility-btn" data-scheme="white-black" data-i18n="accessibility.whiteBlack">Белый-Черный</button>
                            <button class="accessibility-btn" data-scheme="beige-brown" data-i18n="accessibility.beigeBrown">Бежевый-Коричневый</button>
                            <button class="accessibility-btn" data-scheme="blue-darkblue" data-i18n="accessibility.blueDarkBlue">Голубой-Синий</button>
                        </div>
                    </div>
                    <div class="accessibility-group">
                        <h4 data-i18n="accessibility.images">Изображения</h4>
                        <div class="accessibility-buttons">
                            <button class="accessibility-btn" data-images="enabled" data-i18n="accessibility.showImages">Показывать</button>
                            <button class="accessibility-btn" data-images="disabled" data-i18n="accessibility.hideImages">Скрыть</button>
                        </div>
                    </div>
                    <button class="accessibility-reset" data-i18n="accessibility.reset">Сбросить настройки</button>
                </div>
            </div>
            <div class="accessibility-overlay" id="accessibility-overlay"></div>
        `;

        document.body.insertAdjacentHTML('beforeend', panelHTML);
    }

    bindEvents() {
        document.querySelector('.accessibility-close').addEventListener('click', () => {
            this.hidePanel();
        });

        document.getElementById('accessibility-overlay').addEventListener('click', () => {
            this.hidePanel();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelVisible()) {
                this.hidePanel();
            }
        });

        document.querySelectorAll('[data-size]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFontSize(e.target.dataset.size);
                this.updateButtonStates();
            });
        });

        document.querySelectorAll('[data-scheme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setColorScheme(e.target.dataset.scheme);
                this.updateButtonStates();
            });
        });

        document.querySelectorAll('[data-images]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setImagesState(e.target.dataset.images === 'disabled');
                this.updateButtonStates();
            });
        });

        document.querySelector('.accessibility-reset').addEventListener('click', () => {
            this.resetSettings();
        });

        this.setupSettingsMenuHandler();
    }

    setupSettingsMenuHandler() {
        const addSettingsHandler = (element) => {
            if (element && !element.hasAttribute('data-accessibility-handler')) {
                element.setAttribute('data-accessibility-handler', 'true');
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.togglePanel();
                });
            }
        };

        const findAndAddHandlers = () => {
            const settingsElements = document.querySelectorAll('[data-i18n="nav.settings"]');
            settingsElements.forEach(element => {
                const link = element.closest('a');
                if (link) {
                    addSettingsHandler(link);
                }
            });

            const allLinks = document.querySelectorAll('a');
            allLinks.forEach(link => {
                const text = link.textContent.trim();
                if (text === 'Настройки' || text === 'Settings' || text === 'Баптаулар') {
                    addSettingsHandler(link);
                }
            });

            const dropdownItems = document.querySelectorAll('.dropdown-item');
            dropdownItems.forEach(item => {
                const text = item.textContent.trim();
                if (text.includes('Настройки') || text.includes('Settings') || text.includes('Баптаулар')) {
                    addSettingsHandler(item);
                }
            });
        };

        findAndAddHandlers();

        setTimeout(findAndAddHandlers, 1000);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    findAndAddHandlers();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    togglePanel() {
        if (this.isPanelVisible()) {
            this.hidePanel();
        } else {
            this.showPanel();
        }
    }

    showPanel() {
        document.getElementById('accessibility-panel').classList.add('show');
        document.getElementById('accessibility-overlay').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hidePanel() {
        document.getElementById('accessibility-panel').classList.remove('show');
        document.getElementById('accessibility-overlay').classList.remove('show');
        document.body.style.overflow = '';
    }

    isPanelVisible() {
        return document.getElementById('accessibility-panel').classList.contains('show');
    }

    setFontSize(size) {
        this.settings.fontSize = size;
        this.applyFontSize();
        this.saveSettings();
    }

    setColorScheme(scheme) {
        this.settings.colorScheme = scheme;
        this.applyColorScheme();
        this.saveSettings();
    }

    setImagesState(disabled) {
        this.settings.imagesDisabled = disabled;
        this.applyImagesState();
        this.saveSettings();
    }

    applyFontSize() {
        document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
        document.body.classList.add(`font-size-${this.settings.fontSize}`);
    }

    applyColorScheme() {
        const colorSchemes = [
            'color-scheme-black-white',
            'color-scheme-black-green',
            'color-scheme-white-black',
            'color-scheme-beige-brown',
            'color-scheme-blue-darkblue'
        ];
        
        document.body.classList.remove(...colorSchemes);
        
        if (this.settings.colorScheme !== 'default') {
            document.body.classList.add(`color-scheme-${this.settings.colorScheme}`);
        }
    }

    applyImagesState() {
        if (this.settings.imagesDisabled) {
            this.disableImages();
        } else {
            this.enableImages();
        }
    }

    disableImages() {
        document.body.classList.add('accessibility-mode');
        document.querySelectorAll('img').forEach(img => {
            const altText = img.getAttribute('alt') || img.getAttribute('data-i18n') || 'Изображение';
            if (!img.parentNode.querySelector('.text-replacement')) {
                const replacement = document.createElement('div');
                replacement.className = 'text-replacement';
                replacement.textContent = altText;
                replacement.style.display = 'none';
                img.parentNode.insertBefore(replacement, img);
            }
            img.style.display = 'none';
            const replacement = img.nextElementSibling;
            if (replacement && replacement.classList.contains('text-replacement')) {
                replacement.style.display = 'block';
            }
        });
    }

    enableImages() {
        document.body.classList.remove('accessibility-mode');
        document.querySelectorAll('img').forEach(img => {
            img.style.display = '';
            const replacement = img.nextElementSibling;
            if (replacement && replacement.classList.contains('text-replacement')) {
                replacement.style.display = 'none';
            }
        });
    }

    applySettings() {
        this.applyFontSize();
        this.applyColorScheme();
        this.applyImagesState();
        this.updateButtonStates();
    }

    updateButtonStates() {
        document.querySelectorAll('[data-size]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === this.settings.fontSize);
        });

        document.querySelectorAll('[data-scheme]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scheme === this.settings.colorScheme);
        });

        document.querySelectorAll('[data-images]').forEach(btn => {
            btn.classList.toggle('active', 
                (btn.dataset.images === 'disabled' && this.settings.imagesDisabled) ||
                (btn.dataset.images === 'enabled' && !this.settings.imagesDisabled)
            );
        });
    }

    saveSettings() {
        localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Error loading accessibility settings:', e);
            }
        }
    }

    resetSettings() {
        this.settings = {
            fontSize: 'medium',
            colorScheme: 'default',
            imagesDisabled: false
        };

        if (window.i18nManager && typeof window.i18nManager.changeLanguage === 'function') {
            window.i18nManager.changeLanguage('ru');
        } else {
            localStorage.setItem('language', 'ru');
            window.dispatchEvent(new CustomEvent('languageChange', { detail: { lang: 'ru' } }));
        }

        if (window.themeManager && typeof window.themeManager.toggleTheme === 'function') {
            if (localStorage.getItem('theme') === 'dark') {
                window.themeManager.toggleTheme();
            }
        } else {
            localStorage.setItem('theme', 'light');
            document.documentElement.classList.remove('dark-theme');
            document.documentElement.classList.add('light-theme');
            document.body.setAttribute('data-theme', 'light');
            
            const themeToggle = document.querySelector('.theme-toggle');
            if (themeToggle) {
                themeToggle.textContent = '🌙';
                themeToggle.title = 'Switch to dark theme';
            }
        }
        
        localStorage.removeItem('accessibilitySettings');
        this.applySettings();
        
        this.showNotification('Все настройки сброшены. Язык: русский, Тема: светлая', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10001;
            font-family: 'Fira Sans', sans-serif;
        `;
        
        if (type === 'success') {
            notification.style.background = 'var(--success-color, #28a745)';
        } else if (type === 'error') {
            notification.style.background = 'var(--error-color, #dc3545)';
        } else {
            notification.style.background = 'var(--info-color, #17a2b8)';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
});