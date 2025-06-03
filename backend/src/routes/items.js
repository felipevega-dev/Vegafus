const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ItemService = require('../services/ItemService');

// Obtener todos los items
router.get('/', auth, async (req, res) => {
    try {
        const items = await ItemService.getAllItems();
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error obteniendo items:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Obtener item por ID
router.get('/:itemId', auth, async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await ItemService.getItemById(itemId);
        
        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item no encontrado' 
            });
        }
        
        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error obteniendo item:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Obtener items por tipo
router.get('/type/:type', auth, async (req, res) => {
    try {
        const { type } = req.params;
        const validTypes = ['resource', 'equipment', 'consumable'];
        
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tipo de item inválido' 
            });
        }
        
        const items = await ItemService.getItemsByType(type);
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error obteniendo items por tipo:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Obtener items por rareza
router.get('/rarity/:rarity', auth, async (req, res) => {
    try {
        const { rarity } = req.params;
        const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        
        if (!validRarities.includes(rarity)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rareza inválida' 
            });
        }
        
        const items = await ItemService.getItemsByRarity(rarity);
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error obteniendo items por rareza:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Inicializar items (solo para desarrollo/admin)
router.post('/initialize', auth, async (req, res) => {
    try {
        // Solo permitir en desarrollo o para admins
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ 
                success: false, 
                message: 'No permitido en producción' 
            });
        }
        
        await ItemService.initializeItems();
        
        res.json({
            success: true,
            message: 'Items inicializados correctamente'
        });
    } catch (error) {
        console.error('Error inicializando items:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

module.exports = router;
