class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
        this.createThemeToggle();
    }

    applyTheme() {
        document.documentElement.classList.remove('light-theme', 'dark-theme');
        document.documentElement.classList.add(this.currentTheme + '-theme');
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    setupEventListeners() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (localStorage.getItem('theme') === 'auto') {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    createThemeToggle() {
        const existingToggle = document.querySelector('.theme-toggle');
        if (existingToggle) {
            existingToggle.remove();
        }

        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = this.getThemeIcon();
        toggle.title = this.currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        
        toggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        document.body.appendChild(toggle);
    }

    getThemeIcon() {
        return this.currentTheme === 'dark' ? '☀️' : '🌙';
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();

        const toggle = document.querySelector('.theme-toggle');
        if (toggle) {
            toggle.innerHTML = this.getThemeIcon();
            toggle.title = this.currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});