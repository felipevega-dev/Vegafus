const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Configuración de CORS más flexible para desarrollo
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Postman) en desarrollo
        if (!origin && process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Lista de orígenes permitidos
        const allowedOrigins = [
            'http://localhost:8080',
            'http://localhost:8083',
            'http://localhost:3001', // Vite dev server
            'http://localhost:3002', // Vite dev server
            'http://127.0.0.1:8080',
            'http://127.0.0.1:8083',
            'http://127.0.0.1:3001', // Vite dev server
            process.env.FRONTEND_URL
        ].filter(Boolean); // Filtrar valores undefined

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dofus-game')
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
        message: '🎮 Dofus Backend API',
        version: '1.0.0',
        status: 'running'
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

// Middleware de manejo de errores
app.use((err, _req, res, _next) => {
    console.error('❌ Error del servidor:', err.message);
    res.status(500).json({
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Ruta 404 - Manejar todas las rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        message: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI}`);
});

module.exports = app;
