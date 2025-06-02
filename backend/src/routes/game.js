const express = require('express');
const Character = require('../models/Character');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Guardar progreso del juego
router.post('/save-progress', async (req, res) => {
    try {
        const { characterId, gameData } = req.body;

        if (!characterId || !gameData) {
            return res.status(400).json({
                message: 'ID del personaje y datos del juego son requeridos'
            });
        }

        const character = await Character.findOne({
            _id: characterId,
            userId: req.userId,
            isActive: true
        });

        if (!character) {
            return res.status(404).json({
                message: 'Personaje no encontrado'
            });
        }

        // Actualizar datos del personaje
        if (gameData.level !== undefined) character.level = gameData.level;
        if (gameData.experience !== undefined) character.experience = gameData.experience;
        if (gameData.stats) character.stats = { ...character.stats, ...gameData.stats };
        if (gameData.position) character.position = { ...character.position, ...gameData.position };

        // Actualizar estadísticas de juego
        if (gameData.combatResult) {
            if (gameData.combatResult === 'victory') {
                character.gameStats.combatsWon += 1;
                character.gameStats.enemiesDefeated += gameData.enemiesDefeated || 1;
            } else if (gameData.combatResult === 'defeat') {
                character.gameStats.combatsLost += 1;
            }
        }

        // Verificar subida de nivel
        while (character.canLevelUp()) {
            character.levelUp();
        }

        character.gameStats.lastSaved = new Date();
        await character.save();

        res.json({
            message: 'Progreso guardado exitosamente',
            character: character.toGameJSON()
        });

    } catch (error) {
        console.error('Error guardando progreso:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Cargar datos del juego
router.get('/load-game/:characterId', async (req, res) => {
    try {
        const character = await Character.findOne({
            _id: req.params.characterId,
            userId: req.userId,
            isActive: true
        });

        if (!character) {
            return res.status(404).json({
                message: 'Personaje no encontrado'
            });
        }

        res.json({
            message: 'Datos del juego cargados exitosamente',
            gameData: character.toGameJSON()
        });

    } catch (error) {
        console.error('Error cargando juego:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Obtener ranking de jugadores
router.get('/leaderboard', async (req, res) => {
    try {
        const topCharacters = await Character.find({ isActive: true })
            .sort({ level: -1, experience: -1 })
            .limit(10)
            .populate('userId', 'username')
            .select('name class level experience gameStats userId');

        const leaderboard = topCharacters.map(char => ({
            name: char.name,
            class: char.class,
            level: char.level,
            experience: char.experience,
            combatsWon: char.gameStats.combatsWon,
            enemiesDefeated: char.gameStats.enemiesDefeated,
            username: char.userId.username
        }));

        res.json({
            message: 'Ranking obtenido exitosamente',
            leaderboard
        });

    } catch (error) {
        console.error('Error obteniendo ranking:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas del servidor
router.get('/server-stats', async (req, res) => {
    try {
        const totalCharacters = await Character.countDocuments({ isActive: true });
        const totalCombats = await Character.aggregate([
            { $match: { isActive: true } },
            { $group: { 
                _id: null, 
                totalCombats: { $sum: { $add: ['$gameStats.combatsWon', '$gameStats.combatsLost'] } },
                totalEnemiesDefeated: { $sum: '$gameStats.enemiesDefeated' }
            }}
        ]);

        const classDistribution = await Character.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$class', count: { $sum: 1 } } }
        ]);

        res.json({
            message: 'Estadísticas del servidor obtenidas exitosamente',
            stats: {
                totalCharacters,
                totalCombats: totalCombats[0]?.totalCombats || 0,
                totalEnemiesDefeated: totalCombats[0]?.totalEnemiesDefeated || 0,
                classDistribution
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
