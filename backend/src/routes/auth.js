const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Importar utilidades estandarizadas
const { APP_CONFIG, RESPONSE_MESSAGES, HTTP_STATUS } = require('../config/constants');
const {
    sendSuccess,
    sendError,
    sendValidationError,
    sendAuthError,
    sendConflict,
    asyncHandler
} = require('../utils/responseHandler');
const { validateUserRegistration, validateRequiredFields } = require('../utils/validators');

const router = express.Router();

// Registro de usuario
router.post('/register', asyncHandler(async (req, res) => {
    // Validar datos de entrada
    const validationErrors = validateUserRegistration(req.body);
    if (validationErrors.length > 0) {
        return sendValidationError(res, validationErrors);
    }

    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (existingUser) {
        return sendConflict(res, RESPONSE_MESSAGES.AUTH.USER_EXISTS);
    }

    // Crear nuevo usuario
    const user = new User({
        username,
        email,
        password
    });

    await user.save();

    // Generar token JWT
    const token = jwt.sign(
        { userId: user._id },
        APP_CONFIG.JWT_SECRET,
        { expiresIn: APP_CONFIG.JWT_EXPIRES_IN }
    );

    return sendSuccess(res, RESPONSE_MESSAGES.SUCCESS.USER_REGISTERED, {
        token,
        user: user.toPublicJSON()
    }, HTTP_STATUS.CREATED);
}));

// Login de usuario
router.post('/login', asyncHandler(async (req, res) => {
    // Validar datos requeridos
    const validationErrors = validateRequiredFields(req.body, ['username', 'password']);
    if (validationErrors.length > 0) {
        return sendValidationError(res, validationErrors);
    }

    const { username, password } = req.body;

    // Buscar usuario por username o email
    const user = await User.findOne({
        $or: [{ username }, { email: username }]
    });

    if (!user) {
        return sendAuthError(res, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        return sendAuthError(res, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
        return sendAuthError(res, RESPONSE_MESSAGES.AUTH.USER_INACTIVE);
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token JWT
    const token = jwt.sign(
        { userId: user._id },
        APP_CONFIG.JWT_SECRET,
        { expiresIn: APP_CONFIG.JWT_EXPIRES_IN }
    );

    return sendSuccess(res, RESPONSE_MESSAGES.SUCCESS.USER_LOGGED_IN, {
        token,
        user: user.toPublicJSON()
    });
}));

// Verificar token
router.get('/verify', auth, asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) {
        return sendAuthError(res, RESPONSE_MESSAGES.AUTH.USER_NOT_FOUND);
    }

    return sendSuccess(res, RESPONSE_MESSAGES.SUCCESS.TOKEN_VALID, {
        user: user.toPublicJSON()
    });
}));

// Logout (opcional - principalmente para limpiar en frontend)
router.post('/logout', auth, (req, res) => {
    return sendSuccess(res, RESPONSE_MESSAGES.SUCCESS.USER_LOGGED_OUT);
});

module.exports = router;
