const Character = require('../models/Character');
const ItemService = require('./ItemService');

class InventoryService {
    // Agregar item al inventario del personaje
    static async addItemToInventory(characterId, itemId, quantity = 1) {
        try {
            // Verificar que el item existe
            const itemExists = await ItemService.itemExists(itemId);
            if (!itemExists) {
                throw new Error(`Item ${itemId} no existe`);
            }

            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            // Obtener información del item
            const itemInfo = await ItemService.getItemById(itemId);
            
            // Verificar si el item ya existe en el inventario
            const existingItemIndex = character.inventory.findIndex(
                invItem => invItem.itemId === itemId
            );

            if (existingItemIndex !== -1) {
                // Item ya existe, verificar si es stackeable
                if (itemInfo.stackable) {
                    const currentQuantity = character.inventory[existingItemIndex].quantity;
                    const newQuantity = Math.min(currentQuantity + quantity, itemInfo.maxStack);
                    character.inventory[existingItemIndex].quantity = newQuantity;
                    
                    // Si no se pudo agregar toda la cantidad, devolver la cantidad restante
                    const remainingQuantity = (currentQuantity + quantity) - newQuantity;
                    
                    await character.save();
                    return {
                        success: true,
                        addedQuantity: newQuantity - currentQuantity,
                        remainingQuantity: remainingQuantity,
                        message: `${newQuantity - currentQuantity} ${itemInfo.name} agregado al inventario`
                    };
                } else {
                    // Item no stackeable, no se puede agregar más
                    return {
                        success: false,
                        message: `Ya tienes ${itemInfo.name} en tu inventario`
                    };
                }
            } else {
                // Item nuevo, agregarlo al inventario
                const quantityToAdd = itemInfo.stackable ? Math.min(quantity, itemInfo.maxStack) : 1;
                
                character.inventory.push({
                    itemId: itemId,
                    quantity: quantityToAdd,
                    obtainedAt: new Date()
                });

                await character.save();
                
                const remainingQuantity = quantity - quantityToAdd;
                return {
                    success: true,
                    addedQuantity: quantityToAdd,
                    remainingQuantity: remainingQuantity,
                    message: `${quantityToAdd} ${itemInfo.name} agregado al inventario`
                };
            }
        } catch (error) {
            console.error('Error agregando item al inventario:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Remover item del inventario
    static async removeItemFromInventory(characterId, itemId, quantity = 1) {
        try {
            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            const itemIndex = character.inventory.findIndex(
                invItem => invItem.itemId === itemId
            );

            if (itemIndex === -1) {
                return {
                    success: false,
                    message: 'Item no encontrado en el inventario'
                };
            }

            const inventoryItem = character.inventory[itemIndex];
            
            if (inventoryItem.quantity <= quantity) {
                // Remover completamente el item
                character.inventory.splice(itemIndex, 1);
                await character.save();
                
                return {
                    success: true,
                    removedQuantity: inventoryItem.quantity,
                    message: `${inventoryItem.quantity} ${itemId} removido del inventario`
                };
            } else {
                // Reducir cantidad
                inventoryItem.quantity -= quantity;
                await character.save();
                
                return {
                    success: true,
                    removedQuantity: quantity,
                    message: `${quantity} ${itemId} removido del inventario`
                };
            }
        } catch (error) {
            console.error('Error removiendo item del inventario:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Obtener inventario completo con información de items
    static async getInventoryWithItemInfo(characterId) {
        try {
            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            if (!character.inventory || character.inventory.length === 0) {
                return [];
            }

            // Obtener IDs únicos de items
            const itemIds = [...new Set(character.inventory.map(item => item.itemId))];
            
            // Obtener información de todos los items
            const itemsInfo = await ItemService.getItemsInfo(itemIds);
            const itemsMap = new Map(itemsInfo.map(item => [item._id, item]));

            // Combinar inventario con información de items
            const inventoryWithInfo = character.inventory.map(invItem => {
                const itemInfo = itemsMap.get(invItem.itemId);
                return {
                    ...invItem.toObject(),
                    itemInfo: itemInfo || null
                };
            });

            return inventoryWithInfo;
        } catch (error) {
            console.error('Error obteniendo inventario:', error);
            throw error;
        }
    }

    // Agregar kamas al personaje
    static async addKamas(characterId, amount) {
        try {
            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            character.kamas = (character.kamas || 0) + amount;
            await character.save();

            return {
                success: true,
                newTotal: character.kamas,
                message: `+${amount} kamas agregados`
            };
        } catch (error) {
            console.error('Error agregando kamas:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Gastar kamas
    static async spendKamas(characterId, amount) {
        try {
            const character = await Character.findById(characterId);
            if (!character) {
                throw new Error('Personaje no encontrado');
            }

            const currentKamas = character.kamas || 0;
            if (currentKamas < amount) {
                return {
                    success: false,
                    message: 'No tienes suficientes kamas'
                };
            }

            character.kamas = currentKamas - amount;
            await character.save();

            return {
                success: true,
                newTotal: character.kamas,
                message: `-${amount} kamas gastados`
            };
        } catch (error) {
            console.error('Error gastando kamas:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Aplicar drops de combate
    static async applyDrops(characterId, drops) {
        try {
            const results = {
                kamas: null,
                items: []
            };

            // Agregar kamas si hay
            if (drops.kamas && drops.kamas > 0) {
                results.kamas = await this.addKamas(characterId, drops.kamas);
            }

            // Agregar items si hay
            if (drops.items && drops.items.length > 0) {
                for (const item of drops.items) {
                    const result = await this.addItemToInventory(characterId, item.id, item.quantity || 1);
                    results.items.push({
                        itemId: item.id,
                        result: result
                    });
                }
            }

            return {
                success: true,
                results: results
            };
        } catch (error) {
            console.error('Error aplicando drops:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}

module.exports = InventoryService;
