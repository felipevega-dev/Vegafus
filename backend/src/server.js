const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Importar configuración y utilidades
const { APP_CONFIG, CORS_CONFIG } = require('./config/constants');
const { globalErrorHandler } = require('./utils/responseHandler');

const app = express();

// Middleware
// Configuración de CORS más flexible para desarrollo
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Postman) en desarrollo
        if (!origin && process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Usar orígenes permitidos desde configuración centralizada
        const allowedOrigins = CORS_CONFIG.ALLOWED_ORIGINS;

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`❌ CORS: Origen no permitido: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión a MongoDB
mongoose.connect(APP_CONFIG.MONGODB_URI)
    .then(async () => {
        console.log('✅ Conectado a MongoDB');

        // Inicializar items estáticos
        try {
            const ItemService = require('./services/ItemService');
            await ItemService.initializeItems();
        } catch (error) {
            console.error('❌ Error inicializando items:', error);
        }
    })
    .catch((error) => {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    });

// Rutas básicas
app.get('/', (_, res) => {
    res.json({
        message: APP_CONFIG.NAME,
        version: APP_CONFIG.VERSION,
        status: 'running',
        environment: APP_CONFIG.NODE_ENV
    });
});

// Rutas de la API
try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/characters', require('./routes/characters'));
    app.use('/api/game', require('./routes/game'));
    app.use('/api/items', require('./routes/items'));
    app.use('/api/inventory', require('./routes/inventory'));
    app.use('/api/equipment', require('./routes/equipment'));
    console.log('✅ Todas las rutas cargadas exitosamente');
} catch (error) {
    console.error('❌ Error cargando rutas:', error.message);
    process.exit(1);
}

// Middleware de manejo de errores global
app.use(globalErrorHandler);

// Ruta 404 - Manejar todas las rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Iniciar servidor
app.listen(APP_CONFIG.PORT, () => {
    console.log(`🚀 ${APP_CONFIG.NAME} v${APP_CONFIG.VERSION}`);
    console.log(`🌐 Servidor corriendo en puerto ${APP_CONFIG.PORT}`);
    console.log(`🔧 Entorno: ${APP_CONFIG.NODE_ENV}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'No configurado'}`);
    console.log(`🗄️  MongoDB: ${APP_CONFIG.MONGODB_URI}`);
});

module.exports = app;
