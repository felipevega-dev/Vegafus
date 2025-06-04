/**
 * Manejador de respuestas estandarizado para APIs
 */
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../config/constants');

/**
 * Crear respuesta de éxito estandarizada
 * @param {Object} res - Objeto de respuesta de Express
 * @param {string} message - Mensaje de éxito
 * @param {*} data - Datos a enviar (opcional)
 * @param {number} statusCode - Código de estado HTTP (por defecto 200)
 */
const sendSuccess = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString(),
    };

    if (data !== null) {
        response.data = data;
    }

    return res.status(statusCode).json(response);
};

/**
 * Crear respuesta de error estandarizada
 * @param {Object} res - Objeto de respuesta de Express
 * @param {string} message - Mensaje de error
 * @param {number} statusCode - Código de estado HTTP
 * @param {*} details - Detalles adicionales del error (opcional, solo en desarrollo)
 */
const sendError = (res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, details = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };

    // Solo incluir detalles en desarrollo
    if (details && process.env.NODE_ENV === 'development') {
        response.details = details;
    }

    return res.status(statusCode).json(response);
};

/**
 * Crear respuesta de validación de error
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Array|string} errors - Errores de validación
 */
const sendValidationError = (res, errors) => {
    const message = Array.isArray(errors) 
        ? 'Errores de validación encontrados'
        : errors;
    
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };

    if (Array.isArray(errors)) {
        response.errors = errors;
    }

    return res.status(HTTP_STATUS.BAD_REQUEST).json(response);
};

/**
 * Crear respuesta de autenticación fallida
 * @param {Object} res - Objeto de respuesta de Express
 * @param {string} message - Mensaje de error de autenticación
 */
const sendAuthError = (res, message = RESPONSE_MESSAGES.AUTH.TOKEN_INVALID) => {
    return sendError(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Crear respuesta de recurso no encontrado
 * @param {Object} res - Objeto de respuesta de Express
 * @param {string} message - Mensaje de recurso no encontrado
 */
const sendNotFound = (res, message = RESPONSE_MESSAGES.SERVER.NOT_FOUND) => {
    return sendError(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * Crear respuesta de conflicto (recurso ya existe)
 * @param {Object} res - Objeto de respuesta de Express
 * @param {string} message - Mensaje de conflicto
 */
const sendConflict = (res, message) => {
    return sendError(res, message, HTTP_STATUS.CONFLICT);
};

/**
 * Crear respuesta de operación prohibida
 * @param {Object} res - Objeto de respuesta de Express
 * @param {string} message - Mensaje de operación prohibida
 */
const sendForbidden = (res, message = RESPONSE_MESSAGES.SERVER.FORBIDDEN) => {
    return sendError(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Manejador de errores de base de datos
 * @param {Object} res - Objeto de respuesta de Express
 * @param {Error} error - Error de base de datos
 */
const handleDatabaseError = (res, error) => {
    console.error('Database Error:', error.message);
    
    // Errores específicos de MongoDB/Mongoose
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return sendValidationError(res, errors);
    }
    
    if (error.name === 'CastError') {
        return sendError(res, 'ID inválido proporcionado', HTTP_STATUS.BAD_REQUEST);
    }
    
    if (error.code === 11000) {
        return sendConflict(res, 'El recurso ya existe');
    }
    
    // Error genérico de base de datos
    return sendError(res, RESPONSE_MESSAGES.SERVER.DATABASE_ERROR);
};

/**
 * Wrapper para manejo de errores async en rutas
 * @param {Function} fn - Función async de la ruta
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware de manejo de errores global
 */
const globalErrorHandler = (err, req, res, next) => {
    console.error('Global Error Handler:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Si ya se envió una respuesta, delegar al manejador por defecto
    if (res.headersSent) {
        return next(err);
    }

    // Manejar diferentes tipos de errores
    if (err.name === 'ValidationError') {
        return handleDatabaseError(res, err);
    }

    if (err.name === 'JsonWebTokenError') {
        return sendAuthError(res, RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
    }

    if (err.name === 'TokenExpiredError') {
        return sendAuthError(res, 'Token expirado');
    }

    // Error genérico
    return sendError(res, RESPONSE_MESSAGES.SERVER.INTERNAL_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message);
};

module.exports = {
    sendSuccess,
    sendError,
    sendValidationError,
    sendAuthError,
    sendNotFound,
    sendConflict,
    sendForbidden,
    handleDatabaseError,
    asyncHandler,
    globalErrorHandler,
};
