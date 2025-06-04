/**
 * Constantes y configuración centralizada del proyecto
 */

// Configuración de la aplicación
const APP_CONFIG = {
    NAME: 'Dofus Game Backend',
    VERSION: '1.0.0',
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // URLs y endpoints
    FRONTEND_URL: process.env.FRONTEND_URL,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dofus-game',
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    JWT_EXPIRES_IN: '7d',
    
    // Límites de la aplicación
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
};

// Tipos de datos válidos
const VALID_TYPES = {
    CHARACTER_CLASSES: ['mage', 'warrior', 'archer'],
    ITEM_TYPES: ['resource', 'equipment', 'consumable'],
    ITEM_RARITIES: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    EQUIPMENT_SLOTS: ['helmet', 'armor', 'weapon', 'boots', 'ring', 'amulet'],
    CHARACTERISTICS: ['tierra', 'fuego', 'agua', 'aire', 'vida', 'sabiduria'],
    RESISTANCES: ['tierra', 'fuego', 'agua', 'aire'],
    SPELL_ELEMENTS: ['tierra', 'fuego', 'agua', 'aire'],
};

// Mensajes de respuesta estandarizados
const RESPONSE_MESSAGES = {
    // Éxito
    SUCCESS: {
        USER_REGISTERED: 'Usuario registrado exitosamente',
        USER_LOGGED_IN: 'Inicio de sesión exitoso',
        USER_LOGGED_OUT: 'Logout exitoso',
        TOKEN_VALID: 'Token válido',
        
        CHARACTER_CREATED: 'Personaje creado exitosamente',
        CHARACTER_UPDATED: 'Personaje actualizado exitosamente',
        CHARACTER_DELETED: 'Personaje eliminado exitosamente',
        CHARACTER_FOUND: 'Personaje obtenido exitosamente',
        CHARACTERS_FOUND: 'Personajes obtenidos exitosamente',
        
        POINTS_DISTRIBUTED: 'Puntos distribuidos exitosamente',
        PROGRESS_SAVED: 'Progreso guardado exitosamente',
        
        INVENTORY_UPDATED: 'Inventario actualizado exitosamente',
        EQUIPMENT_UPDATED: 'Equipamiento actualizado exitosamente',
        
        ITEMS_FOUND: 'Items obtenidos exitosamente',
    },
    
    // Errores de validación
    VALIDATION: {
        REQUIRED_FIELDS: 'Todos los campos requeridos deben ser proporcionados',
        INVALID_EMAIL: 'El formato del email es inválido',
        INVALID_CHARACTER_CLASS: 'Clase de personaje inválida',
        INVALID_ITEM_TYPE: 'Tipo de item inválido',
        INVALID_CHARACTERISTIC: 'Característica inválida',
        INSUFFICIENT_POINTS: 'No tienes suficientes puntos disponibles',
        MAX_CHARACTERS_REACHED: 'Has alcanzado el límite máximo de personajes',
        INVALID_LEVEL: 'Nivel inválido',
        INVALID_EXPERIENCE: 'Experiencia inválida',
    },
    
    // Errores de autenticación
    AUTH: {
        TOKEN_REQUIRED: 'Token de autenticación requerido',
        TOKEN_INVALID: 'Token inválido o expirado',
        USER_NOT_FOUND: 'Usuario no encontrado',
        USER_INACTIVE: 'Usuario inactivo',
        INVALID_CREDENTIALS: 'Credenciales inválidas',
        USER_EXISTS: 'El usuario o email ya existe',
        ACCESS_DENIED: 'Acceso denegado',
    },
    
    // Errores de recursos
    RESOURCE: {
        CHARACTER_NOT_FOUND: 'Personaje no encontrado',
        ITEM_NOT_FOUND: 'Item no encontrado',
        INVENTORY_FULL: 'Inventario lleno',
        INSUFFICIENT_KAMAS: 'Kamas insuficientes',
    },
    
    // Errores del servidor
    SERVER: {
        INTERNAL_ERROR: 'Error interno del servidor',
        DATABASE_ERROR: 'Error de base de datos',
        VALIDATION_ERROR: 'Error de validación',
        NOT_FOUND: 'Recurso no encontrado',
        FORBIDDEN: 'Operación no permitida en producción',
    }
};

// Códigos de estado HTTP
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
};

// Configuración de CORS
const CORS_CONFIG = {
    ALLOWED_ORIGINS: [
        'http://localhost:8080',
        'http://localhost:8083',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8083',
        'http://127.0.0.1:3001',
        process.env.FRONTEND_URL
    ].filter(Boolean),
};

module.exports = {
    APP_CONFIG,
    VALID_TYPES,
    RESPONSE_MESSAGES,
    HTTP_STATUS,
    CORS_CONFIG,
};
