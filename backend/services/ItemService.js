const Item = require('../src/models/Item');

class ItemService {
    // Inicializar items estáticos en la base de datos
    static async initializeItems() {
        try {
            // Verificar si ya existen items
            const existingItems = await Item.countDocuments();
            if (existingItems > 0) {
                console.log('✅ Items ya inicializados en la base de datos');
                return;
            }

            console.log('🔄 Inicializando items estáticos...');

            // Items de recursos
            const resources = [
                { _id: 'wood', name: 'Madera', type: 'resource', rarity: 'common', value: 5, description: 'Madera básica para crafting', stackable: true, maxStack: 100 },
                { _id: 'stone', name: 'Piedra', type: 'resource', rarity: 'common', value: 3, description: 'Piedra común para construcción', stackable: true, maxStack: 100 },
                { _id: 'iron_ore', name: 'Mineral de Hierro', type: 'resource', rarity: 'uncommon', value: 15, description: 'Mineral valioso para forjar', stackable: true, maxStack: 100 },
                { _id: 'magic_crystal', name: 'Cristal Mágico', type: 'resource', rarity: 'rare', value: 50, description: 'Cristal imbuido de energía mágica', stackable: true, maxStack: 100 },
                { _id: 'herb', name: 'Hierba Medicinal', type: 'resource', rarity: 'common', value: 8, description: 'Hierba útil para pociones', stackable: true, maxStack: 100 },
                { _id: 'leather', name: 'Cuero', type: 'resource', rarity: 'common', value: 12, description: 'Cuero de buena calidad', stackable: true, maxStack: 100 }
            ];

            // Items de equipamiento
            const equipment = [
                { _id: 'iron_sword', name: 'Espada de Hierro', type: 'equipment', rarity: 'uncommon', value: 100, description: 'Espada resistente de hierro', stackable: false, stats: { attack: 15 } },
                { _id: 'leather_armor', name: 'Armadura de Cuero', type: 'equipment', rarity: 'common', value: 80, description: 'Armadura ligera de cuero', stackable: false, stats: { defense: 10 } },
                { _id: 'magic_staff', name: 'Bastón Mágico', type: 'equipment', rarity: 'rare', value: 200, description: 'Bastón que amplifica la magia', stackable: false, stats: { magic: 20 } },
                { _id: 'steel_helmet', name: 'Casco de Acero', type: 'equipment', rarity: 'uncommon', value: 120, description: 'Casco resistente de acero', stackable: false, stats: { defense: 8 } },
                { _id: 'enchanted_ring', name: 'Anillo Encantado', type: 'equipment', rarity: 'epic', value: 500, description: 'Anillo con poderes mágicos', stackable: false, stats: { magic: 15, hp: 25 } },
                { _id: 'bow_of_precision', name: 'Arco de Precisión', type: 'equipment', rarity: 'rare', value: 250, description: 'Arco que mejora la puntería', stackable: false, stats: { attack: 18, accuracy: 10 } }
            ];

            // Items consumibles
            const consumables = [
                { _id: 'health_potion', name: 'Poción de Vida', type: 'consumable', rarity: 'common', value: 25, description: 'Restaura 50 HP', stackable: true, maxStack: 50 },
                { _id: 'mana_potion', name: 'Poción de Maná', type: 'consumable', rarity: 'common', value: 30, description: 'Restaura 3 PA', stackable: true, maxStack: 50 },
                { _id: 'bread', name: 'Pan', type: 'consumable', rarity: 'common', value: 5, description: 'Alimento básico que restaura 20 HP', stackable: true, maxStack: 100 }
            ];

            // Insertar todos los items
            const allItems = [...resources, ...equipment, ...consumables];
            await Item.insertMany(allItems);

            console.log(`✅ ${allItems.length} items inicializados correctamente`);
        } catch (error) {
            console.error('❌ Error inicializando items:', error);
        }
    }

    // Obtener todos los items
    static async getAllItems() {
        return await Item.find({});
    }

    // Obtener item por ID
    static async getItemById(itemId) {
        return await Item.findById(itemId);
    }

    // Obtener items por tipo
    static async getItemsByType(type) {
        return await Item.find({ type });
    }

    // Obtener items por rareza
    static async getItemsByRarity(rarity) {
        return await Item.find({ rarity });
    }

    // Verificar si un item existe
    static async itemExists(itemId) {
        const item = await Item.findById(itemId);
        return !!item;
    }

    // Obtener información de múltiples items
    static async getItemsInfo(itemIds) {
        return await Item.find({ _id: { $in: itemIds } });
    }
}

module.exports = ItemService;
