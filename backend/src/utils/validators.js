/**
 * Validadores centralizados para el proyecto
 */
const { VALID_TYPES, APP_CONFIG, RESPONSE_MESSAGES } = require('../config/constants');

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validar que los campos requeridos estén presentes
 * @param {Object} data - Datos a validar
 * @param {Array} requiredFields - Campos requeridos
 * @returns {Array} - Array de errores (vacío si no hay errores)
 */
const validateRequiredFields = (data, requiredFields) => {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`El campo '${field}' es requerido`);
        }
    });
    
    return errors;
};

/**
 * Validar datos de registro de usuario
 * @param {Object} userData - Datos del usuario
 * @returns {Array} - Array de errores
 */
const validateUserRegistration = (userData) => {
    const errors = [];
    const { username, email, password } = userData;
    
    // Campos requeridos
    const requiredErrors = validateRequiredFields(userData, ['username', 'email', 'password']);
    errors.push(...requiredErrors);
    
    // Validar email
    if (email && !isValidEmail(email)) {
        errors.push(RESPONSE_MESSAGES.VALIDATION.INVALID_EMAIL);
    }
    
    // Validar username
    if (username && (username.length < 3 || username.length > 20)) {
        errors.push('El nombre de usuario debe tener entre 3 y 20 caracteres');
    }
    
    // Validar password
    if (password && password.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    return errors;
};

/**
 * Validar datos de creación de personaje
 * @param {Object} characterData - Datos del personaje
 * @returns {Array} - Array de errores
 */
const validateCharacterCreation = (characterData) => {
    const errors = [];
    const { name, class: characterClass } = characterData;
    
    // Campos requeridos
    const requiredErrors = validateRequiredFields(characterData, ['name', 'class']);
    errors.push(...requiredErrors);
    
    // Validar nombre del personaje
    if (name && (name.length < 2 || name.length > 15)) {
        errors.push('El nombre del personaje debe tener entre 2 y 15 caracteres');
    }
    
    // Validar clase del personaje
    if (characterClass && !VALID_TYPES.CHARACTER_CLASSES.includes(characterClass)) {
        errors.push(RESPONSE_MESSAGES.VALIDATION.INVALID_CHARACTER_CLASS);
    }
    
    return errors;
};

/**
 * Validar distribución de puntos de características
 * @param {Object} data - Datos de distribución
 * @returns {Array} - Array de errores
 */
const validatePointsDistribution = (data) => {
    const errors = [];
    const { characteristic, points } = data;
    
    // Campos requeridos
    const requiredErrors = validateRequiredFields(data, ['characteristic', 'points']);
    errors.push(...requiredErrors);
    
    // Validar característica
    if (characteristic && !VALID_TYPES.CHARACTERISTICS.includes(characteristic)) {
        errors.push(RESPONSE_MESSAGES.VALIDATION.INVALID_CHARACTERISTIC);
    }
    
    // Validar puntos
    if (points !== undefined) {
        if (!Number.isInteger(points) || points < 1) {
            errors.push('Los puntos deben ser un número entero positivo');
        }
    }
    
    return errors;
};

/**
 * Validar datos de actualización de personaje
 * @param {Object} updateData - Datos de actualización
 * @returns {Array} - Array de errores
 */
const validateCharacterUpdate = (updateData) => {
    const errors = [];
    
    // Validar level si está presente
    if (updateData.level !== undefined) {
        if (!Number.isInteger(updateData.level) || updateData.level < 1 || updateData.level > APP_CONFIG.MAX_LEVEL) {
            errors.push(RESPONSE_MESSAGES.VALIDATION.INVALID_LEVEL);
        }
    }
    
    // Validar experience si está presente
    if (updateData.experience !== undefined) {
        if (!Number.isInteger(updateData.experience) || updateData.experience < 0) {
            errors.push(RESPONSE_MESSAGES.VALIDATION.INVALID_EXPERIENCE);
        }
    }
    
    // Validar characteristics si están presentes
    if (updateData.characteristics) {
        Object.keys(updateData.characteristics).forEach(char => {
            if (!VALID_TYPES.CHARACTERISTICS.includes(char)) {
                errors.push(`Característica inválida: ${char}`);
            }
            
            const value = updateData.characteristics[char];
            if (!Number.isInteger(value) || value < 0) {
                errors.push(`Valor inválido para característica ${char}: debe ser un entero no negativo`);
            }
        });
    }
    
    // Validar resistances si están presentes
    if (updateData.resistances) {
        Object.keys(updateData.resistances).forEach(resistance => {
            if (!VALID_TYPES.RESISTANCES.includes(resistance)) {
                errors.push(`Resistencia inválida: ${resistance}`);
            }
            
            const value = updateData.resistances[resistance];
            if (!Number.isInteger(value) || value < 0 || value > 100) {
                errors.push(`Valor inválido para resistencia ${resistance}: debe ser entre 0 y 100`);
            }
        });
    }
    
    return errors;
};

/**
 * Validar tipo de item
 * @param {string} type - Tipo de item
 * @returns {boolean}
 */
const isValidItemType = (type) => {
    return VALID_TYPES.ITEM_TYPES.includes(type);
};

/**
 * Validar rareza de item
 * @param {string} rarity - Rareza del item
 * @returns {boolean}
 */
const isValidItemRarity = (rarity) => {
    return VALID_TYPES.ITEM_RARITIES.includes(rarity);
};

/**
 * Validar slot de equipamiento
 * @param {string} slot - Slot de equipamiento
 * @returns {boolean}
 */
const isValidEquipmentSlot = (slot) => {
    return VALID_TYPES.EQUIPMENT_SLOTS.includes(slot);
};

/**
 * Validar ObjectId de MongoDB
 * @param {string} id - ID a validar
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
};

/**
 * Sanitizar string (remover caracteres peligrosos)
 * @param {string} str - String a sanitizar
 * @returns {string}
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
        .trim()
        .replace(/[<>]/g, '') // Remover < y >
        .replace(/javascript:/gi, '') // Remover javascript:
        .replace(/on\w+=/gi, ''); // Remover event handlers
};

/**
 * Validar y sanitizar datos de entrada
 * @param {Object} data - Datos a validar y sanitizar
 * @param {Array} stringFields - Campos que son strings y deben ser sanitizados
 * @returns {Object} - Datos sanitizados
 */
const validateAndSanitize = (data, stringFields = []) => {
    const sanitized = { ...data };
    
    stringFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = sanitizeString(sanitized[field]);
        }
    });
    
    return sanitized;
};

module.exports = {
    isValidEmail,
    validateRequiredFields,
    validateUserRegistration,
    validateCharacterCreation,
    validatePointsDistribution,
    validateCharacterUpdate,
    isValidItemType,
    isValidItemRarity,
    isValidEquipmentSlot,
    isValidObjectId,
    sanitizeString,
    validateAndSanitize,
};
