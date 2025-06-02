const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Obtener token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                message: 'Acceso denegado. Token no proporcionado.'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el usuario existe y está activo
        const user = await User.findById(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                message: 'Token inválido o usuario inactivo'
            });
        }

        // Añadir userId al request
        req.userId = decoded.userId;
        req.user = user;
        
        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Token expirado'
            });
        }
        
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
};

module.exports = auth;
