class AuthManager {
    constructor() {
        this.api = window.apiService;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const user = await this.api.getCurrentUser();
            this.updateUI(user);
            
            if (window.location.pathname.includes('auth.html') && user) {
                setTimeout(() => {
                    const redirectPath = window.location.pathname.includes('/pages/')
                        ? 'home.html'
                        : '../index.html';
                    window.location.replace(redirectPath);
                }, 500);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.updateUI(null);
        }
    }


    updateUI(user) {
        const authLink = document.getElementById('auth-link');
        const userMenu = document.getElementById('user-menu');
        const mobileAuthLink = document.querySelector('.mobile-menu .auth-link');

        if (user) {
            if (authLink) authLink.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            if (mobileAuthLink) mobileAuthLink.style.display = 'none';

            this.fillUserData(user);
        } else {
            if (authLink) authLink.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
            if (mobileAuthLink) mobileAuthLink.style.display = 'block';
        }
    }

    fillUserData(user) {
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        const userAvatar = document.getElementById('user-avatar');
        const adminPanelLink = document.getElementById('admin-panel-link');

        if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
        if (userEmail) userEmail.textContent = user.email;
        
        if (userAvatar) {
            userAvatar.innerHTML = `
                <img src="${user.avatar || '../images/default-avatar.jpg'}" alt="Аватар">
            `;
        }

        if (adminPanelLink) {
            adminPanelLink.style.display = user.role === 'admin' ? 'flex' : 'none';
            adminPanelLink.href = 'admin.html';
        }
    }

    setupEventListeners() {
        const userAvatar = document.getElementById('user-avatar');
        const dropdownMenu = document.getElementById('dropdown-menu');

        if (userAvatar && dropdownMenu) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!userAvatar.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.classList.remove('active');
                }
            });
        }

        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await this.api.logout();
                    this.updateUI(null);
                    dropdownMenu.classList.remove('active');
                    this.showNotification('Вы успешно вышли из системы', 'success');

                    if (window.location.pathname.includes('admin.html')) {
                        window.location.href = 'home.html';
                    }
                } catch (error) {
                    this.showNotification('Ошибка при выходе', 'error');
                }
            });
        }

        document.querySelectorAll('.dropdown-item').forEach(item => {
            if (item.id === 'admin-panel-link') {
                return;
            }
            
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('logout-btn')) return;
                dropdownMenu.classList.remove('active');
            });
        });
    }

    showNotification(message, type) {
        console.log(`${type}: ${message}`);
    }
}

window.updateAuthUI = function(user) {
    const authManager = new AuthManager();
    authManager.updateUI(user);
};

document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});