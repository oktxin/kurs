const API_BASE = 'http://localhost:3000';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.restoreFromStorage();
    }

    restoreFromStorage() {
        try {
            this.token = localStorage.getItem('authToken');
            const userData = localStorage.getItem('user');
            this.user = userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error restoring from storage:', error);
            this.token = null;
            this.user = null;
        }
    }

async request(endpoint, options = {}) {
    if (endpoint.includes('NaN')) {
        console.error('Invalid endpoint with NaN:', endpoint);
        throw new Error(t('api.errors.invalidRequest'));
    }
    
    const url = `${API_BASE}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    if (this.token) {
        config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

    async login(credentials) {
        try {
            const users = await this.request('/users');
            const user = users.find(u => 
                (u.email === credentials.login || u.phone === credentials.login) && 
                u.password === credentials.password
            );

            if (!user) {
                throw new Error(t('api.errors.invalidCredentials'));
            }

            this.user = user;
            localStorage.setItem('user', JSON.stringify(user));

            this.token = this.generateToken();
            localStorage.setItem('authToken', this.token);

            console.log('User saved to localStorage:', user);
            
            return user;
        } catch (error) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            this.token = null;
            this.user = null;
            throw error;
        }
    }

    async register(userData) {
        try {
            const users = await this.request('/users');
            const existingUser = users.find(u => 
                u.email === userData.email || u.phone === userData.phone
            );

            if (existingUser) {
                throw new Error(t('api.errors.userExists'));
            }

            const newUser = {
                ...userData,
                id: Date.now(),
                role: 'user',
                avatar: null,
                createdAt: new Date().toISOString()
            };

            const createdUser = await this.request('/users', {
                method: 'POST',
                body: JSON.stringify(newUser)
            });

            return await this.login({
                login: userData.email,
                password: userData.password
            });
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            if (this.token) {
                const sessions = await this.request('/sessions');
                const userSession = sessions.find(s => s.token === this.token);
                
                if (userSession) {
                    await this.request(`/sessions/${userSession.id}`, {
                        method: 'DELETE'
                    });
                }
            }

            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            
            this.token = null;
            this.user = null;
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

        async getFavorites() {
        if (!this.isAuthenticated()) {
            return [];
        }

        try {
            const favorites = await this.request('/favorites');
            return favorites.filter(fav => fav.userId === this.user.id);
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    async addFavorite(cottageId) {
        if (!this.isAuthenticated()) {
            throw new Error(t('api.errors.authRequired'));
        }

        const favorite = {
            userId: this.user.id,
            cottageId: cottageId,
            createdAt: new Date().toISOString()
        };

        return await this.request('/favorites', {
            method: 'POST',
            body: JSON.stringify(favorite)
        });
    }

    async removeFavorite(favoriteId) {
        return await this.request(`/favorites/${favoriteId}`, {
            method: 'DELETE'
        });
    }

    async getFavoriteCottages() {
        if (!this.isAuthenticated()) {
            return [];
        }

        try {
            const [favorites, cottages] = await Promise.all([
                this.request('/favorites'),
                this.request('/cottages')
            ]);

            const userFavorites = favorites.filter(fav => fav.userId === this.user.id);
            
            return userFavorites.map(fav => {
                const cottage = cottages.find(c => c.id === fav.cottageId);
                return cottage ? { ...cottage, favoriteId: fav.id } : null;
            }).filter(Boolean);
        } catch (error) {
            console.error('Error getting favorite cottages:', error);
            return [];
        }
    }

    async getCurrentUser() {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('authToken');
        
        if (!storedUser || !storedToken) {
            return null;
        }

        try {
            this.user = JSON.parse(storedUser);
            this.token = storedToken;
            
            return this.user;
            
        } catch (error) {
            console.error('Error parsing stored user:', error);
            await this.logout();
            return null;
        }
    }

    generateToken() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    isAuthenticated() {
        return !!localStorage.getItem('authToken') && !!localStorage.getItem('user');
    }

    isAdmin() {
        return this.user?.role === 'admin';
    }
}

window.apiService = new ApiService();