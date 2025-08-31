class CottagesManager {
    constructor() {
        this.api = window.apiService;
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.filters = {
            search: '',
            category: '',
            status: '',
            priceMin: '',
            priceMax: '',
            areaMin: '',
            areaMax: '',
            bedrooms: ''
        };
        this.sortBy = 'newest';
        this.favorites = new Set();
        this.init();
    }

    async init() {
        this.loadFavorites();
        this.setupEventListeners();
        await this.loadCottages();
    }

    async loadCottages() {
        this.showPreloader();
        
        try {
            const cottages = await this.api.request('/cottages');
            this.displayCottages(cottages);
            this.setupPagination(cottages.length);
        } catch (error) {
            console.error('Error loading cottages:', error);
            this.showError(t('cottages.errors.loadError'));
        } finally {
            this.hidePreloader();
        }
    }

    async applyFilters() {
        this.showPreloader();
        
        try {
            let cottages = await this.api.request('/cottages');

            cottages = cottages.filter(cottage => {
                if (this.filters.search && 
                    !cottage.title.toLowerCase().includes(this.filters.search.toLowerCase())) {
                    return false;
                }
                
                if (this.filters.category && cottage.category !== this.filters.category) {
                    return false;
                }
                
                if (this.filters.status && cottage.status !== this.filters.status) {
                    return false;
                }
                
                if (this.filters.priceMin && cottage.price < parseInt(this.filters.priceMin)) {
                    return false;
                }
                
                if (this.filters.priceMax && cottage.price > parseInt(this.filters.priceMax)) {
                    return false;
                }
                
                if (this.filters.areaMin && cottage.area < parseInt(this.filters.areaMin)) {
                    return false;
                }
                
                if (this.filters.areaMax && cottage.area > parseInt(this.filters.areaMax)) {
                    return false;
                }
                
                if (this.filters.bedrooms) {
                    const bedrooms = parseInt(this.filters.bedrooms);
                    if (bedrooms === 4 && cottage.bedrooms < 4) return false;
                    if (bedrooms !== 4 && cottage.bedrooms !== bedrooms) return false;
                }
                
                return true;
            });

            cottages = this.sortCottages(cottages);
            
            this.displayCottages(cottages);
            this.setupPagination(cottages.length);
            
        } catch (error) {
            console.error('Error applying filters:', error);
            this.showError(t('cottages.errors.filterError'));
        } finally {
            this.hidePreloader();
        }
    }

    sortCottages(cottages) {
        switch (this.sortBy) {
            case 'price-asc':
                return cottages.sort((a, b) => a.price - b.price);
            case 'price-desc':
                return cottages.sort((a, b) => b.price - a.price);
            case 'area-asc':
                return cottages.sort((a, b) => a.area - b.area);
            case 'area-desc':
                return cottages.sort((a, b) => b.area - a.area);
            case 'newest':
                return cottages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return cottages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            default:
                return cottages;
        }
    }

    displayCottages(cottages) {
        const grid = document.getElementById('cottages-grid');
        const noResults = document.getElementById('no-results');
        
        if (cottages.length === 0) {
            grid.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }
        
        noResults.style.display = 'none';

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedCottages = cottages.slice(startIndex, startIndex + this.itemsPerPage);
        
        grid.innerHTML = paginatedCottages.map(cottage => this.createCottageCard(cottage)).join('');

        this.addFavoriteHandlers();
    }

    createCottageCard(cottage) {
        const isFavorite = this.favorites.has(cottage.id);
        const statusText = cottage.status === 'available' ? t('cottages.status.available') : 
                          cottage.status === 'reserved' ? t('cottages.status.reserved') : t('cottages.status.sold');
        const statusClass = cottage.status === 'available' ? 'badge-available' : 
                           cottage.status === 'reserved' ? 'badge-reserved' : 'badge-sold';
        
        return `
            <div class="cottage-card" data-id="${cottage.id}">
                <span class="cottage-badge ${statusClass}">${statusText}</span>
                <img src="../images/${cottage.images[0] || 'default_cottage.jpeg'}" 
                     alt="${cottage.title}" 
                     class="cottage-image"
                     onerror="this.src='../images/default cottage.jpeg'">
                
                <div class="cottage-content">
                    <div class="cottage-header">
                        <h3 class="cottage-title">${cottage.title}</h3>
                        <div class="cottage-price">${this.formatPrice(cottage.price)} ₸</div>
                    </div>
                    
                    <div class="cottage-location">${cottage.location}</div>
                    
                    <div class="cottage-features">
                        <div class="feature-item">
                            <img src="../images/area-icon.png" alt="${t('cottages.features.area')}">
                            ${cottage.area} м²
                        </div>
                        <div class="feature-item">
                            <img src="../images/bed-icon.png" alt="${t('cottages.features.bedrooms')}">
                            ${cottage.bedrooms} ${t('cottages.features.bedrooms')}
                        </div>
                        <div class="feature-item">
                            <img src="../images/bath-icon.png" alt="${t('cottages.features.bathrooms')}">
                            ${cottage.bathrooms} ${t('cottages.features.bathrooms')}
                        </div>
                        <div class="feature-item">
                            <img src="../images/floor-icon.png" alt="${t('cottages.features.floors')}">
                            ${cottage.floors} ${t('cottages.features.floors')}
                        </div>
                    </div>
                    
                    <div class="cottage-actions">
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" 
                                data-cottage-id="${cottage.id}">
                            ♥
                        </button>
                        <button class="view-details-btn" data-cottage-id="${cottage.id}">
                            ${t('cottages.actions.details')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupPagination(totalItems) {
        const pagination = document.getElementById('pagination');
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';

        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="cottagesManager.goToPage(${this.currentPage - 1})">
                ←
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                paginationHTML += `
                    <button class="pagination-btn ${this.currentPage === i ? 'active' : ''}" 
                            onclick="cottagesManager.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }

        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="cottagesManager.goToPage(${this.currentPage + 1})">
                →
            </button>
        `;

        paginationHTML += `
            <span class="pagination-info">
                ${t('cottages.pagination.page')} ${this.currentPage} ${t('cottages.pagination.of')} ${totalPages}
            </span>
        `;
        
        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setupEventListeners() {
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.debouncedApplyFilters();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('price-min').addEventListener('input', (e) => {
            this.filters.priceMin = e.target.value;
            this.debouncedApplyFilters();
        });

        document.getElementById('price-max').addEventListener('input', (e) => {
            this.filters.priceMax = e.target.value;
            this.debouncedApplyFilters();
        });

        document.getElementById('area-min').addEventListener('input', (e) => {
            this.filters.areaMin = e.target.value;
            this.debouncedApplyFilters();
        });

        document.getElementById('area-max').addEventListener('input', (e) => {
            this.filters.areaMax = e.target.value;
            this.debouncedApplyFilters();
        });

        document.getElementById('bedrooms-filter').addEventListener('change', (e) => {
            this.filters.bedrooms = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.applyFilters();
        });

        document.getElementById('apply-filters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetFilters();
        });

        document.getElementById('toggle-filters').addEventListener('click', () => {
            const panel = document.getElementById('filters-panel');
            panel.style.display = panel.style.display === 'none' ? 'grid' : 'none';
        });

        this.debouncedApplyFilters = this.debounce(() => this.applyFilters(), 500);
    }

addFavoriteHandlers() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cottageId = e.target.dataset.cottageId; 
            this.toggleFavorite(cottageId, e.target);
        });
    });

    document.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cottageId = e.target.dataset.cottageId; 
            this.viewCottageDetails(cottageId);
        });
    });
}


async toggleFavorite(cottageId, button) {
    if (!this.api.isAuthenticated()) {
        this.showNotification(t('cottages.favorites.authRequired'), 'error');
        return;
    }

    try {
        if (this.favorites.has(cottageId)) {
            this.favorites.delete(cottageId);
            button.classList.remove('active');

            const favorites = await this.api.request('/favorites');
            const favorite = favorites.find(f => f.userId === this.api.user.id && f.cottageId === cottageId);
            
            if (favorite) {
                await this.api.request(`/favorites/${favorite.id}`, {
                    method: 'DELETE'
                });
            }
            
            this.showNotification(t('cottages.favorites.removed'), 'success');
        } else {
            this.favorites.add(cottageId);
            button.classList.add('active');

            await this.api.request('/favorites', {
                method: 'POST',
                body: JSON.stringify({
                    userId: this.api.user.id,
                    cottageId: cottageId, 
                    createdAt: new Date().toISOString()
                })
            });
            
            this.showNotification(t('cottages.favorites.added'), 'success');
        }
        
        this.saveFavorites();
    } catch (error) {
        console.error('Error toggling favorite:', error);
        this.showNotification(t('cottages.favorites.error'), 'error');
    }
}


    viewCottageDetails(cottageId) {
        this.showNotification(t('cottages.actions.detailsComing'), 'info');
    }

    loadFavorites() {
        try {
            const stored = localStorage.getItem('userFavorites');
            if (stored) {
                this.favorites = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            this.favorites = new Set();
        }
    }

    saveFavorites() {
        localStorage.setItem('userFavorites', JSON.stringify([...this.favorites]));
    }

    resetFilters() {
        this.filters = {
            search: '',
            category: '',
            status: '',
            priceMin: '',
            priceMax: '',
            areaMin: '',
            areaMax: '',
            bedrooms: ''
        };

        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
        document.getElementById('status-filter').value = '';
        document.getElementById('price-min').value = '';
        document.getElementById('price-max').value = '';
        document.getElementById('area-min').value = '';
        document.getElementById('area-max').value = '';
        document.getElementById('bedrooms-filter').value = '';
        document.getElementById('sort-by').value = 'newest';
        
        this.sortBy = 'newest';
        this.currentPage = 1;
        this.applyFilters();
    }

    showPreloader() {
        document.getElementById('preloader').style.display = 'block';
        document.getElementById('cottages-grid').style.display = 'none';
    }

    hidePreloader() {
        document.getElementById('preloader').style.display = 'none';
        document.getElementById('cottages-grid').style.display = 'grid';
    }

    showError(message) {
        const grid = document.getElementById('cottages-grid');
        grid.innerHTML = `
            <div class="no-results">
                <img src="../images/error-icon.png" alt="${t('cottages.errors.error')}">
                <h3>${t('cottages.errors.error')}</h3>
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cottagesManager = new CottagesManager();
});