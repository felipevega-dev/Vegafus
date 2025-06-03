/**
 * Panel de inventario detallado
 */
export class InventoryPanel {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.elements = [];
        this.isVisible = false;
        this.selectedSlot = null;
        
        // Configuración del inventario
        this.slotsPerRow = 4;
        this.totalSlots = 20;
        this.slotSize = 32;
        this.slotSpacing = 36;
    }

    create() {
        // Fondo del panel de inventario
        this.background = this.scene.add.rectangle(640, 360, 600, 500, 0x1a1a1a, 0.95);
        this.background.setDepth(2000);
        this.background.setStrokeStyle(3, 0x444444);
        this.background.setInteractive(); // Hacer interactivo para evitar clics que pasen a través
        this.elements.push(this.background);

        // Título
        this.title = this.scene.add.text(640, 150, 'INVENTARIO', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.title.setOrigin(0.5);
        this.title.setDepth(2001);
        this.elements.push(this.title);

        // Información del jugador
        this.playerInfo = this.scene.add.text(640, 180, `${this.player.playerClass} - Nivel ${this.player.level}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc'
        });
        this.playerInfo.setOrigin(0.5);
        this.playerInfo.setDepth(2001);
        this.elements.push(this.playerInfo);

        // Crear slots del inventario
        this.createInventorySlots();

        // Panel de información del objeto seleccionado
        this.createItemInfoPanel();

        // Botón de cerrar
        this.createCloseButton();

        // Configurar eventos de teclado
        this.setupKeyboardEvents();

        // Inicialmente oculto
        this.setVisible(false);
    }

    createInventorySlots() {
        this.slots = [];
        const startX = 640 - ((this.slotsPerRow - 1) * this.slotSpacing) / 2;
        const startY = 220;

        for (let i = 0; i < this.totalSlots; i++) {
            const row = Math.floor(i / this.slotsPerRow);
            const col = i % this.slotsPerRow;
            
            const x = startX + (col * this.slotSpacing);
            const y = startY + (row * this.slotSpacing);

            // Fondo del slot
            const slotBg = this.scene.add.rectangle(x, y, this.slotSize, this.slotSize, 0x333333, 0.8);
            slotBg.setDepth(2001);
            slotBg.setStrokeStyle(1, 0x555555);
            slotBg.setInteractive();
            this.elements.push(slotBg);

            // Texto del slot (número)
            const slotNumber = this.scene.add.text(x - 12, y - 12, (i + 1).toString(), {
                fontSize: '8px',
                fontFamily: 'Arial',
                color: '#888888'
            });
            slotNumber.setDepth(2002);
            this.elements.push(slotNumber);

            // Crear objeto slot
            const slot = {
                index: i,
                x: x,
                y: y,
                background: slotBg,
                number: slotNumber,
                item: null,
                itemSprite: null,
                itemText: null
            };

            // Eventos del slot
            slotBg.on('pointerdown', () => this.selectSlot(slot));
            slotBg.on('pointerover', () => this.hoverSlot(slot, true));
            slotBg.on('pointerout', () => this.hoverSlot(slot, false));

            this.slots.push(slot);
        }

        // Cargar items del inventario
        this.refreshInventory();
    }

    createItemInfoPanel() {
        // Panel de información del item
        this.itemInfoPanel = this.scene.add.rectangle(450, 360, 200, 300, 0x2a2a2a, 0.9);
        this.itemInfoPanel.setDepth(2000);
        this.itemInfoPanel.setStrokeStyle(2, 0x555555);
        this.elements.push(this.itemInfoPanel);

        // Título del panel de info
        this.itemInfoTitle = this.scene.add.text(450, 240, 'Información del Objeto', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.itemInfoTitle.setOrigin(0.5);
        this.itemInfoTitle.setDepth(2001);
        this.elements.push(this.itemInfoTitle);

        // Texto de información del item
        this.itemInfoText = this.scene.add.text(450, 360, 'Selecciona un objeto\npara ver su información', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: 180 }
        });
        this.itemInfoText.setOrigin(0.5);
        this.itemInfoText.setDepth(2001);
        this.elements.push(this.itemInfoText);
    }

    createCloseButton() {
        // Botón de cerrar
        this.closeButton = this.scene.add.rectangle(740, 150, 60, 30, 0x666666, 0.9);
        this.closeButton.setDepth(2001);
        this.closeButton.setStrokeStyle(1, 0x888888);
        this.closeButton.setInteractive();
        this.elements.push(this.closeButton);

        this.closeButtonText = this.scene.add.text(740, 150, 'Cerrar', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.closeButtonText.setOrigin(0.5);
        this.closeButtonText.setDepth(2002);
        this.elements.push(this.closeButtonText);

        // Eventos del botón cerrar
        this.closeButton.on('pointerdown', () => this.hide());
        this.closeButton.on('pointerover', () => {
            this.closeButton.setFillStyle(0x888888);
        });
        this.closeButton.on('pointerout', () => {
            this.closeButton.setFillStyle(0x666666);
        });
    }

    setupKeyboardEvents() {
        // Cerrar con ESC
        this.scene.input.keyboard.on('keydown-ESC', () => {
            if (this.isVisible) {
                this.hide();
            }
        });

        // Abrir/cerrar con I
        this.scene.input.keyboard.on('keydown-I', () => {
            if (this.isVisible) {
                this.hide();
            } else {
                this.show();
            }
        });
    }

    refreshInventory() {
        // Limpiar items existentes
        this.slots.forEach(slot => {
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
            if (index < this.totalSlots) {
                const slot = this.slots[index];
                slot.item = item;

                // Determinar el nombre del item
                let itemName = 'Item';
                let itemRarity = 'common';
                let isStackable = false;
                let quantity = 1;

                // Verificar si el item tiene información completa (itemInfo) o solo itemId
                if (item.itemInfo) {
                    // Item con información completa del backend
                    itemName = item.itemInfo.name || 'Item';
                    itemRarity = item.itemInfo.rarity || 'common';
                    isStackable = item.itemInfo.stackable || false;
                    quantity = item.quantity || 1;
                } else if (item.name) {
                    // Item con información directa
                    itemName = item.name;
                    itemRarity = item.rarity || 'common';
                    isStackable = item.stackable || false;
                    quantity = item.quantity || 1;
                } else {
                    // Item solo con itemId (fallback)
                    itemName = item.itemId || 'Unknown';
                    quantity = item.quantity || 1;
                }

                // Crear representación visual del item
                // Por ahora usamos texto, pero se puede cambiar por sprites
                slot.itemText = this.scene.add.text(slot.x, slot.y, itemName.charAt(0).toUpperCase(), {
                    fontSize: '16px',
                    fontFamily: 'Arial',
                    color: this.getItemColor(itemRarity),
                    fontStyle: 'bold'
                });
                slot.itemText.setOrigin(0.5);
                slot.itemText.setDepth(2002);
                this.elements.push(slot.itemText);

                // Mostrar cantidad si es stackeable y mayor a 1
                if (isStackable && quantity > 1) {
                    slot.quantityText = this.scene.add.text(slot.x + 12, slot.y + 12, quantity.toString(), {
                        fontSize: '10px',
                        fontFamily: 'Arial',
                        color: '#ffffff',
                        backgroundColor: '#000000',
                        padding: { x: 2, y: 1 }
                    });
                    slot.quantityText.setOrigin(1, 1);
                    slot.quantityText.setDepth(2003);
                    this.elements.push(slot.quantityText);
                }
            }
        });
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

    selectSlot(slot) {
        // Deseleccionar slot anterior
        if (this.selectedSlot) {
            this.selectedSlot.background.setStrokeStyle(1, 0x555555);
        }

        // Seleccionar nuevo slot
        this.selectedSlot = slot;
        slot.background.setStrokeStyle(2, 0xffff00);

        // Mostrar información del item
        this.showItemInfo(slot.item);
    }

    hoverSlot(slot, isHover) {
        if (slot !== this.selectedSlot) {
            if (isHover) {
                slot.background.setFillStyle(0x444444);
            } else {
                slot.background.setFillStyle(0x333333);
            }
        }
    }

    showItemInfo(item) {
        if (!item) {
            this.itemInfoText.setText('Slot vacío\n\nPuedes colocar\nobjetos aquí');
            return;
        }

        // Determinar la información del item
        let itemData = null;
        if (item.itemInfo) {
            itemData = item.itemInfo;
        } else if (item.name) {
            itemData = item;
        } else {
            // Solo tenemos itemId
            this.itemInfoText.setText(`Item ID: ${item.itemId || 'Unknown'}\nCantidad: ${item.quantity || 1}\n\nInformación no disponible`);
            return;
        }

        let info = `${itemData.name || 'Item desconocido'}\n\n`;
        info += `Tipo: ${itemData.type || 'Objeto'}\n`;
        info += `Rareza: ${itemData.rarity || 'Común'}\n`;

        if (item.quantity && item.quantity > 1) {
            info += `Cantidad: ${item.quantity}\n`;
        }

        info += '\n';

        if (itemData.description) {
            info += `${itemData.description}\n\n`;
        }

        if (itemData.stats) {
            info += 'Estadísticas:\n';
            Object.entries(itemData.stats).forEach(([stat, value]) => {
                info += `${stat}: +${value}\n`;
            });
        }

        this.itemInfoText.setText(info);
    }

    show() {
        this.isVisible = true;
        this.setVisible(true);
        this.refreshInventory();
    }

    hide() {
        this.isVisible = false;
        this.setVisible(false);
        this.selectedSlot = null;
    }

    setVisible(visible) {
        this.elements.forEach(element => {
            element.setVisible(visible);
        });
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
