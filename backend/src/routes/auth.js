const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validar datos requeridos
        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'El usuario o email ya existe'
            });
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
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            token,
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Error en registro:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Datos inválidos',
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar datos requeridos
        if (!username || !password) {
            return res.status(400).json({
                message: 'Usuario y contraseña son requeridos'
            });
        }

        // Buscar usuario por username o email
        const user = await User.findOne({
            $or: [{ username }, { email: username }]
        });

        if (!user) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Credenciales inválidas'
            });
        }

        // Verificar si el usuario está activo
        if (!user.isActive) {
            return res.status(401).json({
                message: 'Cuenta desactivada'
            });
        }

        // Actualizar último login
        user.lastLogin = new Date();
        await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: user.toPublicJSON()
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Verificar token
router.get('/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            message: 'Token válido',
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Logout (opcional - principalmente para limpiar en frontend)
router.post('/logout', auth, (req, res) => {
    res.json({
        message: 'Logout exitoso'
    });
});

module.exports = router;
