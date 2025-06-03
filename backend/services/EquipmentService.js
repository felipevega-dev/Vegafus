const Character = require('../src/models/Character');
const ItemService = require('./ItemService');

class EquipmentService {
    // Equipar un item
    static async equipItem(characterId, itemId, slot) {
        try {
            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            // Verificar que el item existe en el inventario
            const inventoryItemIndex = character.inventory.findIndex(
                invItem => invItem.itemId === itemId && !invItem.equipped
            );

            if (inventoryItemIndex === -1) {
                throw new Error('Item no encontrado en el inventario');
            }

            // Obtener información del item
            const itemInfo = await ItemService.getItemById(itemId);
            if (!itemInfo) {
                throw new Error('Información del item no encontrada');
            }

            // Verificar que el item se puede equipar en este slot
            if (!this.canEquipItemInSlot(itemInfo, slot)) {
                throw new Error(`No se puede equipar ${itemInfo.name} en el slot ${slot}`);
            }

            // Si ya hay algo equipado en este slot, desequiparlo primero
            if (character.equipment[slot] && character.equipment[slot].itemId) {
                await this.unequipItem(characterId, slot);
                // Recargar el personaje después de desequipar
                const updatedCharacter = await Character.findById(characterId);
                Object.assign(character, updatedCharacter);
            }

            // Equipar el nuevo item
            character.equipment[slot] = {
                itemId: itemId,
                quantity: 1,
                equippedAt: new Date()
            };

            // Marcar el item como equipado en el inventario
            character.inventory[inventoryItemIndex].equipped = true;

            await character.save();

            return {
                success: true,
                message: `${itemInfo.name} equipado exitosamente`,
                equipment: character.equipment
            };

        } catch (error) {
            console.error('Error equipando item:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Desequipar un item
    static async unequipItem(characterId, slot) {
        try {
            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            // Verificar que hay algo equipado en este slot
            if (!character.equipment[slot] || !character.equipment[slot].itemId) {
                throw new Error('No hay nada equipado en este slot');
            }

            const itemId = character.equipment[slot].itemId;

            // Encontrar el item en el inventario y marcarlo como no equipado
            const inventoryItemIndex = character.inventory.findIndex(
                invItem => invItem.itemId === itemId && invItem.equipped
            );

            if (inventoryItemIndex !== -1) {
                character.inventory[inventoryItemIndex].equipped = false;
            }

            // Obtener información del item para el mensaje
            const itemInfo = await ItemService.getItemById(itemId);
            const itemName = itemInfo ? itemInfo.name : 'Item';

            // Limpiar el slot de equipamiento
            character.equipment[slot] = {
                itemId: null,
                quantity: 1,
                equippedAt: null
            };

            await character.save();

            return {
                success: true,
                message: `${itemName} desequipado exitosamente`,
                equipment: character.equipment
            };

        } catch (error) {
            console.error('Error desequipando item:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Obtener equipamiento completo con información de items
    static async getEquipmentWithItemInfo(characterId) {
        try {
            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            const equipmentWithInfo = {};

            for (const slot of Object.keys(character.equipment)) {
                const equippedItem = character.equipment[slot];
                if (equippedItem && equippedItem.itemId) {
                    const itemInfo = await ItemService.getItemById(equippedItem.itemId);
                    equipmentWithInfo[slot] = {
                        ...equippedItem.toObject(),
                        itemInfo: itemInfo
                    };
                } else {
                    equipmentWithInfo[slot] = null;
                }
            }

            return equipmentWithInfo;

        } catch (error) {
            console.error('Error obteniendo equipamiento:', error);
            throw error;
        }
    }

    // Verificar si un item se puede equipar en un slot específico
    static canEquipItemInSlot(itemInfo, slot) {
        if (itemInfo.type !== 'equipment') {
            return false;
        }

        // Mapeo de subtipos de items a slots válidos
        const slotMapping = {
            'helmet': ['helmet'],
            'armor': ['armor'],
            'weapon': ['weapon'],
            'shield': ['shield'],
            'boots': ['boots'],
            'belt': ['belt'],
            'amulet': ['amulet'],
            'ring': ['ring1', 'ring2']
        };

        const validSlots = slotMapping[itemInfo.subtype] || [];
        return validSlots.includes(slot);
    }

    // Calcular stats totales del equipamiento
    static async calculateEquipmentStats(characterId) {
        try {
            const equipmentWithInfo = await this.getEquipmentWithItemInfo(characterId);
            
            const totalStats = {
                // Características elementales
                tierra: 0,
                fuego: 0,
                agua: 0,
                aire: 0,
                vida: 0,
                sabiduria: 0,
                
                // Resistencias
                tierraRes: 0,
                fuegoRes: 0,
                aguaRes: 0,
                aireRes: 0,
                
                // Otros stats
                attack: 0,
                defense: 0,
                hp: 0,
                mp: 0,
                ap: 0,
                movementPoints: 0
            };

            Object.values(equipmentWithInfo).forEach(equippedItem => {
                if (equippedItem && equippedItem.itemInfo && equippedItem.itemInfo.stats) {
                    const stats = equippedItem.itemInfo.stats;
                    
                    Object.keys(stats).forEach(statName => {
                        if (totalStats.hasOwnProperty(statName)) {
                            totalStats[statName] += stats[statName] || 0;
                        }
                    });
                }
            });

            return totalStats;

        } catch (error) {
            console.error('Error calculando stats de equipamiento:', error);
            return null;
        }
    }

    // Aplicar stats de equipamiento a un personaje
    static async applyEquipmentStats(character) {
        try {
            const equipmentStats = await this.calculateEquipmentStats(character._id);
            
            if (equipmentStats) {
                // Aplicar bonos de equipamiento a las características
                character.equipmentBonus = equipmentStats;
                
                // Recalcular HP máximo si hay bonos de vida
                if (equipmentStats.vida > 0) {
                    character.stats.hp.max = character.stats.hp.max + equipmentStats.vida;
                }
                
                // Aplicar otros bonos según sea necesario
                if (equipmentStats.ap > 0) {
                    character.stats.actionPoints += equipmentStats.ap;
                }
                
                if (equipmentStats.movementPoints > 0) {
                    character.stats.movementPoints += equipmentStats.movementPoints;
                }
            }

            return character;

        } catch (error) {
            console.error('Error aplicando stats de equipamiento:', error);
            return character;
        }
    }
}

module.exports = EquipmentService;
