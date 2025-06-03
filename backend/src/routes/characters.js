const express = require('express');
const Character = require('../models/Character');
const auth = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(auth);

// Obtener todos los personajes del usuario
router.get('/', async (req, res) => {
    try {
        const characters = await Character.find({ 
            userId: req.userId,
            isActive: true 
        }).sort({ 'gameStats.lastSaved': -1 })

        res.json({
            message: 'Personajes obtenidos exitosamente',
            characters: characters.map(char => char.toGameJSON())
        });
    } catch (error) {
        console.error('Error obteniendo personajes:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Obtener un personaje específico
router.get('/:characterId', async (req, res) => {
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
            message: 'Personaje obtenido exitosamente',
            character: character.toGameJSON()
        });
    } catch (error) {
        console.error('Error obteniendo personaje:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Crear nuevo personaje
router.post('/', async (req, res) => {
    try {
        const { name, class: characterClass } = req.body;

        // Validar datos requeridos
        if (!name || !characterClass) {
            return res.status(400).json({
                message: 'Nombre y clase son requeridos'
            });
        }

        // Verificar límite de personajes (máximo 5)
        const characterCount = await Character.countDocuments({
            userId: req.userId,
            isActive: true
        });

        if (characterCount >= 5) {
            return res.status(400).json({
                message: 'Máximo 5 personajes por cuenta'
            });
        }

        // Verificar que el usuario no tenga ya un personaje con ese nombre
        const existingCharacter = await Character.findOne({
            userId: req.userId,
            name: name,
            isActive: true
        });

        if (existingCharacter) {
            return res.status(400).json({
                message: 'Ya tienes un personaje con ese nombre'
            });
        }

        // Configurar estadísticas iniciales según la clase
        let initialStats = {
            hp: { current: 100, max: 100 },
            mp: { current: 50, max: 50 },
            attack: 20,
            defense: 10,
            movementPoints: 3,
            actionPoints: 6
        };

        // Ajustar stats según la clase
        switch (characterClass) {
            case 'warrior':
                initialStats.hp = { current: 120, max: 120 };
                initialStats.attack = 25;
                initialStats.defense = 15;
                initialStats.mp = { current: 30, max: 30 };
                break;
            case 'archer':
                initialStats.movementPoints = 4;
                initialStats.attack = 22;
                initialStats.defense = 8;
                break;
            case 'mage':
                initialStats.mp = { current: 70, max: 70 };
                initialStats.attack = 18;
                initialStats.actionPoints = 7;
                break;
        }

        // Hechizos específicos por clase
        const getSpellsByClass = (characterClass) => {
            switch (characterClass) {
                case 'warrior':
                    return [
                        { spellId: 'golpe_telurico', level: 1, unlocked: true },
                        { spellId: 'llama_ardiente', level: 1, unlocked: true },
                        { spellId: 'tormenta_helada', level: 1, unlocked: true },
                        { spellId: 'viento_cortante', level: 1, unlocked: true }
                    ];
                case 'mage':
                    return [
                        { spellId: 'terremoto', level: 1, unlocked: true },
                        { spellId: 'bola_de_fuego', level: 1, unlocked: true },
                        { spellId: 'rayo_de_hielo', level: 1, unlocked: true },
                        { spellId: 'tormenta_electrica', level: 1, unlocked: true }
                    ];
                case 'archer':
                    return [
                        { spellId: 'flecha_rocosa', level: 1, unlocked: true },
                        { spellId: 'flecha_explosiva', level: 1, unlocked: true },
                        { spellId: 'flecha_de_hielo', level: 1, unlocked: true },
                        { spellId: 'flecha_del_viento', level: 1, unlocked: true }
                    ];
                default:
                    return [
                        { spellId: 'golpe_telurico', level: 1, unlocked: true },
                        { spellId: 'llama_ardiente', level: 1, unlocked: true },
                        { spellId: 'tormenta_helada', level: 1, unlocked: true },
                        { spellId: 'viento_cortante', level: 1, unlocked: true }
                    ];
            }
        };

        // Crear personaje
        const character = new Character({
            userId: req.userId,
            name,
            class: characterClass,
            stats: initialStats,
            spells: getSpellsByClass(characterClass),
            capitalPoints: 10, // Puntos iniciales de características
            spellPoints: 1 // Puntos iniciales de hechizos
        });

        await character.save();

        res.status(201).json({
            message: 'Personaje creado exitosamente',
            character: character.toGameJSON()
        });

    } catch (error) {
        console.error('Error creando personaje:', error);
        
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

// Actualizar personaje (guardar progreso)
router.put('/:characterId', async (req, res) => {
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

        // Campos que se pueden actualizar
        const allowedUpdates = [
            'level', 'experience', 'stats', 'position',
            'inventory', 'gameStats', 'characteristics', 'capitalPoints',
            'resistances', 'damageBonus', 'spells', 'spellPoints', 'kamas'
        ];

        // Actualizar solo los campos permitidos
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'stats') {
                    // Manejar stats de forma especial para evitar sobrescribir campos existentes
                    character.stats = { ...character.stats, ...req.body[field] };
                } else if (field === 'inventory') {
                    // Transformar inventario para asegurar formato correcto
                    const inventory = req.body[field];
                    if (Array.isArray(inventory)) {
                        character.inventory = inventory.map(item => {
                            // Si el item tiene 'id' en lugar de 'itemId', convertirlo
                            if (item.id && !item.itemId) {
                                return {
                                    itemId: item.id,
                                    quantity: item.quantity || 1,
                                    equipped: item.equipped || false,
                                    obtainedAt: item.obtainedAt || new Date()
                                };
                            }
                            // Si ya tiene itemId, mantenerlo
                            return item;
                        });
                    } else {
                        character[field] = req.body[field];
                    }
                } else {
                    character[field] = req.body[field];
                }
            }
        });

        // Verificar si puede subir de nivel
        while (character.canLevelUp()) {
            character.levelUp();
        }

        // Actualizar timestamp de guardado
        character.gameStats.lastSaved = new Date();

        await character.save();

        res.json({
            message: 'Personaje actualizado exitosamente',
            character: character.toGameJSON()
        });

    } catch (error) {
        console.error('Error actualizando personaje:', error);
        console.error('Request body:', req.body);
        console.error('Character ID:', req.params.characterId);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Eliminar personaje (soft delete)
router.delete('/:characterId', async (req, res) => {
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

        character.isActive = false;
        await character.save();

        res.json({
            message: 'Personaje eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando personaje:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Distribuir puntos de características
router.post('/:characterId/distribute-points', async (req, res) => {
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

        const { characteristic, points } = req.body;

        // Validar datos
        if (!characteristic || !points || points <= 0) {
            return res.status(400).json({
                message: 'Característica y puntos son requeridos'
            });
        }

        // Validar que la característica existe
        const validCharacteristics = ['tierra', 'fuego', 'agua', 'aire', 'vida', 'sabiduria'];
        if (!validCharacteristics.includes(characteristic)) {
            return res.status(400).json({
                message: 'Característica inválida'
            });
        }

        // Verificar que tiene suficientes puntos de capital
        if (character.capitalPoints < points) {
            return res.status(400).json({
                message: 'No tienes suficientes puntos de capital'
            });
        }

        // Distribuir puntos
        character.characteristics[characteristic] += points;
        character.capitalPoints -= points;

        // Si es vida, aumentar HP máximo
        if (characteristic === 'vida') {
            character.stats.hp.max += points;
            character.stats.hp.current += points; // También curar
        }

        await character.save();

        res.json({
            message: 'Puntos distribuidos exitosamente',
            character: character.toGameJSON()
        });

    } catch (error) {
        console.error('Error distribuyendo puntos:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para corregir puntos faltantes de personajes existentes
router.post('/:characterId/fix-points', async (req, res) => {
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

        // Calcular puntos que debería tener según su nivel
        const expectedCapitalPoints = 10 + ((character.level - 1) * 5); // 10 inicial + 5 por nivel
        const expectedSpellPoints = 1 + (character.level - 1); // 1 inicial + 1 por nivel

        // Corregir puntos si están por debajo de lo esperado
        const capitalPointsToAdd = Math.max(0, expectedCapitalPoints - character.capitalPoints);
        const spellPointsToAdd = Math.max(0, expectedSpellPoints - character.spellPoints);

        character.capitalPoints += capitalPointsToAdd;
        character.spellPoints += spellPointsToAdd;

        await character.save();

        res.json({
            message: `Puntos corregidos: +${capitalPointsToAdd} capital, +${spellPointsToAdd} hechizo`,
            character: character.toGameJSON(),
            corrections: {
                capitalPointsAdded: capitalPointsToAdd,
                spellPointsAdded: spellPointsToAdd,
                newCapitalPoints: character.capitalPoints,
                newSpellPoints: character.spellPoints
            }
        });

    } catch (error) {
        console.error('Error corrigiendo puntos:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Ruta para forzar level up (para testing)
router.post('/:characterId/force-levelup', async (req, res) => {
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

        // Dar suficiente XP para subir de nivel
        const requiredXP = character.getExpForNextLevel();
        character.experience = requiredXP;

        // Verificar si puede subir de nivel y hacerlo
        let levelsGained = 0;
        while (character.canLevelUp()) {
            character.levelUp();
            levelsGained++;
        }

        await character.save();

        res.json({
            message: `¡Subiste ${levelsGained} nivel(es)!`,
            character: character.toGameJSON()
        });

    } catch (error) {
        console.error('Error forzando level up:', error);
        res.status(500).json({
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;
