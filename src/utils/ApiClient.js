/**
 * Cliente para comunicarse con el backend API
 */
export class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Realizar petición HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Agregar token de autenticación si existe
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('Error en API:', error);
            throw error;
        }
    }

    /**
     * Registrar nuevo usuario
     */
    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    /**
     * Iniciar sesión
     */
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    /**
     * Verificar token
     */
    async verifyToken() {
        if (!this.token) return null;

        try {
            const data = await this.request('/auth/verify');
            return data.user;
        } catch (error) {
            this.clearToken();
            return null;
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            this.clearToken();
        }
    }

    /**
     * Obtener personajes del usuario
     */
    async getCharacters() {
        return await this.request('/characters');
    }

    /**
     * Crear nuevo personaje
     */
    async createCharacter(name, characterClass) {
        return await this.request('/characters', {
            method: 'POST',
            body: JSON.stringify({ name, class: characterClass })
        });
    }

    /**
     * Obtener personaje específico
     */
    async getCharacter(characterId) {
        return await this.request(`/characters/${characterId}`);
    }

    /**
     * Guardar progreso del juego
     */
    async saveProgress(characterId, gameData) {
        return await this.request(`/characters/${characterId}`, {
            method: 'PUT',
            body: JSON.stringify(gameData)
        });
    }

    /**
     * Cargar datos del juego
     */
    async loadGame(characterId) {
        return await this.request(`/game/load-game/${characterId}`);
    }

    /**
     * Establecer token de autenticación
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    /**
     * Limpiar token de autenticación
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return !!this.token;
    }
}

// Instancia global del cliente API
export const apiClient = new ApiClient();
