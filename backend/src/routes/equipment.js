const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EquipmentService = require('../../services/EquipmentService');

// Obtener equipamiento del personaje con información de items
router.get('/:characterId', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        
        // Verificar que el personaje pertenece al usuario
        const Character = require('../models/Character');
        const character = await Character.findOne({ 
            _id: characterId, 
            userId: req.user.id 
        });
        
        if (!character) {
            return res.status(404).json({ 
                success: false, 
                message: 'Personaje no encontrado' 
            });
        }

        const equipment = await EquipmentService.getEquipmentWithItemInfo(characterId);
        
        res.json({
            success: true,
            data: equipment
        });
    } catch (error) {
        console.error('Error obteniendo equipamiento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Equipar un item
router.post('/:characterId/equip', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { itemId, slot } = req.body;
        
        // Validar parámetros
        if (!itemId || !slot) {
            return res.status(400).json({
                success: false,
                message: 'itemId y slot son requeridos'
            });
        }

        // Verificar que el personaje pertenece al usuario
        const Character = require('../models/Character');
        const character = await Character.findOne({ 
            _id: characterId, 
            userId: req.user.id 
        });
        
        if (!character) {
            return res.status(404).json({ 
                success: false, 
                message: 'Personaje no encontrado' 
            });
        }

        const result = await EquipmentService.equipItem(characterId, itemId, slot);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error equipando item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Desequipar un item
router.post('/:characterId/unequip', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { slot } = req.body;
        
        // Validar parámetros
        if (!slot) {
            return res.status(400).json({
                success: false,
                message: 'slot es requerido'
            });
        }

        // Verificar que el personaje pertenece al usuario
        const Character = require('../models/Character');
        const character = await Character.findOne({ 
            _id: characterId, 
            userId: req.user.id 
        });
        
        if (!character) {
            return res.status(404).json({ 
                success: false, 
                message: 'Personaje no encontrado' 
            });
        }

        const result = await EquipmentService.unequipItem(characterId, slot);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Error desequipando item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Obtener stats totales del equipamiento
router.get('/:characterId/stats', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        
        // Verificar que el personaje pertenece al usuario
        const Character = require('../models/Character');
        const character = await Character.findOne({ 
            _id: characterId, 
            userId: req.user.id 
        });
        
        if (!character) {
            return res.status(404).json({ 
                success: false, 
                message: 'Personaje no encontrado' 
            });
        }

        const equipmentStats = await EquipmentService.calculateEquipmentStats(characterId);
        
        res.json({
            success: true,
            data: equipmentStats
        });
    } catch (error) {
        console.error('Error obteniendo stats de equipamiento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

module.exports = router;
