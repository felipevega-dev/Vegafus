const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const InventoryService = require('../services/InventoryService');
const ItemService = require('../services/ItemService');

// Obtener inventario del personaje con información de items
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

        const inventory = await InventoryService.getInventoryWithItemInfo(characterId);
        
        res.json({
            success: true,
            data: {
                kamas: character.kamas || 0,
                inventory: inventory
            }
        });
    } catch (error) {
        console.error('Error obteniendo inventario:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Agregar item al inventario (para testing o admin)
router.post('/:characterId/items', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { itemId, quantity = 1 } = req.body;
        
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

        const result = await InventoryService.addItemToInventory(characterId, itemId, quantity);
        
        res.json(result);
    } catch (error) {
        console.error('Error agregando item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Remover item del inventario
router.delete('/:characterId/items/:itemId', auth, async (req, res) => {
    try {
        const { characterId, itemId } = req.params;
        const { quantity = 1 } = req.body;
        
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

        const result = await InventoryService.removeItemFromInventory(characterId, itemId, quantity);
        
        res.json(result);
    } catch (error) {
        console.error('Error removiendo item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Agregar kamas
router.post('/:characterId/kamas', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cantidad inválida' 
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

        const result = await InventoryService.addKamas(characterId, amount);
        
        res.json(result);
    } catch (error) {
        console.error('Error agregando kamas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Gastar kamas
router.post('/:characterId/kamas/spend', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cantidad inválida' 
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

        const result = await InventoryService.spendKamas(characterId, amount);
        
        res.json(result);
    } catch (error) {
        console.error('Error gastando kamas:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Aplicar drops de combate
router.post('/:characterId/drops', auth, async (req, res) => {
    try {
        const { characterId } = req.params;
        const { drops } = req.body;
        
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

        const result = await InventoryService.applyDrops(characterId, drops);
        
        res.json(result);
    } catch (error) {
        console.error('Error aplicando drops:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

module.exports = router;
