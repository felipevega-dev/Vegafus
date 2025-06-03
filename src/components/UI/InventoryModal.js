import { LayoutConfig, LayoutUtils } from '../../config/LayoutConfig.js';

/**
 * Modal de inventario mejorado con equipamiento
 * Basado en la imagen inventarioabirto.png
 */
export class InventoryModal {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.isVisible = false;
        this.elements = [];
        
        // Configuración de slots
        this.equipmentSlots = {
            helmet: { x: 100, y: 100, equipped: null },
            amulet: { x: 200, y: 100, equipped: null },
            ring1: { x: 300, y: 100, equipped: null },
            weapon: { x: 100, y: 200, equipped: null },
            armor: { x: 200, y: 200, equipped: null },
            shield: { x: 300, y: 200, equipped: null },
            belt: { x: 100, y: 300, equipped: null },
            boots: { x: 200, y: 300, equipped: null },
            ring2: { x: 300, y: 300, equipped: null }
        };
        
        // Configuración del grid de inventario
        this.inventoryGrid = {
            startX: 400,
            startY: 150,
            slotSize: 32,
            slotsPerRow: 8,
            rows: 6,
            spacing: 4
        };
        
        this.selectedItem = null;
        this.selectedSlot = null;
        this.inventorySlots = [];
        
        this.createModal();
        this.setupEvents();
    }

    createModal() {
        const centerX = LayoutConfig.GAME_WIDTH / 2;
        const centerY = LayoutConfig.GAME_HEIGHT / 2;
        
        // Fondo del modal
        this.background = this.scene.add.rectangle(
            centerX, centerY, 
            700, 500, 
            0x2a2a2a, 0.95
        );
        this.background.setDepth(3000);
        this.background.setStrokeStyle(3, 0x8b4513);
        this.elements.push(this.background);
        
        // Título
        this.title = this.scene.add.text(
            centerX, centerY - 220,
            'INVENTARIO',
            LayoutUtils.createTextStyle('TITLE', { 
                color: '#d4af37',
                fontSize: '24px'
            })
        );
        this.title.setOrigin(0.5);
        this.title.setDepth(3001);
        this.elements.push(this.title);
        
        // Crear slots de equipamiento
        this.createEquipmentSlots();
        
        // Crear grid de inventario
        this.createInventoryGrid();
        
        // Panel de información del item
        this.createItemInfoPanel();
        
        // Botón de cerrar
        this.createCloseButton();
        
        // Inicialmente oculto
        this.hide();
    }

    createEquipmentSlots() {
        const baseX = LayoutConfig.GAME_WIDTH / 2 - 250;
        const baseY = LayoutConfig.GAME_HEIGHT / 2 - 150;
        
        // Posiciones específicas para cada slot de equipamiento
        const slotPositions = {
            helmet: { x: baseX + 80, y: baseY + 20 },
            amulet: { x: baseX + 140, y: baseY + 20 },
            ring1: { x: baseX + 200, y: baseY + 20 },
            weapon: { x: baseX + 20, y: baseY + 80 },
            armor: { x: baseX + 80, y: baseY + 80 },
            shield: { x: baseX + 140, y: baseY + 80 },
            belt: { x: baseX + 80, y: baseY + 140 },
            boots: { x: baseX + 80, y: baseY + 200 },
            ring2: { x: baseX + 200, y: baseY + 80 }
        };
        
        Object.keys(this.equipmentSlots).forEach(slotType => {
            const pos = slotPositions[slotType];
            const slot = this.createEquipmentSlot(pos.x, pos.y, slotType);
            this.equipmentSlots[slotType].slot = slot;
        });
    }

    createEquipmentSlot(x, y, slotType) {
        // Fondo del slot
        const slotBg = this.scene.add.rectangle(x, y, 36, 36, 0x4a4a4a, 0.8);
        slotBg.setDepth(3001);
        slotBg.setStrokeStyle(2, 0x666666);
        slotBg.setInteractive();
        this.elements.push(slotBg);
        
        // Texto indicador del tipo de slot
        const slotLabel = this.scene.add.text(x, y + 25, this.getSlotLabel(slotType), {
            fontSize: '8px',
            fontFamily: 'Arial',
            color: '#cccccc'
        });
        slotLabel.setOrigin(0.5);
        slotLabel.setDepth(3002);
        this.elements.push(slotLabel);
        
        // Eventos del slot
        slotBg.on('pointerdown', () => this.onEquipmentSlotClick(slotType));
        slotBg.on('pointerover', () => this.onEquipmentSlotHover(slotType, true));
        slotBg.on('pointerout', () => this.onEquipmentSlotHover(slotType, false));
        
        return {
            background: slotBg,
            label: slotLabel,
            type: slotType,
            x: x,
            y: y,
            itemSprite: null
        };
    }

    getSlotLabel(slotType) {
        const labels = {
            helmet: 'Casco',
            amulet: 'Amuleto',
            ring1: 'Anillo',
            ring2: 'Anillo',
            weapon: 'Arma',
            armor: 'Armadura',
            shield: 'Escudo',
            belt: 'Cinturón',
            boots: 'Botas'
        };
        return labels[slotType] || slotType;
    }

    createInventoryGrid() {
        const config = this.inventoryGrid;
        const baseX = LayoutConfig.GAME_WIDTH / 2 + 50;
        const baseY = LayoutConfig.GAME_HEIGHT / 2 - 150;
        
        const totalSlots = config.slotsPerRow * config.rows;
        
        for (let i = 0; i < totalSlots; i++) {
            const row = Math.floor(i / config.slotsPerRow);
            const col = i % config.slotsPerRow;
            
            const x = baseX + (col * (config.slotSize + config.spacing));
            const y = baseY + (row * (config.slotSize + config.spacing));
            
            const slot = this.createInventorySlot(x, y, i);
            this.inventorySlots.push(slot);
        }
    }

    createInventorySlot(x, y, index) {
        // Fondo del slot
        const slotBg = this.scene.add.rectangle(x, y, this.inventoryGrid.slotSize, this.inventoryGrid.slotSize, 0x333333, 0.8);
        slotBg.setDepth(3001);
        slotBg.setStrokeStyle(1, 0x555555);
        slotBg.setInteractive();
        this.elements.push(slotBg);
        
        // Eventos del slot
        slotBg.on('pointerdown', () => this.onInventorySlotClick(index));
        slotBg.on('pointerover', () => this.onInventorySlotHover(index, true));
        slotBg.on('pointerout', () => this.onInventorySlotHover(index, false));
        
        return {
            background: slotBg,
            index: index,
            x: x,
            y: y,
            item: null,
            itemSprite: null,
            itemText: null,
            quantityText: null
        };
    }

    createItemInfoPanel() {
        const panelX = LayoutConfig.GAME_WIDTH / 2 - 250;
        const panelY = LayoutConfig.GAME_HEIGHT / 2 + 100;
        
        // Fondo del panel de información
        this.itemInfoBg = this.scene.add.rectangle(panelX, panelY, 200, 120, 0x1a1a1a, 0.9);
        this.itemInfoBg.setDepth(3001);
        this.itemInfoBg.setStrokeStyle(2, 0x666666);
        this.elements.push(this.itemInfoBg);
        
        // Texto de información del item
        this.itemInfoText = this.scene.add.text(panelX, panelY - 40, 'Selecciona un objeto\npara ver su información', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 180 }
        });
        this.itemInfoText.setOrigin(0.5, 0);
        this.itemInfoText.setDepth(3002);
        this.elements.push(this.itemInfoText);
        
        // Botones de acción
        this.createActionButtons(panelX, panelY + 40);
    }

    createActionButtons(x, y) {
        // Botón Equipar
        this.equipButton = this.scene.add.rectangle(x - 50, y, 80, 25, 0x4a7c59, 0.8);
        this.equipButton.setDepth(3001);
        this.equipButton.setStrokeStyle(1, 0x6b9b7f);
        this.equipButton.setInteractive();
        this.elements.push(this.equipButton);
        
        this.equipButtonText = this.scene.add.text(x - 50, y, 'Equipar', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.equipButtonText.setOrigin(0.5);
        this.equipButtonText.setDepth(3002);
        this.elements.push(this.equipButtonText);
        
        // Botón Desequipar
        this.unequipButton = this.scene.add.rectangle(x + 50, y, 80, 25, 0x7c4a4a, 0.8);
        this.unequipButton.setDepth(3001);
        this.unequipButton.setStrokeStyle(1, 0x9b6b6b);
        this.unequipButton.setInteractive();
        this.elements.push(this.unequipButton);
        
        this.unequipButtonText = this.scene.add.text(x + 50, y, 'Desequipar', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.unequipButtonText.setOrigin(0.5);
        this.unequipButtonText.setDepth(3002);
        this.elements.push(this.unequipButtonText);
        
        // Eventos de botones
        this.equipButton.on('pointerdown', () => this.equipSelectedItem());
        this.unequipButton.on('pointerdown', () => this.unequipSelectedItem());
        
        // Inicialmente ocultos
        this.updateActionButtons();
    }

    createCloseButton() {
        const closeX = LayoutConfig.GAME_WIDTH / 2 + 320;
        const closeY = LayoutConfig.GAME_HEIGHT / 2 - 220;

        this.closeButton = this.scene.add.rectangle(closeX, closeY, 30, 30, 0x666666, 0.8);
        this.closeButton.setDepth(3001);
        this.closeButton.setStrokeStyle(2, 0x888888);
        this.closeButton.setInteractive();
        this.elements.push(this.closeButton);

        this.closeButtonText = this.scene.add.text(closeX, closeY, 'X', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.closeButtonText.setOrigin(0.5);
        this.closeButtonText.setDepth(3002);
        this.elements.push(this.closeButtonText);

        this.closeButton.on('pointerdown', () => this.hide());
        this.closeButton.on('pointerover', () => this.closeButton.setFillStyle(0x888888));
        this.closeButton.on('pointerout', () => this.closeButton.setFillStyle(0x666666));
    }

    setupEvents() {
        // Cerrar con ESC
        this.scene.input.keyboard.on('keydown-ESC', () => {
            if (this.isVisible) {
                this.hide();
            }
        });
    }

    // Event handlers
    onEquipmentSlotClick(slotType) {
        const slot = this.equipmentSlots[slotType];
        if (slot.equipped) {
            this.selectItem(slot.equipped, 'equipment', slotType);
        }
    }

    onEquipmentSlotHover(slotType, isHover) {
        const slot = this.equipmentSlots[slotType].slot;
        if (isHover) {
            slot.background.setFillStyle(0x6a6a6a);
        } else {
            slot.background.setFillStyle(0x4a4a4a);
        }
    }

    onInventorySlotClick(index) {
        const slot = this.inventorySlots[index];
        if (slot.item) {
            this.selectItem(slot.item, 'inventory', index);
        }
    }

    onInventorySlotHover(index, isHover) {
        const slot = this.inventorySlots[index];
        if (isHover) {
            slot.background.setFillStyle(0x4a4a4a);
        } else {
            slot.background.setFillStyle(0x333333);
        }
    }

    selectItem(item, source, sourceIndex) {
        this.selectedItem = item;
        this.selectedSource = source;
        this.selectedSourceIndex = sourceIndex;

        this.updateItemInfo(item);
        this.updateActionButtons();
    }

    updateItemInfo(item) {
        if (!item) {
            this.itemInfoText.setText('Selecciona un objeto\npara ver su información');
            return;
        }

        let itemData = null;
        if (item.itemInfo) {
            itemData = item.itemInfo;
        } else if (item.name) {
            itemData = item;
        } else {
            this.itemInfoText.setText(`Item ID: ${item.itemId || 'Unknown'}\nCantidad: ${item.quantity || 1}\n\nInformación no disponible`);
            return;
        }

        let info = `${itemData.name || 'Item desconocido'}\n\n`;
        info += `Tipo: ${itemData.type || 'Objeto'}\n`;
        info += `Rareza: ${itemData.rarity || 'Común'}\n`;

        if (item.quantity && item.quantity > 1) {
            info += `Cantidad: ${item.quantity}\n`;
        }

        if (itemData.stats) {
            info += '\nEstadísticas:\n';
            Object.keys(itemData.stats).forEach(stat => {
                if (itemData.stats[stat] > 0) {
                    info += `+${itemData.stats[stat]} ${stat}\n`;
                }
            });
        }

        if (itemData.description) {
            info += `\n${itemData.description}`;
        }

        this.itemInfoText.setText(info);
    }

    updateActionButtons() {
        const hasSelectedItem = this.selectedItem !== null;
        const isEquippable = hasSelectedItem && this.selectedItem.itemInfo && this.selectedItem.itemInfo.type === 'equipment';
        const isEquipped = hasSelectedItem && this.selectedSource === 'equipment';

        // Mostrar/ocultar botones según el contexto
        this.equipButton.setVisible(hasSelectedItem && isEquippable && !isEquipped);
        this.equipButtonText.setVisible(hasSelectedItem && isEquippable && !isEquipped);

        this.unequipButton.setVisible(hasSelectedItem && isEquipped);
        this.unequipButtonText.setVisible(hasSelectedItem && isEquipped);
    }

    equipSelectedItem() {
        console.log('🎯 Intentando equipar item seleccionado:', this.selectedItem);

        if (!this.selectedItem) {
            console.log('❌ No hay item seleccionado');
            return;
        }

        if (!this.selectedItem.itemInfo) {
            console.log('❌ Item no tiene información:', this.selectedItem);
            return;
        }

        const itemData = this.selectedItem.itemInfo;
        console.log('📋 Datos del item:', itemData);

        const equipSlot = this.getEquipmentSlotForItem(itemData);

        if (!equipSlot) {
            console.log('❌ No se puede equipar este item - slot no válido');
            return;
        }

        console.log('⚔️ Equipando item en slot:', equipSlot);
        // Llamar al backend para equipar el item
        this.equipItem(this.selectedItem, equipSlot);
    }

    unequipSelectedItem() {
        if (!this.selectedItem || this.selectedSource !== 'equipment') return;

        // Llamar al backend para desequipar el item
        this.unequipItem(this.selectedSourceIndex);
    }

    getEquipmentSlotForItem(itemData) {
        console.log('🔍 Determinando slot para item:', itemData);

        // Verificar que es un item de equipamiento
        if (itemData.type !== 'equipment') {
            console.log('❌ Item no es de tipo equipment:', itemData.type);
            return null;
        }

        // Mapear subtipos de items a slots de equipamiento
        const slotMapping = {
            'helmet': 'helmet',
            'armor': 'armor',
            'weapon': 'weapon',
            'shield': 'shield',
            'boots': 'boots',
            'belt': 'belt',
            'amulet': 'amulet',
            'ring': 'ring1' // Por defecto ring1, luego verificar si está ocupado
        };

        let targetSlot = slotMapping[itemData.subtype];

        if (!targetSlot) {
            console.log('❌ No se encontró slot para subtype:', itemData.subtype);
            return null;
        }

        // Para anillos, verificar cuál slot está disponible
        if (itemData.subtype === 'ring') {
            if (!this.equipmentSlots.ring1.equipped) {
                targetSlot = 'ring1';
            } else if (!this.equipmentSlots.ring2.equipped) {
                targetSlot = 'ring2';
            } else {
                targetSlot = 'ring1'; // Reemplazar el primero si ambos están ocupados
            }
        }

        console.log('✅ Slot determinado:', targetSlot);
        return targetSlot;
    }

    // API calls para equipar/desequipar
    async equipItem(item, slotType) {
        try {
            console.log('🌐 Enviando petición de equipar al backend...');
            console.log('📦 Item:', item);
            console.log('🎯 Slot:', slotType);
            console.log('👤 Player ID:', this.player.id);

            const requestBody = {
                itemId: item.itemId,
                slot: slotType
            };
            console.log('📤 Request body:', requestBody);

            const response = await fetch(`/api/equipment/${this.player.id}/equip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 Response status:', response.status);
            const result = await response.json();
            console.log('📥 Response data:', result);

            if (result.success) {
                // Actualizar el estado local
                this.updateEquipmentDisplay();
                this.refreshInventory();
                console.log('✅ Item equipado exitosamente');
            } else {
                console.error('❌ Error equipando item:', result.message);
            }
        } catch (error) {
            console.error('❌ Error en la petición de equipar:', error);
        }
    }

    async unequipItem(slotType) {
        try {
            const response = await fetch(`/api/equipment/${this.player.id}/unequip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    slot: slotType
                })
            });

            const result = await response.json();
            if (result.success) {
                // Actualizar el estado local
                this.updateEquipmentDisplay();
                this.refreshInventory();
                console.log('Item desequipado exitosamente');
            } else {
                console.error('Error desequipando item:', result.message);
            }
        } catch (error) {
            console.error('Error en la petición de desequipar:', error);
        }
    }

    // Actualizar displays
    refreshInventory() {
        // Limpiar items existentes en el grid
        this.inventorySlots.forEach(slot => {
            if (slot.itemSprite) {
                slot.itemSprite.destroy();
                slot.itemSprite = null;
            }
            if (slot.itemText) {
                slot.itemText.destroy();
                slot.itemText = null;
            }
            if (slot.quantityText) {
                slot.quantityText.destroy();
                slot.quantityText = null;
            }
            slot.item = null;
        });

        // Cargar items del jugador
        const inventory = this.player.inventory || [];

        inventory.forEach((item, index) => {
            if (index < this.inventorySlots.length) {
                const slot = this.inventorySlots[index];
                slot.item = item;

                // Determinar el nombre del item
                let itemName = 'Item';
                let itemRarity = 'common';
                let isStackable = false;
                let quantity = 1;

                if (item.itemInfo) {
                    itemName = item.itemInfo.name;
                    itemRarity = item.itemInfo.rarity || 'common';
                    isStackable = item.itemInfo.stackable || false;
                    quantity = item.quantity || 1;
                } else if (item.name) {
                    itemName = item.name;
                    itemRarity = item.rarity || 'common';
                    isStackable = item.stackable || false;
                    quantity = item.quantity || 1;
                } else {
                    quantity = item.quantity || 1;
                }

                // Crear representación visual del item
                slot.itemText = this.scene.add.text(slot.x, slot.y, itemName.charAt(0).toUpperCase(), {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: this.getItemColor(itemRarity),
                    fontStyle: 'bold'
                });
                slot.itemText.setOrigin(0.5);
                slot.itemText.setDepth(3002);
                this.elements.push(slot.itemText);

                // Mostrar cantidad si es stackeable y mayor a 1
                if (isStackable && quantity > 1) {
                    slot.quantityText = this.scene.add.text(slot.x + 12, slot.y + 12, quantity.toString(), {
                        fontSize: '8px',
                        fontFamily: 'Arial',
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        padding: { x: 2, y: 1 }
                    });
                    slot.quantityText.setOrigin(1, 1);
                    slot.quantityText.setDepth(3003);
                    this.elements.push(slot.quantityText);
                }
            }
        });
    }

    updateEquipmentDisplay() {
        // Limpiar equipamiento existente
        Object.keys(this.equipmentSlots).forEach(slotType => {
            const slotData = this.equipmentSlots[slotType];
            const slot = slotData.slot;

            if (slot.itemSprite) {
                slot.itemSprite.destroy();
                slot.itemSprite = null;
            }
        });

        // Cargar equipamiento del jugador
        if (this.player.equipment) {
            Object.keys(this.player.equipment).forEach(slotType => {
                const equippedItem = this.player.equipment[slotType];
                if (equippedItem && this.equipmentSlots[slotType]) {
                    this.equipmentSlots[slotType].equipped = equippedItem;

                    // Crear representación visual
                    const slot = this.equipmentSlots[slotType].slot;
                    const itemName = equippedItem.itemInfo ? equippedItem.itemInfo.name : 'Item';
                    const itemRarity = equippedItem.itemInfo ? equippedItem.itemInfo.rarity : 'common';

                    slot.itemSprite = this.scene.add.text(slot.x, slot.y, itemName.charAt(0).toUpperCase(), {
                        fontSize: '14px',
                        fontFamily: 'Arial',
                        color: this.getItemColor(itemRarity),
                        fontStyle: 'bold'
                    });
                    slot.itemSprite.setOrigin(0.5);
                    slot.itemSprite.setDepth(3002);
                    this.elements.push(slot.itemSprite);
                }
            });
        }
    }

    getItemColor(rarity) {
        const colors = {
            common: '#ffffff',
            uncommon: '#00ff00',
            rare: '#0080ff',
            epic: '#8000ff',
            legendary: '#ff8000'
        };
        return colors[rarity] || colors.common;
    }

    // Mostrar/ocultar modal
    show() {
        this.isVisible = true;
        this.elements.forEach(element => element.setVisible(true));
        this.refreshInventory();
        this.updateEquipmentDisplay();
        this.selectedItem = null;
        this.updateActionButtons();

        // Bloquear movimiento del jugador
        this.disablePlayerMovement();
    }

    hide() {
        this.isVisible = false;
        this.elements.forEach(element => element.setVisible(false));
        this.selectedItem = null;

        // Restaurar movimiento del jugador
        this.enablePlayerMovement();
    }

    disablePlayerMovement() {
        // Deshabilitar input de mouse para movimiento
        if (this.scene.input) {
            this.scene.input.off('pointerdown', this.scene.handleMouseClick, this.scene);

            // Si existe un sistema de movimiento, deshabilitarlo
            if (this.scene.movementSystem) {
                this.scene.movementSystem.disabled = true;
            }

            // Marcar que el movimiento está bloqueado
            this.scene.movementBlocked = true;
        }
    }

    enablePlayerMovement() {
        // Rehabilitar input de mouse para movimiento
        if (this.scene.input) {
            // Reconectar el handler de mouse según el tipo de escena
            if (this.scene.handleMouseClick) {
                this.scene.input.on('pointerdown', this.scene.handleMouseClick, this.scene);
            }

            // Si existe un sistema de movimiento, habilitarlo
            if (this.scene.movementSystem) {
                this.scene.movementSystem.disabled = false;
            }

            // Desmarcar que el movimiento está bloqueado
            this.scene.movementBlocked = false;
        }
    }

    destroy() {
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
    }
}
