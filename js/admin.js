class AdminPanel {
    constructor() {
        this.api = window.apiService;
        this.currentTab = 'users';
        this.currentAction = null;
        this.init();
    }

    async init() {
        if (!document.getElementById('user-modal') || 
            !document.getElementById('cottage-modal') || 
            !document.getElementById('confirmation-modal')) {
            console.error('Modal elements not found in DOM');
            return;
        }
        
        this.checkAdminAccess();
        this.setupEventListeners();
        
        if (this.api.isAdmin()) {
            await this.loadData();
        }
    }

    checkAdminAccess() {
        const authRequired = document.getElementById('auth-required');
        const content = document.getElementById('admin-content');
        const preloader = document.getElementById('preloader');
        
        if (!this.api.isAuthenticated() || !this.api.isAdmin()) {
            preloader.style.display = 'none';
            authRequired.style.display = 'block';
            content.style.display = 'none';
        } else {
            authRequired.style.display = 'none';
            content.style.display = 'block';
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        document.getElementById('refresh-users').addEventListener('click', () => this.loadUsers());
        document.getElementById('refresh-cottages').addEventListener('click', () => this.loadCottages());

        document.getElementById('add-cottage').addEventListener('click', () => this.showCottageModal());

        document.getElementById('users-search').addEventListener('input', (e) => this.filterUsers(e.target.value));
        document.getElementById('cottages-search').addEventListener('input', (e) => this.filterCottages(e.target.value));

        this.setupModalHandlers();
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        if (tabName === 'users') {
            this.loadUsers();
        } else {
            this.loadCottages();
        }
    }

    async loadData() {
        this.showPreloader();
        
        try {
            await Promise.all([
                this.loadUsers(),
                this.loadCottages()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.showNotification('Ошибка загрузки данных', 'error');
        } finally {
            this.hidePreloader();
        }
    }

async loadUsers() {
    try {
        const users = await this.api.request('/users');
        console.log('Users from API:', users);

        const validUsers = users.filter(user => 
            user && user.id && user.email && user.firstName && user.lastName
        );
        
        console.log('Valid users:', validUsers);
        this.displayUsers(validUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        this.showNotification('Ошибка загрузки пользователей', 'error');
    }
}

    displayUsers(users) {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = users.map(user => this.createUserRow(user)).join('');

        this.addUserActionHandlers();
    }

createUserRow(user) {
    const userId = user.id || 'N/A';
    const firstName = user.firstName || 'Не указано';
    const lastName = user.lastName || 'Не указано';
    const email = user.email || 'Не указано';
    const phone = user.phone || 'Не указано';
    const role = user.role || 'user';
    const registerDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не указано';
    
    return `
        <tr>
            <td>${userId}</td>
            <td>${firstName} ${lastName}</td>
            <td>${email}</td>
            <td>${phone}</td>
            <td><span class="role-badge role-${role}">${role === 'admin' ? 'Админ' : 'Пользователь'}</span></td>
            <td>${registerDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" data-user-id="${userId}" title="Редактировать" ${!userId || userId === 'N/A' ? 'disabled' : ''}>
                        ✏️
                    </button>
                    <button class="delete-btn" data-user-id="${userId}" title="Удалить" ${!userId || userId === 'N/A' ? 'disabled' : ''}>
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
}

async loadCottages() {
    try {
        const cottages = await this.api.request('/cottages');
        console.log('Cottages from API:', cottages);

        const validCottages = cottages.filter(cottage => 
            cottage && cottage.id && cottage.title
        );
        
        console.log('Valid cottages:', validCottages);
        this.displayCottages(validCottages);
    } catch (error) {
        console.error('Error loading cottages:', error);
        this.showNotification('Ошибка загрузки коттеджей', 'error');
    }
}

    displayCottages(cottages) {
        const tbody = document.getElementById('cottages-table-body');
        tbody.innerHTML = cottages.map(cottage => this.createCottageRow(cottage)).join('');

        this.addCottageActionHandlers();
    }

createCottageRow(cottage) {
    const price = this.formatPrice(cottage.price);

    const cottageId = cottage.id || 0;
    
    return `
        <tr>
            <td>${cottageId}</td>
            <td>${cottage.title}</td>
            <td>${price} ₸</td>
            <td>${cottage.area} м²</td>
            <td>${cottage.bedrooms}</td>
            <td><span class="status-badge status-${cottage.status}">${this.getStatusText(cottage.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" data-cottage-id="${cottageId}" title="Редактировать">
                        ✏️
                    </button>
                    <button class="delete-btn" data-cottage-id="${cottageId}" title="Удалить">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
}

    getStatusText(status) {
        const statusMap = {
            'available': 'Доступно',
            'reserved': 'Забронировано',
            'sold': 'Продано'
        };
        return statusMap[status] || status;
    }

addUserActionHandlers() {
    document.querySelectorAll('.edit-btn[data-user-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            if (!userId) {
                console.error('Empty user ID');
                this.showNotification('Ошибка: отсутствует ID пользователя', 'error');
                return;
            }
            this.editUser(userId);
        });
    });

    document.querySelectorAll('.delete-btn[data-user-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            if (!userId) {
                console.error('Empty user ID');
                this.showNotification('Ошибка: отсутствует ID пользователя', 'error');
                return;
            }
            this.deleteUser(userId);
        });
    });
}

addCottageActionHandlers() {
    document.querySelectorAll('.edit-btn[data-cottage-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cottageId = e.currentTarget.dataset.cottageId;
            if (!cottageId) {
                console.error('Empty cottage ID');
                this.showNotification('Ошибка: отсутствует ID коттеджа', 'error');
                return;
            }
            this.editCottage(cottageId);
        });
    });

    document.querySelectorAll('.delete-btn[data-cottage-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cottageId = e.currentTarget.dataset.cottageId;
            if (!cottageId) {
                console.error('Empty cottage ID');
                this.showNotification('Ошибка: отсутствует ID коттеджа', 'error');
                return;
            }
            this.deleteCottage(cottageId);
        });
    });
}

async editUser(userId) {
    try {
        if (!userId || userId === 'N/A') {
            throw new Error('Неверный ID пользователя');
        }
        
        console.log('Editing user with ID:', userId);
        const user = await this.api.request(`/users/${userId}`);
        
        if (!user) {
            throw new Error('Пользователь не найден');
        }
        
        this.showUserModal(user);
    } catch (error) {
        console.error('Error loading user:', error);
        this.showNotification('Ошибка загрузки пользователя: ' + error.message, 'error');
    }
}

async editCottage(cottageId) {
    try {
        if (!cottageId) {
            throw new Error('Отсутствует ID коттеджа');
        }
        
        const cottage = await this.api.request(`/cottages/${cottageId}`);
        this.showCottageModal(cottage);
    } catch (error) {
        console.error('Error loading cottage:', error);
        this.showNotification('Ошибка загрузки коттеджа: ' + error.message, 'error');
    }
}

    showUserModal(user = null) {
        const modal = document.getElementById('user-modal');
        const title = document.getElementById('user-modal-title');
        const form = document.getElementById('user-form');
        
        if (user) {
            title.textContent = 'Редактирование пользователя';
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-first-name').value = user.firstName;
            document.getElementById('user-last-name').value = user.lastName;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-phone').value = user.phone;
            document.getElementById('user-role').value = user.role;
        } else {
            title.textContent = 'Добавление пользователя';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    showCottageModal(cottage = null) {
        const modal = document.getElementById('cottage-modal');
        const title = document.getElementById('cottage-modal-title');
        const form = document.getElementById('cottage-form');
        
        if (cottage) {
            title.textContent = 'Редактирование коттеджа';
            document.getElementById('cottage-id').value = cottage.id;
            document.getElementById('cottage-title').value = cottage.title;
            document.getElementById('cottage-price').value = cottage.price;
            document.getElementById('cottage-location').value = cottage.location;
            document.getElementById('cottage-area').value = cottage.area;
            document.getElementById('cottage-bedrooms').value = cottage.bedrooms;
            document.getElementById('cottage-bathrooms').value = cottage.bathrooms;
            document.getElementById('cottage-floors').value = cottage.floors;
            document.getElementById('cottage-status').value = cottage.status;
            document.getElementById('cottage-description').value = cottage.description || '';
            document.getElementById('cottage-images').value = cottage.images ? cottage.images.join(', ') : '';
        } else {
            title.textContent = 'Добавление коттеджа';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    setupModalHandlers() {
        document.querySelectorAll('.modal-close, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModals();
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModals();
                }
            });
        });

        document.querySelectorAll('.modal-content').forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        document.getElementById('save-user').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        document.getElementById('save-cottage').addEventListener('click', (e) => {
            e.preventDefault();
            this.saveCottage();
        });

        document.getElementById('confirm-action').addEventListener('click', (e) => {
            e.preventDefault();
            this.executeConfirmedAction();
        });

        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUser();
        });

        document.getElementById('cottage-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCottage();
        });
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        this.currentAction = null;
    }

async saveUser() {
    const form = document.getElementById('user-form');
    const userId = document.getElementById('user-id').value;
    const userData = {
        firstName: document.getElementById('user-first-name').value,
        lastName: document.getElementById('user-last-name').value,
        email: document.getElementById('user-email').value,
        phone: document.getElementById('user-phone').value,
        role: document.getElementById('user-role').value
    };

    try {
        if (userId) {
            await this.api.request(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify({ ...userData, id: userId }) 
            });
            this.showNotification('Пользователь успешно обновлен', 'success');
        } else {
            userData.password = 'tempPassword123!';
            userData.createdAt = new Date().toISOString();
            await this.api.request('/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            this.showNotification('Пользователь успешно добавлен', 'success');
        }

        this.hideModals();
        this.loadUsers();
    } catch (error) {
        console.error('Error saving user:', error);
        this.showNotification('Ошибка сохранения пользователя', 'error');
    }
}

async saveCottage() {
    const form = document.getElementById('cottage-form');
    const cottageId = document.getElementById('cottage-id').value;
    const cottageData = {
        title: document.getElementById('cottage-title').value,
        price: parseInt(document.getElementById('cottage-price').value),
        location: document.getElementById('cottage-location').value,
        area: parseInt(document.getElementById('cottage-area').value),
        bedrooms: parseInt(document.getElementById('cottage-bedrooms').value),
        bathrooms: parseInt(document.getElementById('cottage-bathrooms').value),
        floors: parseInt(document.getElementById('cottage-floors').value),
        status: document.getElementById('cottage-status').value,
        description: document.getElementById('cottage-description').value,
        images: document.getElementById('cottage-images').value
            .split(',')
            .map(img => img.trim())
            .filter(img => img)
    };

    try {
        if (cottageId) {
            await this.api.request(`/cottages/${cottageId}`, {
                method: 'PUT',
                body: JSON.stringify({ ...cottageData, id: cottageId }) 
            });
            this.showNotification('Коттедж успешно обновлен', 'success');
        } else {
            cottageData.createdAt = new Date().toISOString();
            await this.api.request('/cottages', {
                method: 'POST',
                body: JSON.stringify(cottageData)
            });
            this.showNotification('Коттедж успешно добавлен', 'success');
        }

        this.hideModals();
        this.loadCottages();
    } catch (error) {
        console.error('Error saving cottage:', error);
        this.showNotification('Ошибка сохранения коттеджа', 'error');
    }
}

async deleteUser(userId) {
    this.currentAction = {
        type: 'deleteUser',
        id: userId, 
        message: 'Вы уверены, что хотите удалить этого пользователя?'
    };
    this.showConfirmationModal();
}

async deleteCottage(cottageId) {
    this.currentAction = {
        type: 'deleteCottage',
        id: cottageId, 
        message: 'Вы уверены, что хотите удалить этот коттедж?'
    };
    this.showConfirmationModal();
}

    showConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        const message = document.getElementById('confirmation-message');
        
        message.textContent = this.currentAction.message;
        modal.classList.add('active');
    }

async executeConfirmedAction() {
    const { type, id } = this.currentAction;
    
    try {
        if (type === 'deleteUser') {
            await this.api.request(`/users/${id}`, {
                method: 'DELETE'
            });
            this.showNotification('Пользователь успешно удален', 'success');
            this.loadUsers();
        } else if (type === 'deleteCottage') {
            await this.api.request(`/cottages/${id}`, {
                method: 'DELETE'
            });
            this.showNotification('Коттедж успешно удален', 'success');
            this.loadCottages();
        }
        
        this.hideModals();
    } catch (error) {
        console.error('Error deleting:', error);
        this.showNotification('Ошибка удаления', 'error');
    }
}

    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#users-table-body tr');
        searchTerm = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    filterCottages(searchTerm) {
        const rows = document.querySelectorAll('#cottages-table-body tr');
        searchTerm = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    showPreloader() {
        document.getElementById('preloader').style.display = 'block';
    }

    hidePreloader() {
        document.getElementById('preloader').style.display = 'none';
    }

    showNotification(message, type) {
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 3000);
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});