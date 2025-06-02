import { apiClient } from '../utils/ApiClient.js';

export class AuthSceneHTML extends Phaser.Scene {
    constructor() {
        super({ key: 'AuthSceneHTML' });
        this.isLoading = false;
    }

    preload() {
        // No necesitamos cargar assets para esta escena
    }

    create() {
        // Fondo simple para Phaser
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // Mostrar el overlay HTML
        this.showAuthOverlay();

        // Configurar eventos HTML
        this.setupHTMLEvents();

        // Verificar si ya está autenticado
        this.checkAuthentication();
    }

    showAuthOverlay() {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideAuthOverlay() {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    setupHTMLEvents() {
        // Elementos del DOM
        const loginForm = document.getElementById('login-form-element');
        const registerForm = document.getElementById('register-form-element');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');

        // Formulario de login
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Formulario de registro
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Cambiar entre formularios
        if (switchToRegister) {
            switchToRegister.addEventListener('click', () => {
                this.showRegisterForm();
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', () => {
                this.showLoginForm();
            });
        }
    }

    showLoginForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.classList.remove('hidden');
        if (registerForm) registerForm.classList.add('hidden');
        
        this.clearErrors();
    }

    showRegisterForm() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) loginForm.classList.add('hidden');
        if (registerForm) registerForm.classList.remove('hidden');
        
        this.clearErrors();
    }

    clearErrors() {
        const loginError = document.getElementById('login-error');
        const registerError = document.getElementById('register-error');
        
        if (loginError) loginError.textContent = '';
        if (registerError) registerError.textContent = '';
    }

    showError(formType, message) {
        const errorElement = document.getElementById(`${formType}-error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    async handleLogin() {
        if (this.isLoading) return;

        const username = document.getElementById('login-username')?.value;
        const password = document.getElementById('login-password')?.value;

        if (!username || !password) {
            this.showError('login', 'Por favor completa todos los campos');
            return;
        }

        this.isLoading = true;
        this.showError('login', 'Iniciando sesión...');

        try {
            const response = await apiClient.login(username, password);
            console.log('Login exitoso:', response);
            
            // Ocultar overlay y ir a selección de personajes
            this.hideAuthOverlay();
            this.scene.start('CharacterSelectionScene', { userData: response.user });
        } catch (error) {
            this.showError('login', error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async handleRegister() {
        if (this.isLoading) return;

        const username = document.getElementById('register-username')?.value;
        const email = document.getElementById('register-email')?.value;
        const password = document.getElementById('register-password')?.value;
        const confirmPassword = document.getElementById('register-confirm-password')?.value;

        if (!username || !email || !password || !confirmPassword) {
            this.showError('register', 'Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('register', 'Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            this.showError('register', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Validación básica de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('register', 'Por favor ingresa un email válido');
            return;
        }

        this.isLoading = true;
        this.showError('register', 'Creando cuenta...');

        try {
            const response = await apiClient.register(username, email, password);
            console.log('Registro exitoso:', response);
            
            // Ocultar overlay y ir a selección de personajes
            this.hideAuthOverlay();
            this.scene.start('CharacterSelectionScene', { userData: response.user });
        } catch (error) {
            this.showError('register', error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async checkAuthentication() {
        try {
            const user = await apiClient.verifyToken();
            if (user) {
                console.log('Usuario ya autenticado:', user);
                this.hideAuthOverlay();
                this.scene.start('CharacterSelectionScene', { userData: user });
            }
        } catch (error) {
            console.log('No hay sesión activa');
            // Mostrar formulario de login por defecto
            this.showLoginForm();
        }
    }

    // Limpiar eventos cuando se destruye la escena
    destroy() {
        this.hideAuthOverlay();
        super.destroy();
    }
}
