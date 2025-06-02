import { apiClient } from '../utils/ApiClient.js';

export class AuthScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AuthScene' });
        this.currentMode = 'login'; // 'login' o 'register'
        this.isLoading = false;
    }

    preload() {
        // Crear gráficos simples para la UI
        this.load.image('button', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    }

    create() {
        // Fondo
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // Título
        this.add.text(640, 150, '🎮 DOFUS GAME', {
            fontSize: '48px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Contenedor principal
        this.createLoginForm();
        this.createRegisterForm();
        
        // Mostrar formulario de login por defecto
        this.showLoginForm();

        // Verificar si ya está autenticado
        this.checkAuthentication();
    }

    createLoginForm() {
        this.loginContainer = this.add.container(640, 360);

        // Título del formulario
        const loginTitle = this.add.text(0, -150, 'INICIAR SESIÓN', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Campos de entrada
        this.loginUsernameInput = this.createInputField(-200, -80, 400, 'Usuario o Email');
        this.loginPasswordInput = this.createInputField(-200, -20, 400, 'Contraseña', true);

        // Botones
        const loginButton = this.createButton(0, 40, 200, 50, 'ENTRAR', 0x4CAF50, () => this.handleLogin());
        const switchToRegisterButton = this.createButton(0, 100, 200, 40, 'Crear cuenta', 0x2196F3, () => this.showRegisterForm());

        // Mensaje de error
        this.loginErrorText = this.add.text(0, 160, '', {
            fontSize: '16px',
            fill: '#ff4444',
            fontFamily: 'Arial',
            wordWrap: { width: 400 }
        }).setOrigin(0.5);

        this.loginContainer.add([
            loginTitle,
            this.loginUsernameInput.background,
            this.loginUsernameInput.text,
            this.loginPasswordInput.background,
            this.loginPasswordInput.text,
            loginButton,
            switchToRegisterButton,
            this.loginErrorText
        ]);
    }

    createRegisterForm() {
        this.registerContainer = this.add.container(640, 360);

        // Título del formulario
        const registerTitle = this.add.text(0, -180, 'CREAR CUENTA', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Campos de entrada
        this.registerUsernameInput = this.createInputField(-200, -120, 400, 'Nombre de usuario');
        this.registerEmailInput = this.createInputField(-200, -70, 400, 'Email');
        this.registerPasswordInput = this.createInputField(-200, -20, 400, 'Contraseña', true);
        this.registerConfirmPasswordInput = this.createInputField(-200, 30, 400, 'Confirmar contraseña', true);

        // Botones
        const registerButton = this.createButton(0, 90, 200, 50, 'REGISTRARSE', 0x4CAF50, () => this.handleRegister());
        const switchToLoginButton = this.createButton(0, 150, 200, 40, 'Ya tengo cuenta', 0x2196F3, () => this.showLoginForm());

        // Mensaje de error
        this.registerErrorText = this.add.text(0, 200, '', {
            fontSize: '16px',
            fill: '#ff4444',
            fontFamily: 'Arial',
            wordWrap: { width: 400 }
        }).setOrigin(0.5);

        this.registerContainer.add([
            registerTitle,
            this.registerUsernameInput.background,
            this.registerUsernameInput.text,
            this.registerEmailInput.background,
            this.registerEmailInput.text,
            this.registerPasswordInput.background,
            this.registerPasswordInput.text,
            this.registerConfirmPasswordInput.background,
            this.registerConfirmPasswordInput.text,
            registerButton,
            switchToLoginButton,
            this.registerErrorText
        ]);
    }

    createInputField(x, y, width, placeholder, isPassword = false) {
        const background = this.add.rectangle(x + width/2, y, width, 40, 0x333333)
            .setStrokeStyle(2, 0x555555);

        const text = this.add.text(x + 10, y, placeholder, {
            fontSize: '16px',
            fill: '#888888',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5);

        const input = {
            background,
            text,
            value: '',
            placeholder,
            isPassword,
            isFocused: false
        };

        // Hacer el campo clickeable
        background.setInteractive();
        background.on('pointerdown', () => this.focusInput(input));

        return input;
    }

    createButton(x, y, width, height, text, color, callback) {
        const button = this.add.rectangle(x, y, width, height, color)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive();

        const buttonText = this.add.text(x, y, text, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        button.on('pointerdown', callback);
        button.on('pointerover', () => button.setFillStyle(Phaser.Display.Color.GetColor(color) + 0x222222));
        button.on('pointerout', () => button.setFillStyle(color));

        return this.add.container(0, 0, [button, buttonText]);
    }

    focusInput(input) {
        // Simular focus - en un juego real usarías DOM inputs
        if (input.value === '' && input.text.text === input.placeholder) {
            input.text.setText('');
            input.text.setColor('#ffffff');
        }
        
        // Crear un prompt simple para entrada de texto
        const value = prompt(input.placeholder + ':');
        if (value !== null) {
            input.value = value;
            input.text.setText(input.isPassword ? '*'.repeat(value.length) : value);
            input.text.setColor('#ffffff');
        }
    }

    showLoginForm() {
        this.currentMode = 'login';
        this.loginContainer.setVisible(true);
        this.registerContainer.setVisible(false);
        this.clearErrors();
    }

    showRegisterForm() {
        this.currentMode = 'register';
        this.loginContainer.setVisible(false);
        this.registerContainer.setVisible(true);
        this.clearErrors();
    }

    clearErrors() {
        this.loginErrorText.setText('');
        this.registerErrorText.setText('');
    }

    async handleLogin() {
        if (this.isLoading) return;

        const username = this.loginUsernameInput.value;
        const password = this.loginPasswordInput.value;

        if (!username || !password) {
            this.loginErrorText.setText('Por favor completa todos los campos');
            return;
        }

        this.isLoading = true;
        this.loginErrorText.setText('Iniciando sesión...');

        try {
            const response = await apiClient.login(username, password);
            console.log('Login exitoso:', response);
            
            // Ir a la escena de exploración (por ahora)
            this.scene.start('ExplorationMap', { user: response.user });
        } catch (error) {
            this.loginErrorText.setText(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async handleRegister() {
        if (this.isLoading) return;

        const username = this.registerUsernameInput.value;
        const email = this.registerEmailInput.value;
        const password = this.registerPasswordInput.value;
        const confirmPassword = this.registerConfirmPasswordInput.value;

        if (!username || !email || !password || !confirmPassword) {
            this.registerErrorText.setText('Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            this.registerErrorText.setText('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            this.registerErrorText.setText('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        this.isLoading = true;
        this.registerErrorText.setText('Creando cuenta...');

        try {
            const response = await apiClient.register(username, email, password);
            console.log('Registro exitoso:', response);
            
            // Ir a la escena de exploración (por ahora)
            this.scene.start('ExplorationMap', { user: response.user });
        } catch (error) {
            this.registerErrorText.setText(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async checkAuthentication() {
        try {
            const user = await apiClient.verifyToken();
            if (user) {
                console.log('Usuario ya autenticado:', user);
                this.scene.start('ExplorationMap', { user });
            }
        } catch (error) {
            console.log('No hay sesión activa');
        }
    }
}
