/**
 * Configuración centralizada del frontend
 */

// Configuración de la aplicación
export const APP_CONFIG = {
    NAME: 'Dofus Game',
    VERSION: '1.0.0',
    
    // URLs del backend
    API_BASE_URL: 'http://localhost:3000/api',
    
    // Configuración del juego
    GAME_WIDTH: 1280,
    GAME_HEIGHT: 720,
    
    // Límites del juego
    MAX_CHARACTERS_PER_USER: 5,
    MAX_LEVEL: 200,
    MAX_INVENTORY_SIZE: 100,
    
    // Configuración de combate
    BASE_HP: 100,
    BASE_MOVEMENT_POINTS: 3,
    BASE_ACTION_POINTS: 6,
    
    // Configuración de progresión
    CAPITAL_POINTS_PER_LEVEL: 5,
    SPELL_POINTS_PER_LEVEL: 1,
    INITIAL_CAPITAL_POINTS: 10,
    INITIAL_SPELL_POINTS: 1,
    
    // Configuración de experiencia
    EXP_PER_LEVEL_MULTIPLIER: 200, // level * 200 = exp needed
    
    // Configuración de localStorage
    STORAGE_KEYS: {
        AUTH_TOKEN: 'authToken',
        USER_DATA: 'userData',
        SELECTED_CHARACTER_ID: 'selectedCharacterId',
        GAME_SETTINGS: 'gameSettings'
    },
    
    // Timeouts y delays
    REQUEST_TIMEOUT: 10000, // 10 segundos
    ANIMATION_DURATION: 300,
    TURN_TIMER: 30000, // 30 segundos por turno
};

// Tipos de datos válidos
export const VALID_TYPES = {
    CHARACTER_CLASSES: ['mage', 'warrior', 'archer'],
    ITEM_TYPES: ['resource', 'equipment', 'consumable'],
    ITEM_RARITIES: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    EQUIPMENT_SLOTS: ['helmet', 'armor', 'weapon', 'boots', 'ring', 'amulet'],
    CHARACTERISTICS: ['tierra', 'fuego', 'agua', 'aire', 'vida', 'sabiduria'],
    RESISTANCES: ['tierra', 'fuego', 'agua', 'aire'],
    SPELL_ELEMENTS: ['tierra', 'fuego', 'agua', 'aire'],
};

// URLs de las APIs
export const API_ENDPOINTS = {
    // Autenticación
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/verify'
    },
    
    // Personajes
    CHARACTERS: {
        BASE: '/characters',
        GET_ALL: '/characters',
        GET_BY_ID: (id) => `/characters/${id}`,
        CREATE: '/characters',
        UPDATE: (id) => `/characters/${id}`,
        DELETE: (id) => `/characters/${id}`,
        DISTRIBUTE_POINTS: (id) => `/characters/${id}/distribute-points`,
        FIX_POINTS: (id) => `/characters/${id}/fix-points`,
        FORCE_LEVELUP: (id) => `/characters/${id}/force-levelup`
    },
    
    // Items
    ITEMS: {
        BASE: '/items',
        GET_ALL: '/items',
        GET_BY_ID: (id) => `/items/${id}`,
        GET_BY_TYPE: (type) => `/items/type/${type}`,
        INITIALIZE: '/items/initialize'
    },
    
    // Inventario
    INVENTORY: {
        GET: (characterId) => `/inventory/${characterId}`,
        ADD_KAMAS: (characterId) => `/inventory/${characterId}/kamas`,
        SPEND_KAMAS: (characterId) => `/inventory/${characterId}/kamas/spend`,
        ADD_DROPS: (characterId) => `/inventory/${characterId}/drops`
    },
    
    // Equipamiento
    EQUIPMENT: {
        GET: (characterId) => `/equipment/${characterId}`,
        EQUIP: (characterId) => `/equipment/${characterId}/equip`,
        UNEQUIP: (characterId) => `/equipment/${characterId}/unequip`,
        GET_STATS: (characterId) => `/equipment/${characterId}/stats`
    },
    
    // Juego
    GAME: {
        SAVE_PROGRESS: '/game/save-progress',
        LOAD_GAME: (characterId) => `/game/load-game/${characterId}`,
        SERVER_STATS: '/game/server-stats'
    }
};

// Mensajes de la UI
export const UI_MESSAGES = {
    // Éxito
    SUCCESS: {
        LOGIN: 'Inicio de sesión exitoso',
        LOGOUT: 'Sesión cerrada exitosamente',
        CHARACTER_CREATED: 'Personaje creado exitosamente',
        CHARACTER_DELETED: 'Personaje eliminado exitosamente',
        PROGRESS_SAVED: 'Progreso guardado exitosamente',
        POINTS_DISTRIBUTED: 'Puntos distribuidos exitosamente'
    },
    
    // Errores
    ERROR: {
        NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
        INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos',
        CHARACTER_NOT_FOUND: 'Personaje no encontrado',
        INSUFFICIENT_POINTS: 'No tienes suficientes puntos disponibles',
        MAX_CHARACTERS: 'Has alcanzado el límite máximo de personajes',
        GENERIC: 'Ha ocurrido un error inesperado'
    },
    
    // Confirmaciones
    CONFIRM: {
        DELETE_CHARACTER: '¿Estás seguro de que quieres eliminar este personaje?',
        LOGOUT: '¿Estás seguro de que quieres cerrar sesión?',
        RESET_POINTS: '¿Estás seguro de que quieres resetear los puntos?'
    },
    
    // Loading
    LOADING: {
        AUTHENTICATING: 'Autenticando...',
        LOADING_CHARACTERS: 'Cargando personajes...',
        CREATING_CHARACTER: 'Creando personaje...',
        SAVING_PROGRESS: 'Guardando progreso...',
        LOADING_GAME: 'Cargando juego...'
    }
};

// Configuración de colores para elementos
export const COLORS = {
    // Elementos
    TIERRA: '#8B4513',
    FUEGO: '#FF4500',
    AGUA: '#1E90FF',
    AIRE: '#32CD32',
    VIDA: '#FF69B4',
    SABIDURIA: '#9370DB',
    
    // UI
    PRIMARY: '#2C3E50',
    SECONDARY: '#3498DB',
    SUCCESS: '#27AE60',
    WARNING: '#F39C12',
    DANGER: '#E74C3C',
    INFO: '#17A2B8',
    
    // Raridades de items
    COMMON: '#FFFFFF',
    UNCOMMON: '#1EFF00',
    RARE: '#0070DD',
    EPIC: '#A335EE',
    LEGENDARY: '#FF8000'
};

// Configuración de assets
export const ASSETS = {
    IMAGES: {
        UI: {
            BACKGROUND: 'assets/images/ui/background.png',
            PANEL_BOTTOM: 'assets/images/ui/panelabajo.png',
            PANEL_RIGHT: 'assets/images/ui/panelderecho.png',
            MENU_VERTICAL: 'assets/images/ui/menuvertical.png',
            INVENTORY_OPEN: 'assets/images/ui/inventarioabirto.png'
        },
        CHARACTERS: {
            MAGE: 'assets/images/characters/mage.png',
            WARRIOR: 'assets/images/characters/warrior.png',
            ARCHER: 'assets/images/characters/archer.png'
        },
        SPELL_ICONS: {
            BASE_PATH: 'assets/images/ui/spell-icons/'
        }
    },
    
    MAPS: {
        EXPLORATION: 'assets/maps/exploration-map.json',
        COMBAT: 'assets/maps/combat-map.json'
    }
};

// Configuración de desarrollo
export const DEV_CONFIG = {
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    ENABLE_CONSOLE_LOGS: process.env.NODE_ENV === 'development',
    MOCK_API_DELAY: 500, // ms
    ENABLE_DEV_TOOLS: process.env.NODE_ENV === 'development'
};

// Exportar todo como default también para compatibilidad
export default {
    APP_CONFIG,
    VALID_TYPES,
    API_ENDPOINTS,
    UI_MESSAGES,
    COLORS,
    ASSETS,
    DEV_CONFIG
};
