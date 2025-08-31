if (typeof window.AUTH_COMMON_PASSWORDS === 'undefined') {
    window.AUTH_COMMON_PASSWORDS = [
        'password', '123456', '123456789', 'guest', 'qwerty', '12345678', '111111',
        '12345', 'col123456', '123123', '1234567', '1234', '1234567890', '000000',
        '555555', '666666', '123321', '654321', '7777777', '123', '888888', '11111111',
        'google', '121212', '777777', 'abc123', '112233', '123456a', '123abc', 'qwerty123',
        '1q2w3e4r', 'dragon', 'sunshine', 'princess', 'letmein', 'welcome', 'monkey',
        'password1', '123qwe', 'football', 'baseball', 'superman', '1qaz2wsx', 'freedom',
        'charlie', 'master', 'michael', 'jennifer', 'jordan', 'trustno1', 'hello',
        'access', 'flower', 'qwertyuiop', 'admin', 'passw0rd', 'shadow', 'loveme',
        'ashley', 'solo', 'hunter', 'mustang', 'starwars', 'bailey', 'pass',
        'jessica', 'george', 'computer', 'michelle', 'oliver', 'daniel', 'iloveyou',
        'matthew', 'robert', 'thomas', 'harley', 'ginger', ' Sophie', 'andrew',
        'william', 'cookie', 'donald', 'chocolate', 'hello123', 'whatever', 'summer',
        'joshua', 'pepper', '1234qwer', 'zaq12wsx', 'password123', '1q2w3e4r5t'
    ];
}

if (typeof window.AUTH_BY_PHONE_CODES === 'undefined') {
    window.AUTH_BY_PHONE_CODES = ['25', '29', '33', '44'];
}

if (typeof window.AuthForm === 'undefined') {
    window.AuthForm = class AuthForm {
        constructor() {
            this.currentTab = 'login';
            this.usernameAttempts = 5;
            this.isSubmitting = false;
            this.init();
        }

        init() {
            if (typeof window.apiService === 'undefined') {
                console.error('API Service is not available');
                this.showAPINotAvailableError();
                return;
            }
            
            this.api = window.apiService;
            this.setupEventListeners();
            this.setupPasswordToggle();
            this.setupDateValidation();
            this.setupAgreementModal();
            this.checkExistingAuth();
        }

        showAPINotAvailableError() {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #dc3545;
                color: white;
                padding: 1rem;
                text-align: center;
                z-index: 10000;
                font-family: 'Fira Sans', sans-serif;
            `;
            errorDiv.innerHTML = `
                <strong>${t('auth.errors.connection')}</strong><br>
                ${t('auth.errors.serverUnavailable')}
            `;
            document.body.appendChild(errorDiv);
        }

        checkExistingAuth() {
            if (this.api.isAuthenticated()) {
                const mainPagePath = window.location.pathname.includes('/pages/') 
                    ? 'home.html'  
                    : '../index.html'; 
                    
                setTimeout(() => {
                    window.location.replace(mainPagePath);
                }, 100);
            }
        }

        setupEventListeners() {
            const tabButtons = document.querySelectorAll('.tab-btn');
            if (tabButtons.length > 0) {
                tabButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => this.switchTab(e));
                });
            }

            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            }
            
            if (registerForm) {
                registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            }

            const generateBtn = document.getElementById('generate-username');
            if (generateBtn) {
                generateBtn.addEventListener('click', () => this.generateUsername());
            }

            const passwordRadios = document.querySelectorAll('input[name="password-option"]');
            if (passwordRadios.length > 0) {
                passwordRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => this.togglePasswordOption(e));
                });
            }

            this.setupRealTimeValidation();

            const agreementLink = document.querySelector('.agreement-link');
            if (agreementLink) {
                agreementLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showAgreementModal();
                });
            }

            this.setupModalHandlers();
        }

        setupModalHandlers() {
            const modal = document.getElementById('agreement-modal');
            const agreeBtn = document.getElementById('agree-btn');
            const closeBtn = document.querySelector('.modal-close');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (modal) modal.classList.remove('active');
                });
            }

            if (agreeBtn) {
                agreeBtn.addEventListener('click', () => {
                    const agreementCheckbox = document.getElementById('agreement');
                    if (agreementCheckbox) {
                        agreementCheckbox.checked = true;
                        this.validateAgreement(true);
                    }
                    if (modal) modal.classList.remove('active');
                    this.validateRegisterForm();
                });
            }

            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        }

        switchTab(e) {
            const tab = e.target.dataset.tab;
            if (!tab) return;

            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');

            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
            const targetForm = document.getElementById(`${tab}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
            
            this.currentTab = tab;
        }

        setupPasswordToggle() {
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirm-password');
            
            if (passwordInput && confirmInput) {
                confirmInput.addEventListener('focus', () => {
                    confirmInput.type = 'text';
                });
                
                confirmInput.addEventListener('blur', () => {
                    confirmInput.type = 'password';
                });

                passwordInput.addEventListener('input', (e) => {
                    this.updatePasswordStrength(e.target.value);
                    this.validatePassword(e.target.value);
                });
            }
        }

        setupDateValidation() {
            const birthDateInput = document.getElementById('birth-date');
            
            if (birthDateInput) {
                const today = new Date();
                const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
                const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
                
                birthDateInput.min = minDate.toISOString().split('T')[0];
                birthDateInput.max = maxDate.toISOString().split('T')[0];
                
                birthDateInput.addEventListener('change', (e) => {
                    this.validateBirthDate(e.target.value);
                });
            }
        }

        setupAgreementModal() {
            console.log('Agreement modal setup');
        }

        setupRealTimeValidation() {
            const phoneInput = document.getElementById('phone');
            const loginPhoneInput = document.getElementById('login-phone');

            if (phoneInput) {
                phoneInput.addEventListener('input', (e) => {
                    this.validatePhone(e.target.value, 'phone');
                });
            }

            if (loginPhoneInput) {
                loginPhoneInput.addEventListener('input', (e) => {
                    this.validatePhone(e.target.value, 'login-phone');
                });
            }

            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.addEventListener('input', (e) => {
                    this.validateEmail(e.target.value);
                });
            }

            const lastNameInput = document.getElementById('last-name');
            const firstNameInput = document.getElementById('first-name');
            const middleNameInput = document.getElementById('middle-name');

            if (lastNameInput) {
                lastNameInput.addEventListener('input', (e) => {
                    this.validateName(e.target.value, 'last-name');
                });
            }

            if (firstNameInput) {
                firstNameInput.addEventListener('input', (e) => {
                    this.validateName(e.target.value, 'first-name');
                });
            }

            if (middleNameInput) {
                middleNameInput.addEventListener('input', (e) => {
                    this.validateName(e.target.value, 'middle-name', false);
                });
            }

            const confirmPasswordInput = document.getElementById('confirm-password');
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', (e) => {
                    this.validatePasswordConfirmation(e.target.value);
                });
            }

            const agreementInput = document.getElementById('agreement');
            if (agreementInput) {
                agreementInput.addEventListener('change', (e) => {
                    this.validateAgreement(e.target.checked);
                });
            }

            const registerForm = document.getElementById('register-form');
            if (registerForm) {
                registerForm.querySelectorAll('input').forEach(input => {
                    input.addEventListener('input', () => {
                        this.validateRegisterForm();
                    });
                });
            }
        }

        validatePhone(phone, fieldId) {
            const errorElement = this.getErrorElement(fieldId);
            if (!errorElement) return false;

            const byPhoneRegex = /^\+375\s?(25|29|33|44)\s?\d{3}[-]?\d{2}[-]?\d{2}$/;
            
            if (!phone) {
                this.showError(errorElement, t('auth.validation.phoneRequired'));
                return false;
            }

            if (!byPhoneRegex.test(phone)) {
                this.showError(errorElement, t('auth.validation.phoneFormat'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        validateEmail(email) {
            const errorElement = this.getErrorElement('email');
            if (!errorElement) return false;
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!email) {
                this.showError(errorElement, t('auth.validation.emailRequired'));
                return false;
            }

            if (!emailRegex.test(email)) {
                this.showError(errorElement, t('auth.validation.emailFormat'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        validateName(name, fieldId, required = true) {
            const errorElement = this.getErrorElement(fieldId);
            if (!errorElement) return false;
            
            if (required && !name.trim()) {
                this.showError(errorElement, t('auth.validation.fieldRequired'));
                return false;
            }

            if (name && !/^[а-яА-ЯёЁa-zA-Z\- ]+$/.test(name)) {
                this.showError(errorElement, t('auth.validation.nameFormat'));
                return false;
            }

            if (name && name.length < 2) {
                this.showError(errorElement, t('auth.validation.nameMinLength'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        validateBirthDate(date) {
            const errorElement = this.getErrorElement('birth-date');
            if (!errorElement) return false;
            
            if (!date) {
                this.showError(errorElement, t('auth.validation.birthDateRequired'));
                return false;
            }

            const birthDate = new Date(date);
            const today = new Date();
            const minAgeDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

            if (birthDate > minAgeDate) {
                this.showError(errorElement, t('auth.validation.minAge'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        validatePassword(password) {
            const errorElement = this.getErrorElement('password');
            if (!errorElement) return false;
            
            if (!password) {
                this.showError(errorElement, t('auth.validation.passwordRequired'));
                return false;
            }

            if (password.length < 8) {
                this.showError(errorElement, t('auth.validation.passwordMinLength'));
                return false;
            }

            if (password.length > 20) {
                this.showError(errorElement, t('auth.validation.passwordMaxLength'));
                return false;
            }

            if (!/(?=.*[a-z])/.test(password)) {
                this.showError(errorElement, t('auth.validation.passwordLowercase'));
                return false;
            }

            if (!/(?=.*[A-Z])/.test(password)) {
                this.showError(errorElement, t('auth.validation.passwordUppercase'));
                return false;
            }

            if (!/(?=.*\d)/.test(password)) {
                this.showError(errorElement, t('auth.validation.passwordDigit'));
                return false;
            }

            if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
                this.showError(errorElement, t('auth.validation.passwordSpecial'));
                return false;
            }

            if (window.AUTH_COMMON_PASSWORDS.includes(password.toLowerCase())) {
                this.showError(errorElement, t('auth.validation.passwordCommon'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        validatePasswordConfirmation(confirmPassword) {
            const errorElement = this.getErrorElement('confirm-password');
            if (!errorElement) return false;
            
            const passwordInput = document.getElementById('password');
            if (!passwordInput) return false;
            
            const password = passwordInput.value;
            
            if (!confirmPassword) {
                this.showError(errorElement, t('auth.validation.confirmPasswordRequired'));
                return false;
            }

            if (confirmPassword !== password) {
                this.showError(errorElement, t('auth.validation.passwordsMismatch'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        validateAgreement(checked) {
            const errorElement = this.getErrorElement('agreement');
            if (!errorElement) return false;
            
            if (!checked) {
                this.showError(errorElement, t('auth.validation.agreementRequired'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        updatePasswordStrength(password) {
            const strengthBar = document.querySelector('.strength-bar');
            const requirements = document.querySelectorAll('.password-requirements span');
            
            if (!strengthBar || !requirements) return;

            let strength = 0;

            if (password.length >= 8) strength++;
            if (requirements[0]) {
                requirements[0].className = password.length >= 8 ? 'valid' : 'invalid';
            }

            if (/(?=.*[a-z])/.test(password)) strength++;
            if (requirements[1]) {
                requirements[1].className = /(?=.*[a-z])/.test(password) ? 'valid' : 'invalid';
            }

            if (/(?=.*[A-Z])/.test(password)) strength++;
            if (requirements[2]) {
                requirements[2].className = /(?=.*[A-Z])/.test(password) ? 'valid' : 'invalid';
            }

            if (/(?=.*\d)/.test(password)) strength++;
            if (requirements[3]) {
                requirements[3].className = /(?=.*\d)/.test(password) ? 'valid' : 'invalid';
            }

            if (/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) strength++;
            if (requirements[4]) {
                requirements[4].className = /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password) ? 'valid' : 'invalid';
            }

            if (strength <= 2) {
                strengthBar.className = 'strength-bar weak';
            } else if (strength <= 4) {
                strengthBar.className = 'strength-bar medium';
            } else {
                strengthBar.className = 'strength-bar strong';
            }
        }

        generateUsername() {
            if (this.usernameAttempts <= 0) {
                const usernameInput = document.getElementById('username');
                if (usernameInput) {
                    usernameInput.readOnly = false;
                    usernameInput.placeholder = t('auth.username.enterOwn');
                }
                return;
            }

            const firstNameInput = document.getElementById('first-name');
            const lastNameInput = document.getElementById('last-name');
            const usernameInput = document.getElementById('username');
            
            const firstName = firstNameInput ? firstNameInput.value || 'user' : 'user';
            const lastName = lastNameInput ? lastNameInput.value || '' : '';
            
            const randomNum = Math.floor(Math.random() * 1000);
            const username = `${firstName.toLowerCase()}${lastName.toLowerCase().slice(0, 3)}${randomNum}`;
            
            if (usernameInput) {
                usernameInput.value = username;
            }
            
            this.usernameAttempts--;
            
            const attemptsElement = document.querySelector('.attempts-count');
            if (attemptsElement) {
                attemptsElement.textContent = `(${this.usernameAttempts} ${t('auth.username.attempts')})`;
            }
            
            if (this.usernameAttempts === 0) {
                const generateBtn = document.getElementById('generate-username');
                const usernameInput = document.getElementById('username');
                
                if (generateBtn) generateBtn.disabled = true;
                if (usernameInput) {
                    usernameInput.readOnly = false;
                    usernameInput.placeholder = t('auth.username.enterOwn');
                }
            }
            
            this.validateUsername(username);
        }

        validateUsername(username) {
            const errorElement = this.getErrorElement('username');
            if (!errorElement) return false;
            
            if (!username) {
                this.showError(errorElement, t('auth.validation.usernameRequired'));
                return false;
            }

            if (username.length < 3) {
                this.showError(errorElement, t('auth.validation.usernameMinLength'));
                return false;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                this.showError(errorElement, t('auth.validation.usernameFormat'));
                return false;
            }

            this.hideError(errorElement);
            return true;
        }

        togglePasswordOption(e) {
            const manualSection = document.querySelector('.manual-password');
            const autoSection = document.querySelector('.auto-password');
            
            if (e.target.value === 'manual') {
                if (manualSection) manualSection.style.display = 'block';
                if (autoSection) autoSection.style.display = 'none';
            } else {
                if (manualSection) manualSection.style.display = 'none';
                if (autoSection) autoSection.style.display = 'block';
                this.generateAutoPassword();
            }
            
            this.validateRegisterForm();
        }

        generateAutoPassword() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
            let password = '';
            
            for (let i = 0; i < 12; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const passwordText = document.getElementById('generated-password-text');
            if (passwordText) {
                passwordText.textContent = password;
            }
        }

        validateRegisterForm() {
            const registerBtn = document.getElementById('register-btn');
            if (!registerBtn) return false;

            let isValid = true;

            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
                isValid = this.validatePhone(phoneInput.value, 'phone') && isValid;
            }

            const emailInput = document.getElementById('email');
            if (emailInput) {
                isValid = this.validateEmail(emailInput.value) && isValid;
            }

            const lastNameInput = document.getElementById('last-name');
            if (lastNameInput) {
                isValid = this.validateName(lastNameInput.value, 'last-name') && isValid;
            }

            const firstNameInput = document.getElementById('first-name');
            if (firstNameInput) {
                isValid = this.validateName(firstNameInput.value, 'first-name') && isValid;
            }

            const birthDateInput = document.getElementById('birth-date');
            if (birthDateInput) {
                isValid = this.validateBirthDate(birthDateInput.value) && isValid;
            }

            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                isValid = this.validateUsername(usernameInput.value) && isValid;
            }

            const agreementInput = document.getElementById('agreement');
            if (agreementInput) {
                isValid = this.validateAgreement(agreementInput.checked) && isValid;
            }

            const passwordOption = document.querySelector('input[name="password-option"]:checked');
            if (passwordOption && passwordOption.value === 'manual') {
                const passwordInput = document.getElementById('password');
                const confirmInput = document.getElementById('confirm-password');
                
                if (passwordInput) {
                    isValid = this.validatePassword(passwordInput.value) && isValid;
                }
                
                if (confirmInput) {
                    isValid = this.validatePasswordConfirmation(confirmInput.value) && isValid;
                }
            }

            registerBtn.disabled = !isValid;
            return isValid;
        }

        async handleLogin(e) {
            e.preventDefault();
            
            if (this.isSubmitting) return;
            this.isSubmitting = true;

            const loginBtn = e.target.querySelector('.auth-btn');
            const originalText = loginBtn ? loginBtn.textContent : t('auth.login.submit');
            
            if (loginBtn) {
                loginBtn.textContent = t('auth.login.submitting');
                loginBtn.disabled = true;
            }

            const phoneInput = document.getElementById('login-phone');
            const passwordInput = document.getElementById('login-password');
            
            if (!phoneInput || !passwordInput) {
                this.isSubmitting = false;
                if (loginBtn) {
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                }
                return;
            }

            const phone = phoneInput.value;
            const password = passwordInput.value;
            
            if (!this.validatePhone(phone, 'login-phone')) {
                this.isSubmitting = false;
                if (loginBtn) {
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                }
                return;
            }

            try {
                const user = await this.api.login({
                    login: phone,
                    password: password
                });

                console.log('Login successful, user:', user);
                console.log('Current path:', window.location.pathname);
                
                this.showNotification(t('auth.login.success'), 'success');

                const redirectPath = window.location.pathname.includes('/pages/') 
                    ? 'home.html'
                    : '../index.html';
                console.log('Redirecting to:', redirectPath);
                
                setTimeout(() => {
                    window.location.replace(redirectPath);
                }, 1000);

            } catch (error) {
                this.showNotification(error.message || t('auth.login.error'), 'error');
                this.isSubmitting = false;
                if (loginBtn) {
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                }
            }
        }

        async handleRegister(e) {
            e.preventDefault();
            
            if (this.isSubmitting) return;
            this.isSubmitting = true;

            const registerBtn = e.target.querySelector('.auth-btn');
            const originalText = registerBtn ? registerBtn.textContent : t('auth.register.submit');
            
            if (registerBtn) {
                registerBtn.textContent = t('auth.register.submitting');
                registerBtn.disabled = true;
            }

            if (!this.validateRegisterForm()) {
                this.isSubmitting = false;
                if (registerBtn) {
                    registerBtn.textContent = originalText;
                    registerBtn.disabled = false;
                }
                return;
            }

            try {
                const formData = {
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: document.querySelector('input[name="password-option"]:checked').value === 'manual' 
                        ? document.getElementById('password').value 
                        : document.getElementById('generated-password-text').textContent,
                    firstName: document.getElementById('first-name').value,
                    lastName: document.getElementById('last-name').value,
                    middleName: document.getElementById('middle-name').value || '',
                    birthDate: document.getElementById('birth-date').value,
                    username: document.getElementById('username').value
                };

                const user = await this.api.register(formData);
                
                this.showNotification(t('auth.register.success'), 'success');

                e.stopImmediatePropagation();

                if (typeof window.updateAuthUI === 'function') {
                    window.updateAuthUI(user);
                }

                setTimeout(() => {
                    window.location.replace('home.html');
                }, 1000);

            } catch (error) {
                this.showNotification(error.message || t('auth.register.error'), 'error');
                this.isSubmitting = false;
                if (registerBtn) {
                    registerBtn.textContent = originalText;
                    registerBtn.disabled = false;
                }
            }
        }

        showAgreementModal() {
            const modal = document.getElementById('agreement-modal');
            if (modal) {
                modal.classList.add('active');
            }
        }

        getErrorElement(fieldId) {
            const field = document.getElementById(fieldId);
            if (!field) return null;
            
            const formGroup = field.closest('.form-group');
            if (!formGroup) return null;
            
            return formGroup.querySelector('.error-message');
        }

        showError(element, message) {
            if (!element) return;
            
            element.textContent = message;
            const input = element.previousElementSibling;
            if (input) {
                input.classList.add('error');
                input.classList.remove('success');
            }
        }

        hideError(element) {
            if (!element) return;
            
            element.textContent = '';
            const input = element.previousElementSibling;
            if (input) {
                input.classList.remove('error');
                input.classList.add('success');
            }
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
                transform: translateX(100%);
                transition: transform 0.3s ease;
                font-family: 'Fira Sans', sans-serif;
            `;
            
            if (type === 'success') {
                notification.style.background = '#28a745';
            } else if (type === 'error') {
                notification.style.background = '#dc3545';
            } else {
                notification.style.background = '#2196F3';
            }
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.authFormInitialized) {
        return;
    }
    
    window.authFormInitialized = true;

    setTimeout(() => {
        try {
            if (typeof window.AuthForm !== 'undefined') {
                new window.AuthForm();
            } else {
                console.error('AuthForm class is not defined');
            }
        } catch (error) {
            console.error('Failed to initialize AuthForm:', error);
        }
    }, 100);
});