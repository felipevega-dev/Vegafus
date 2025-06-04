import { APP_CONFIG, API_ENDPOINTS, UI_MESSAGES } from '../config/constants.js';

/**
 * Cliente para comunicarse con el backend API
 */
export class ApiClient {
    constructor() {
        this.baseURL = APP_CONFIG.API_BASE_URL;
        this.token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        this.timeout = APP_CONFIG.REQUEST_TIMEOUT;
    }

    /**
     * Realizar petición HTTP con timeout y manejo de errores mejorado
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            signal: AbortSignal.timeout(this.timeout),
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
                // Manejar errores específicos
                if (response.status === 401) {
                    this.clearToken();
                    throw new Error(UI_MESSAGES.ERROR.INVALID_CREDENTIALS);
                }

                if (response.status === 404) {
                    throw new Error(UI_MESSAGES.ERROR.CHARACTER_NOT_FOUND);
                }

                throw new Error(data.message || UI_MESSAGES.ERROR.GENERIC);
            }

            // Verificar formato de respuesta estandarizado
            if (data.success === false) {
                throw new Error(data.message || UI_MESSAGES.ERROR.GENERIC);
            }

            return data;
        } catch (error) {
            if (error.name === 'TimeoutError') {
                throw new Error(UI_MESSAGES.ERROR.NETWORK);
            }

            console.error('Error en API:', error);
            throw error;
        }
    }

    /**
     * Registrar nuevo usuario
     */
    async register(username, email, password) {
        const data = await this.request(API_ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        if (data.data?.token) {
            this.setToken(data.data.token);
        }

        return data;
    }

    /**
     * Iniciar sesión
     */
    async login(username, password) {
        const data = await this.request(API_ENDPOINTS.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.data?.token) {
            this.setToken(data.data.token);
        }

        return data;
    }

    /**
     * Verificar token
     */
    async verifyToken() {
        if (!this.token) return null;

        try {
            const data = await this.request(API_ENDPOINTS.AUTH.VERIFY);
            return data.data?.user;
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
            await this.request(API_ENDPOINTS.AUTH.LOGOUT, { method: 'POST' });
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
        const response = await this.request(API_ENDPOINTS.CHARACTERS.GET_ALL);
        return response.data || response;
    }

    /**
     * Crear nuevo personaje
     */
    async createCharacter(name, characterClass) {
        const response = await this.request(API_ENDPOINTS.CHARACTERS.CREATE, {
            method: 'POST',
            body: JSON.stringify({ name, class: characterClass })
        });
        return response.data || response;
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
     * Eliminar personaje
     */
    async deleteCharacter(characterId) {
        const response = await this.request(API_ENDPOINTS.CHARACTERS.DELETE(characterId), {
            method: 'DELETE'
        });
        return response.data || response; // Compatibilidad con formato anterior
    }

    /**
     * Cargar datos del juego
     */
    async loadGame(characterId) {
        return await this.request(`/game/load-game/${characterId}`);
    }

    // ===== MÉTODOS DE ITEMS =====

    /**
     * Obtener todos los items
     */
    async getItems() {
        return await this.request('/items');
    }

    /**
     * Obtener item específico
     */
    async getItem(itemId) {
        return await this.request(`/items/${itemId}`);
    }

    /**
     * Obtener items por tipo
     */
    async getItemsByType(type) {
        return await this.request(`/items/type/${type}`);
    }

    /**
     * Obtener items por rareza
     */
    async getItemsByRarity(rarity) {
        return await this.request(`/items/rarity/${rarity}`);
    }

    // ===== MÉTODOS DE INVENTARIO =====

    /**
     * Obtener inventario del personaje
     */
    async getInventory(characterId) {
        return await this.request(`/inventory/${characterId}`);
    }

    /**
     * Agregar item al inventario
     */
    async addItemToInventory(characterId, itemId, quantity = 1) {
        return await this.request(`/inventory/${characterId}/items`, {
            method: 'POST',
            body: JSON.stringify({ itemId, quantity })
        });
    }

    /**
     * Remover item del inventario
     */
    async removeItemFromInventory(characterId, itemId, quantity = 1) {
        return await this.request(`/inventory/${characterId}/items/${itemId}`, {
            method: 'DELETE',
            body: JSON.stringify({ quantity })
        });
    }

    /**
     * Agregar kamas al personaje
     */
    async addKamas(characterId, amount) {
        return await this.request(`/inventory/${characterId}/kamas`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    }

    /**
     * Gastar kamas
     */
    async spendKamas(characterId, amount) {
        return await this.request(`/inventory/${characterId}/kamas/spend`, {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    }

    /**
     * Aplicar drops de combate
     */
    async applyDrops(characterId, drops) {
        return await this.request(`/inventory/${characterId}/drops`, {
            method: 'POST',
            body: JSON.stringify({ drops })
        });
    }

    /**
     * Establecer token de autenticación
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
    }

    /**
     * Limpiar token de autenticación
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem('token'); // Limpiar token legacy por compatibilidad
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
