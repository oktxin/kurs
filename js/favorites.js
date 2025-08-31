class FavoritesManager {
    constructor() {
        this.api = window.apiService;
        this.favorites = [];
        this.init();
    }

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        
        if (this.api.isAuthenticated()) {
            await this.loadFavorites();
        }
    }

    checkAuth() {
        const authRequired = document.getElementById('auth-required');
        const content = document.getElementById('favorites-content');
        
        if (!this.api.isAuthenticated()) {
            authRequired.style.display = 'block';
            content.style.display = 'none';
        } else {
            authRequired.style.display = 'none';
            content.style.display = 'block';
        }
    }

    async loadFavorites() {
        this.showPreloader();
        
        try {
            const favorites = await this.api.request('/favorites');
            const userFavorites = favorites.filter(fav => fav.userId === this.api.user.id);
            
            const cottages = await this.api.request('/cottages');

            this.favorites = userFavorites.map(fav => {
                const cottage = cottages.find(c => c.id === fav.cottageId);
                return {
                    ...cottage,
                    favoriteId: fav.id,
                    addedAt: fav.createdAt
                };
            }).filter(Boolean); 

            this.displayFavorites();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.showError('Ошибка загрузки избранного');
        } finally {
            this.hidePreloader();
        }
    }

    displayFavorites() {
        const grid = document.getElementById('favorites-grid');
        const noFavorites = document.getElementById('no-favorites');
        const actions = document.getElementById('favorites-actions');
        
        if (this.favorites.length === 0) {
            grid.innerHTML = '';
            noFavorites.style.display = 'block';
            actions.style.display = 'none';
            return;
        }
        
        noFavorites.style.display = 'none';
        actions.style.display = 'block';
        
        grid.innerHTML = this.favorites.map(cottage => this.createFavoriteCard(cottage)).join('');

        this.addRemoveHandlers();
    }

    createFavoriteCard(cottage) {
        const statusText = cottage.status === 'available' ? 'Доступно' : 
                          cottage.status === 'reserved' ? 'Забронировано' : 'Продано';
        const statusClass = cottage.status === 'available' ? 'badge-available' : 
                           cottage.status === 'reserved' ? 'badge-reserved' : 'badge-sold';
        
        return `
            <div class="cottage-card favorite-card" data-favorite-id="${cottage.favoriteId}">
                <button class="remove-favorite-btn" data-favorite-id="${cottage.favoriteId}" title="Удалить из избранного">
                    ×
                </button>
                <span class="cottage-badge ${statusClass}">${statusText}</span>
                <img src="../images/${cottage.images[0] || 'default_cottage.jpeg'}" 
                     alt="${cottage.title}" 
                     class="cottage-image"
                     onerror="this.src='../images/default_cottage.jpeg'">
                
                <div class="cottage-content">
                    <div class="cottage-header">
                        <h3 class="cottage-title">${cottage.title}</h3>
                        <div class="cottage-price">${this.formatPrice(cottage.price)} ₸</div>
                    </div>
                    
                    <div class="cottage-location">${cottage.location}</div>
                    
                    <div class="cottage-features">
                        <div class="feature-item">
                            <img src="../images/area-icon.png" alt="Площадь">
                            ${cottage.area} м²
                        </div>
                        <div class="feature-item">
                            <img src="../images/bed-icon.png" alt="Спальни">
                            ${cottage.bedrooms} спальни
                        </div>
                        <div class="feature-item">
                            <img src="../images/bath-icon.png" alt="Ванные">
                            ${cottage.bathrooms} ванные
                        </div>
                        <div class="feature-item">
                            <img src="../images/floor-icon.png" alt="Этажи">
                            ${cottage.floors} этажа
                        </div>
                    </div>
                    
                    <div class="cottage-actions">
                        <button class="view-details-btn" data-cottage-id="${cottage.id}">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    updateStats() {
        const countElement = document.getElementById('favorites-count');
        countElement.textContent = `${this.favorites.length} ${this.getPluralForm(this.favorites.length, ['коттедж', 'коттеджа', 'коттеджей'])}`;
    }

    getPluralForm(number, forms) {
        const cases = [2, 0, 1, 1, 1, 2];
        return forms[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }

    setupEventListeners() {
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            this.showConfirmationModal();
        });

        const modal = document.getElementById('confirmation-modal');
        const closeBtn = document.querySelector('.modal-close');
        const cancelBtn = document.querySelector('.cancel-btn');
        const confirmBtn = document.querySelector('.confirm-btn');

        closeBtn.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        confirmBtn.addEventListener('click', () => this.clearAllFavorites());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    addRemoveHandlers() {
        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const favoriteId = parseInt(e.target.dataset.favoriteId);
                this.removeFavorite(favoriteId, e.target.closest('.cottage-card'));
            });
        });

        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cottageId = parseInt(e.target.dataset.cottageId);
                this.viewCottageDetails(cottageId);
            });
        });
    }

    async removeFavorite(favoriteId, cardElement) {
        try {
            await this.api.request(`/favorites/${favoriteId}`, {
                method: 'DELETE'
            });

            this.favorites = this.favorites.filter(fav => fav.favoriteId !== favoriteId);

            cardElement.style.opacity = '0';
            cardElement.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                cardElement.remove();
                this.updateStats();
                
                if (this.favorites.length === 0) {
                    document.getElementById('no-favorites').style.display = 'block';
                    document.getElementById('favorites-actions').style.display = 'none';
                }
            }, 300);

            this.showNotification('Удалено из избранного', 'success');
            
        } catch (error) {
            console.error('Error removing favorite:', error);
            this.showNotification('Ошибка при удалении из избранного', 'error');
        }
    }

    async clearAllFavorites() {
        this.hideModal();
        this.showPreloader();
        
        try {
            const favorites = await this.api.request('/favorites');
            const userFavorites = favorites.filter(fav => fav.userId === this.api.user.id);

            for (const favorite of userFavorites) {
                await this.api.request(`/favorites/${favorite.id}`, {
                    method: 'DELETE'
                });
            }

            this.favorites = [];

            this.displayFavorites();
            this.updateStats();
            
            this.showNotification('Все коттеджи удалены из избранного', 'success');
            
        } catch (error) {
            console.error('Error clearing favorites:', error);
            this.showNotification('Ошибка при очистке избранного', 'error');
        } finally {
            this.hidePreloader();
        }
    }

    viewCottageDetails(cottageId) {
        window.location.href = `cottages.html#cottage-${cottageId}`;
    }

    showConfirmationModal() {
        document.getElementById('confirmation-modal').classList.add('active');
    }

    hideModal() {
        document.getElementById('confirmation-modal').classList.remove('active');
    }

    showPreloader() {
        document.getElementById('preloader').style.display = 'block';
    }

    hidePreloader() {
        document.getElementById('preloader').style.display = 'none';
    }

    showError(message) {
        const grid = document.getElementById('favorites-grid');
        grid.innerHTML = `
            <div class="no-results">
                <img src="../images/error-icon.png" alt="Ошибка">
                <h3>Ошибка</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
        `;
        
        if (type === 'success') notification.style.background = '#28a745';
        else if (type === 'error') notification.style.background = '#dc3545';
        else notification.style.background = '#2196F3';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.favoritesManager = new FavoritesManager();
});