import { LayoutConfig, LayoutUtils } from '@config/LayoutConfig.js';

/**
 * Panel lateral derecho con acceso a inventario, características, hechizos, etc.
 */
export class RightSidePanel {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.elements = [];
        this.isVisible = true;
        this.activePanel = null; // 'inventory', 'characteristics', 'spells', etc.
        
        this.create();
    }

    create() {
        console.log('🎮 Iniciando creación del panel lateral derecho...');

        const rightPanel = LayoutConfig.RIGHT_PANEL;
        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;

        // Panel principal del lado derecho
        this.mainPanel = this.scene.add.rectangle(
            rightPanel.x + rightPanel.width / 2,
            rightPanel.y + rightPanel.height / 2,
            rightPanel.width,
            rightPanel.height,
            colors.PANEL_BG,
            0.95
        );
        this.mainPanel.setDepth(depths.UI_BACKGROUND);
        this.mainPanel.setStrokeStyle(2, colors.PANEL_BORDER);
        this.elements.push(this.mainPanel);

        // Título del panel
        this.titleText = this.scene.add.text(
            rightPanel.x + rightPanel.width / 2 - 20,
            50,
            'MENÚ',
            LayoutUtils.createTextStyle('TITLE', { color: colors.TEXT_ACCENT })
        );
        this.titleText.setOrigin(0.5);
        this.titleText.setDepth(depths.UI_TEXT);
        this.elements.push(this.titleText);

        // Botón de configuración separado
        this.configButton = this.scene.add.text(
            rightPanel.x + rightPanel.width / 2 + 30,
            50,
            '⚙️',
            LayoutUtils.createTextStyle('TITLE', { color: colors.TEXT_SECONDARY })
        );
        this.configButton.setOrigin(0.5);
        this.configButton.setDepth(depths.UI_TEXT);
        this.configButton.setInteractive();
        this.configButton.on('pointerdown', () => this.showConfigMenu());
        this.configButton.on('pointerover', () => {
            this.configButton.setColor('#ffffff');
        });
        this.configButton.on('pointerout', () => {
            this.configButton.setColor(colors.TEXT_SECONDARY);
        });
        this.elements.push(this.configButton);

        console.log('🎮 Panel creado en posición:', rightPanel.x, rightPanel.y);

        // Crear área de contenido
        this.createContentArea();

        // Crear botones del menú (siempre visibles)
        this.createMenuButtons();
    }

    createContentArea() {
        const rightPanel = LayoutConfig.RIGHT_PANEL;
        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;
        const contentArea = rightPanel.CONTENT_AREA;

        // Área de contenido dinámico
        this.contentArea = this.scene.add.rectangle(
            contentArea.x,
            contentArea.y,
            contentArea.width,
            contentArea.height,
            colors.PANEL_BG,
            0.8
        );
        this.contentArea.setDepth(depths.UI_BACKGROUND);
        this.contentArea.setStrokeStyle(1, colors.PANEL_BORDER);
        this.elements.push(this.contentArea);

        // Texto de contenido por defecto
        this.contentText = this.scene.add.text(
            contentArea.x,
            contentArea.y,
            'Selecciona una opción\ndel menú para ver\nsu contenido',
            LayoutUtils.createTextStyle('BODY', {
                align: 'center',
                wordWrap: { width: contentArea.width - 20 }
            })
        );
        this.contentText.setOrigin(0.5);
        this.contentText.setDepth(depths.UI_TEXT);
        this.elements.push(this.contentText);
    }

    createMenuButtons() {
        console.log('🎮 Creando botones del menú...');

        const buttons = [
            { text: 'Inventario', key: 'I', action: () => this.showInventoryModal() },
            { text: 'Características', key: 'C', action: () => this.showCharacteristics() },
            { text: 'Hechizos', key: 'H', action: () => this.showSpellsModal() }
        ];

        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;
        const menuConfig = LayoutConfig.RIGHT_PANEL.MENU_BUTTONS;

        buttons.forEach((button, index) => {
            const position = LayoutUtils.getMenuButtonPosition(index);

            // Fondo del botón
            const buttonBg = this.scene.add.rectangle(
                position.x,
                position.y,
                menuConfig.width,
                menuConfig.height,
                colors.BUTTON_BG,
                0.9
            );
            buttonBg.setDepth(depths.UI_ELEMENTS);
            buttonBg.setStrokeStyle(2, colors.PANEL_BORDER);
            buttonBg.setInteractive();
            this.elements.push(buttonBg);

            // Texto del botón
            const buttonText = this.scene.add.text(
                position.x,
                position.y,
                `${button.text} (${button.key})`,
                LayoutUtils.createTextStyle('BUTTON', { color: colors.TEXT_PRIMARY })
            );
            buttonText.setOrigin(0.5);
            buttonText.setDepth(depths.UI_TEXT);
            this.elements.push(buttonText);

            // Eventos del botón
            buttonBg.on('pointerdown', button.action);
            buttonBg.on('pointerover', () => {
                buttonBg.setFillStyle(colors.BUTTON_HOVER);
                buttonText.setColor(colors.TEXT_ACCENT);
            });
            buttonBg.on('pointerout', () => {
                buttonBg.setFillStyle(colors.BUTTON_BG);
                buttonText.setColor(colors.TEXT_PRIMARY);
            });

            console.log(`🎮 Botón ${button.text} creado en posición:`, position.x, position.y);
        });

        // Configurar atajos de teclado
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        // Inventario (I)
        this.scene.input.keyboard.on('keydown-I', () => this.showInventoryModal());

        // Características (C)
        this.scene.input.keyboard.on('keydown-C', () => this.showCharacteristics());

        // Hechizos (H)
        this.scene.input.keyboard.on('keydown-H', () => this.showSpellsModal());
    }

    async showInventoryModal() {
        console.log('🎒 Abriendo modal de inventario...');

        // Mostrar loading mientras carga
        this.createInventoryLoadingModal();

        // Cargar inventario desde backend para sincronizar
        await this.loadInventoryFromBackend();

        // Crear modal con datos actualizados
        this.hideInventoryModal(); // Limpiar loading
        this.createInventoryModal();
    }

    createInventoryLoadingModal() {
        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;

        // Fondo semi-transparente
        this.inventoryModalBg = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            LayoutConfig.GAME_WIDTH,
            LayoutConfig.GAME_HEIGHT,
            0x000000,
            0.7
        );
        this.inventoryModalBg.setDepth(depths.MODAL_BACKGROUND);
        this.inventoryModalBg.setInteractive();

        // Panel del inventario
        this.inventoryModalPanel = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            500,
            400,
            colors.PANEL_BG,
            0.95
        );
        this.inventoryModalPanel.setDepth(depths.MODAL_ELEMENTS);
        this.inventoryModalPanel.setStrokeStyle(3, colors.PANEL_BORDER);

        // Título del modal
        this.inventoryModalTitle = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 170,
            'INVENTARIO',
            LayoutUtils.createTextStyle('TITLE', { color: colors.TEXT_ACCENT })
        );
        this.inventoryModalTitle.setOrigin(0.5);
        this.inventoryModalTitle.setDepth(depths.MODAL_ELEMENTS + 1);

        // Mensaje de carga
        this.inventoryModalContent = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            'Cargando inventario...\n\n⏳',
            LayoutUtils.createTextStyle('BODY', {
                color: colors.TEXT_PRIMARY,
                align: 'center'
            })
        );
        this.inventoryModalContent.setOrigin(0.5);
        this.inventoryModalContent.setDepth(depths.MODAL_ELEMENTS + 1);

        // Guardar referencias
        this.inventoryModalElements = [
            this.inventoryModalBg,
            this.inventoryModalPanel,
            this.inventoryModalTitle,
            this.inventoryModalContent
        ];
    }

    async loadInventoryFromBackend() {
        try {
            const characterId = this.scene.registry.get('currentCharacterId');
            if (!characterId) {
                console.warn('⚠️ No se encontró ID del personaje');
                return;
            }

            const { apiClient } = await import('../../utils/ApiClient.js');

            // Usar el endpoint específico de inventario que incluye información completa de items
            console.log('🔄 Cargando inventario con información completa desde backend...');
            const inventoryResponse = await apiClient.getInventory(characterId);

            if (inventoryResponse && inventoryResponse.success) {
                const inventoryData = inventoryResponse.data;

                // Actualizar datos del jugador con la información del backend
                this.player.kamas = inventoryData.kamas || 0;
                this.player.inventory = inventoryData.inventory || [];

                console.log('✅ Inventario sincronizado desde backend:', {
                    kamas: this.player.kamas,
                    items: this.player.inventory.length,
                    sampleItem: this.player.inventory[0] || 'No items'
                });

                // También cargar datos básicos del personaje
                const characterResponse = await apiClient.getCharacter(characterId);
                if (characterResponse && characterResponse.character) {
                    const character = characterResponse.character;
                    this.player.level = character.level || this.player.level;
                    this.player.experience = character.experience || this.player.experience;
                }
            } else {
                console.error('❌ Error cargando inventario desde backend, usando fallback');

                // Fallback: cargar datos básicos del personaje
                const response = await apiClient.getCharacter(characterId);
                if (response && response.character) {
                    const character = response.character;
                    this.player.kamas = character.kamas || 0;
                    this.player.inventory = character.inventory || [];
                    this.player.level = character.level || this.player.level;
                    this.player.experience = character.experience || this.player.experience;
                }
            }
        } catch (error) {
            console.error('❌ Error conectando con backend para inventario:', error);
        }
    }

    createInventoryModal() {
        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;

        // Fondo semi-transparente
        this.inventoryModalBg = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            LayoutConfig.GAME_WIDTH,
            LayoutConfig.GAME_HEIGHT,
            0x000000,
            0.7
        );
        this.inventoryModalBg.setDepth(depths.MODAL_BACKGROUND);
        this.inventoryModalBg.setInteractive(); // Solo para bloquear clics que pasen a través

        // Panel del inventario
        this.inventoryModalPanel = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            500,
            400,
            colors.PANEL_BG,
            0.95
        );
        this.inventoryModalPanel.setDepth(depths.MODAL_ELEMENTS);
        this.inventoryModalPanel.setStrokeStyle(3, colors.PANEL_BORDER);

        // Título del modal
        this.inventoryModalTitle = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 170,
            'INVENTARIO',
            LayoutUtils.createTextStyle('TITLE', { color: colors.TEXT_ACCENT })
        );
        this.inventoryModalTitle.setOrigin(0.5);
        this.inventoryModalTitle.setDepth(depths.MODAL_ELEMENTS + 1);

        // Contenido del inventario
        const items = this.player.inventory || [];
        const kamas = this.player.kamas || 0;
        const prospection = this.player.getProspection ? this.player.getProspection() : 100;

        let inventoryText = `💰 Kamas: ${kamas}\n🔍 Prospección: ${prospection}%\n\n`;

        if (items.length === 0) {
            inventoryText += 'Tu inventario está vacío.\n\nAquí aparecerán los objetos\nque encuentres en tu aventura.\n\n• Armas\n• Armaduras\n• Pociones\n• Objetos especiales';
        } else {
            inventoryText += `📦 Objetos: ${items.length}\n\n`;
            items.forEach((item, index) => {
                // Determinar información del item
                let itemName = 'Item desconocido';
                let itemRarity = 'common';
                let itemDescription = '';
                let isStackable = false;
                let quantity = 1;

                if (item.itemInfo) {
                    // Item con información completa del backend
                    itemName = item.itemInfo.name || 'Item';
                    itemRarity = item.itemInfo.rarity || 'common';
                    itemDescription = item.itemInfo.description || '';
                    isStackable = item.itemInfo.stackable || false;
                    quantity = item.quantity || 1;
                } else if (item.name) {
                    // Item con información directa
                    itemName = item.name;
                    itemRarity = item.rarity || 'common';
                    itemDescription = item.description || '';
                    isStackable = item.stackable || false;
                    quantity = item.quantity || 1;
                } else {
                    // Item solo con itemId
                    itemName = item.itemId || 'Unknown';
                    quantity = item.quantity || 1;
                }

                const rarityColor = this.getItemRaritySymbol(itemRarity);
                inventoryText += `${index + 1}. ${rarityColor} ${itemName}`;
                if (isStackable && quantity > 1) {
                    inventoryText += ` (x${quantity})`;
                }
                inventoryText += '\n';
                if (itemDescription) {
                    inventoryText += `   ${itemDescription}\n`;
                }
                inventoryText += '\n';
            });
        }

        this.inventoryModalContent = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 50,
            inventoryText,
            LayoutUtils.createTextStyle('BODY', {
                color: colors.TEXT_PRIMARY,
                align: 'center',
                wordWrap: { width: 450 }
            })
        );
        this.inventoryModalContent.setOrigin(0.5);
        this.inventoryModalContent.setDepth(depths.MODAL_ELEMENTS + 1);

        // Botón de cerrar
        this.closeInventoryButton = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 + 150,
            'Cerrar (ESC)',
            LayoutUtils.createTextStyle('BUTTON', { color: colors.TEXT_SECONDARY })
        );
        this.closeInventoryButton.setOrigin(0.5);
        this.closeInventoryButton.setDepth(depths.MODAL_ELEMENTS + 1);
        this.closeInventoryButton.setInteractive();
        this.closeInventoryButton.on('pointerdown', () => this.hideInventoryModal());
        this.closeInventoryButton.on('pointerover', () => {
            this.closeInventoryButton.setColor(colors.TEXT_PRIMARY);
        });
        this.closeInventoryButton.on('pointerout', () => {
            this.closeInventoryButton.setColor(colors.TEXT_SECONDARY);
        });

        // Guardar referencias
        this.inventoryModalElements = [
            this.inventoryModalBg,
            this.inventoryModalPanel,
            this.inventoryModalTitle,
            this.inventoryModalContent,
            this.closeInventoryButton
        ];

        // Atajo ESC para cerrar
        this.scene.input.keyboard.once('keydown-ESC', () => this.hideInventoryModal());
    }

    getItemRaritySymbol(rarity) {
        switch (rarity) {
            case 'common': return '⚪';
            case 'uncommon': return '🟢';
            case 'rare': return '🔵';
            case 'epic': return '🟣';
            case 'legendary': return '🟠';
            default: return '⚪';
        }
    }

    hideInventoryModal() {
        if (this.inventoryModalElements) {
            this.inventoryModalElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.inventoryModalElements = null;
        }
    }

    showCharacteristics() {
        this.activePanel = 'characteristics';
        // Abrir la escena de características existente con todos los datos necesarios
        this.scene.scene.launch('CharacteristicsScene', {
            player: this.player,
            userData: this.scene.userData, // Pasar datos del usuario
            characterId: this.scene.currentCharacterId, // Pasar ID del personaje
            parentScene: this.scene.scene.key
        });
    }

    showSpellsModal() {
        console.log('🔮 Abriendo modal de hechizos...');
        // Asegurarse de que no hay elementos previos
        this.hideSpellsModal();

        // Inicializar arrays
        this.spellsModalElements = [];
        this.spellListElements = [];

        this.createSpellsModal();
    }

    createSpellsModal() {
        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;

        // Fondo semi-transparente
        this.spellsModalBg = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            LayoutConfig.GAME_WIDTH,
            LayoutConfig.GAME_HEIGHT,
            0x000000,
            0.7
        );
        this.spellsModalBg.setDepth(depths.MODAL_BACKGROUND);
        this.spellsModalBg.setInteractive();

        // Panel de hechizos (más grande para 4 hechizos)
        this.spellsModalPanel = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            700,
            550,
            colors.PANEL_BG,
            0.95
        );
        this.spellsModalPanel.setDepth(depths.MODAL_ELEMENTS);
        this.spellsModalPanel.setStrokeStyle(3, colors.PANEL_BORDER);

        // Título del modal
        this.spellsModalTitle = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 190,
            'HECHIZOS',
            LayoutUtils.createTextStyle('TITLE', { color: colors.TEXT_ACCENT })
        );
        this.spellsModalTitle.setOrigin(0.5);
        this.spellsModalTitle.setDepth(depths.MODAL_ELEMENTS + 1);

        // Botón X para cerrar
        this.spellsModalCloseX = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2 + 280,
            LayoutConfig.GAME_HEIGHT / 2 - 200,
            '✕',
            LayoutUtils.createTextStyle('BUTTON', {
                color: colors.TEXT_SECONDARY,
                fontSize: '20px'
            })
        );
        this.spellsModalCloseX.setOrigin(0.5);
        this.spellsModalCloseX.setDepth(depths.MODAL_ELEMENTS + 2);
        this.spellsModalCloseX.setInteractive();
        this.spellsModalCloseX.on('pointerdown', () => {
            console.log('🔮 Botón X clickeado');
            this.hideSpellsModal();
        });
        this.spellsModalCloseX.on('pointerover', () => {
            this.spellsModalCloseX.setColor(colors.TEXT_ACCENT);
        });
        this.spellsModalCloseX.on('pointerout', () => {
            this.spellsModalCloseX.setColor(colors.TEXT_SECONDARY);
        });

        // Información de puntos de hechizo
        this.spellsModalPoints = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 175,
            `Puntos de hechizo disponibles: ${this.player.spellPoints}`,
            LayoutUtils.createTextStyle('BODY', {
                color: this.player.spellPoints > 0 ? colors.TEXT_ACCENT : colors.TEXT_SECONDARY,
                fontSize: '12px'
            })
        );
        this.spellsModalPoints.setOrigin(0.5);
        this.spellsModalPoints.setDepth(depths.MODAL_ELEMENTS + 1);

        // Crear hechizos con iconos y mejor diseño
        const spells = this.player.getSpellsInfo ? this.player.getSpellsInfo() : [];
        console.log('🔮 Spells obtenidos:', spells.length, spells);

        if (spells.length === 0) {
            // Mensaje cuando no hay hechizos
            this.spellsModalContent = this.scene.add.text(
                LayoutConfig.GAME_WIDTH / 2,
                LayoutConfig.GAME_HEIGHT / 2 - 50,
                'No tienes hechizos disponibles.\n\nLos hechizos se desbloquean según tu raza:\n\n🟤 Tierra - Hechizos de defensa\n🔴 Fuego - Hechizos de ataque\n🔵 Agua - Hechizos de curación\n⚪ Aire - Hechizos de velocidad\n\nMejora tus características elementales\npara aumentar el daño de tus hechizos.',
                LayoutUtils.createTextStyle('BODY', {
                    color: colors.TEXT_PRIMARY,
                    align: 'center',
                    wordWrap: { width: 550 }
                })
            );
            this.spellsModalContent.setOrigin(0.5);
            this.spellsModalContent.setDepth(depths.MODAL_ELEMENTS + 1);
        } else {
            // Crear lista de hechizos con iconos
            this.createSpellsList(spells, colors, depths);
        }

        // Botón de cerrar
        this.closeSpellsButton = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 + 180,
            'Cerrar (ESC)',
            LayoutUtils.createTextStyle('BUTTON', { color: colors.TEXT_SECONDARY })
        );
        this.closeSpellsButton.setOrigin(0.5);
        this.closeSpellsButton.setDepth(depths.MODAL_ELEMENTS + 1);
        this.closeSpellsButton.setInteractive();
        this.closeSpellsButton.on('pointerdown', () => this.hideSpellsModal());
        this.closeSpellsButton.on('pointerover', () => {
            this.closeSpellsButton.setColor(colors.TEXT_PRIMARY);
        });
        this.closeSpellsButton.on('pointerout', () => {
            this.closeSpellsButton.setColor(colors.TEXT_SECONDARY);
        });

        // Asegurar que los arrays estén inicializados
        this.spellsModalElements = this.spellsModalElements || [];
        this.spellListElements = this.spellListElements || [];

        // Guardar referencias de elementos base
        this.spellsModalElements.push(
            this.spellsModalBg,
            this.spellsModalPanel,
            this.spellsModalTitle,
            this.spellsModalCloseX,
            this.spellsModalPoints,
            this.closeSpellsButton
        );

        // Si hay contenido de texto (cuando no hay hechizos), agregarlo también
        if (this.spellsModalContent) {
            this.spellsModalElements.push(this.spellsModalContent);
        }

        // Atajo ESC para cerrar
        this.scene.input.keyboard.once('keydown-ESC', () => {
            console.log('🔮 ESC presionado');
            this.hideSpellsModal();
        });
    }

    createSpellsList(spells, colors, depths) {
        const startY = LayoutConfig.GAME_HEIGHT / 2 - 130;
        const spellHeight = 80;

        spells.forEach((spell, index) => {
            const y = startY + (index * spellHeight);

            // Obtener color del elemento
            const elementColor = this.getElementColor(spell.element);
            const elementIcon = this.getElementIcon(spell.element);

            // Fondo del hechizo
            const spellBg = this.scene.add.rectangle(
                LayoutConfig.GAME_WIDTH / 2,
                y,
                550,
                70,
                colors.BUTTON_BG,
                0.8
            );
            spellBg.setDepth(depths.MODAL_ELEMENTS + 1);
            spellBg.setStrokeStyle(2, elementColor);

            // Icono del elemento
            const iconBg = this.scene.add.circle(
                LayoutConfig.GAME_WIDTH / 2 - 220,
                y,
                20,
                elementColor,
                0.9
            );
            iconBg.setDepth(depths.MODAL_ELEMENTS + 2);

            const iconText = this.scene.add.text(
                LayoutConfig.GAME_WIDTH / 2 - 220,
                y,
                elementIcon,
                LayoutUtils.createTextStyle('BUTTON', {
                    color: '#ffffff',
                    fontSize: '16px'
                })
            );
            iconText.setOrigin(0.5);
            iconText.setDepth(depths.MODAL_ELEMENTS + 3);

            // Nombre del hechizo con nivel
            const spellName = this.scene.add.text(
                LayoutConfig.GAME_WIDTH / 2 - 180,
                y - 20,
                `${spell.name} (Nivel ${spell.level})`,
                LayoutUtils.createTextStyle('BUTTON', {
                    color: colors.TEXT_ACCENT,
                    fontSize: '14px'
                })
            );
            spellName.setOrigin(0, 0.5);
            spellName.setDepth(depths.MODAL_ELEMENTS + 2);

            // Información del hechizo
            const elementName = this.getElementName(spell.element);
            const damageText = spell.scaledDamage ? ` | Daño: ${spell.scaledDamage}` : '';
            const spellInfo = this.scene.add.text(
                LayoutConfig.GAME_WIDTH / 2 - 180,
                y - 5,
                `${elementName} | PA: ${spell.actionPointCost} | Rango: ${spell.range}${damageText}`,
                LayoutUtils.createTextStyle('BODY', {
                    color: colors.TEXT_SECONDARY,
                    fontSize: '11px'
                })
            );
            spellInfo.setOrigin(0, 0.5);
            spellInfo.setDepth(depths.MODAL_ELEMENTS + 2);

            // Descripción del hechizo
            const spellDesc = this.scene.add.text(
                LayoutConfig.GAME_WIDTH / 2 - 180,
                y + 15,
                spell.description || 'Sin descripción',
                LayoutUtils.createTextStyle('BODY', {
                    color: colors.TEXT_PRIMARY,
                    fontSize: '10px',
                    wordWrap: { width: 280 }
                })
            );
            spellDesc.setOrigin(0, 0.5);
            spellDesc.setDepth(depths.MODAL_ELEMENTS + 2);

            // Guardar elementos de hechizos en array separado
            this.spellListElements.push(spellBg, iconBg, iconText, spellName, spellInfo, spellDesc);

            // Botones de nivel (+ y -)
            this.createSpellLevelButtons(spell, y, colors, depths);
        });
    }

    createSpellLevelButtons(spell, y, colors, depths) {
        const rightX = LayoutConfig.GAME_WIDTH / 2 + 200;

        // Botón - (bajar nivel)
        const minusButton = this.scene.add.text(
            rightX,
            y - 10,
            '−',
            LayoutUtils.createTextStyle('BUTTON', {
                color: spell.canLevelDown ? colors.TEXT_ACCENT : colors.TEXT_DISABLED,
                fontSize: '20px',
                backgroundColor: spell.canLevelDown ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                padding: { x: 8, y: 4 }
            })
        );
        minusButton.setOrigin(0.5);
        minusButton.setDepth(depths.MODAL_ELEMENTS + 3);

        if (spell.canLevelDown) {
            minusButton.setInteractive();
            minusButton.on('pointerdown', () => {
                console.log('🔮 Botón - clickeado para', spell.name);
                const result = this.player.downgradeSpell(spell.index);
                console.log('🔮 Resultado downgrade:', result);
                if (result.success) {
                    this.refreshSpellsModal();
                }
            });
            minusButton.on('pointerover', () => {
                minusButton.setColor('#ffffff');
            });
            minusButton.on('pointerout', () => {
                minusButton.setColor(colors.TEXT_ACCENT);
            });
        }

        // Indicador de nivel (círculos)
        const levelIndicator = this.scene.add.text(
            rightX,
            y + 10,
            '●'.repeat(spell.level) + '○'.repeat(spell.maxLevel - spell.level),
            LayoutUtils.createTextStyle('BODY', {
                color: colors.TEXT_ACCENT,
                fontSize: '12px'
            })
        );
        levelIndicator.setOrigin(0.5);
        levelIndicator.setDepth(depths.MODAL_ELEMENTS + 3);

        // Botón + (subir nivel)
        const plusButton = this.scene.add.text(
            rightX,
            y + 30,
            '+',
            LayoutUtils.createTextStyle('BUTTON', {
                color: (spell.canLevelUp && this.player.spellPoints > 0) ? colors.TEXT_ACCENT : colors.TEXT_DISABLED,
                fontSize: '20px',
                backgroundColor: (spell.canLevelUp && this.player.spellPoints > 0) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                padding: { x: 8, y: 4 }
            })
        );
        plusButton.setOrigin(0.5);
        plusButton.setDepth(depths.MODAL_ELEMENTS + 3);

        if (spell.canLevelUp && this.player.spellPoints > 0) {
            plusButton.setInteractive();
            plusButton.on('pointerdown', () => {
                console.log('🔮 Botón + clickeado para', spell.name);
                const result = this.player.upgradeSpell(spell.index);
                console.log('🔮 Resultado upgrade:', result);
                if (result.success) {
                    this.saveSpellChanges(); // Guardar en backend
                    this.refreshSpellsModal();
                }
            });
            plusButton.on('pointerover', () => {
                plusButton.setColor('#ffffff');
            });
            plusButton.on('pointerout', () => {
                plusButton.setColor(colors.TEXT_ACCENT);
            });
        }

        // Agregar botones a la lista de elementos de hechizos
        this.spellListElements.push(minusButton, levelIndicator, plusButton);
    }

    refreshSpellsModal() {
        console.log('🔮 Refrescando modal de hechizos...');

        // Solo actualizar el contenido sin cerrar el modal
        if (this.spellsModalElements) {
            // Actualizar puntos de hechizo
            if (this.spellsModalPoints) {
                this.spellsModalPoints.setText(`Puntos de hechizo disponibles: ${this.player.spellPoints}`);
                this.spellsModalPoints.setColor(
                    this.player.spellPoints > 0 ?
                    LayoutConfig.COLORS.TEXT_ACCENT :
                    LayoutConfig.COLORS.TEXT_SECONDARY
                );
            }

            // Recrear solo la lista de hechizos
            this.updateSpellsList();
        }
    }

    updateSpellsList() {
        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;

        // Remover solo los elementos de hechizos (no el modal base)
        if (this.spellListElements) {
            this.spellListElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
        }
        this.spellListElements = [];

        // Recrear lista de hechizos
        const spells = this.player.getSpellsInfo ? this.player.getSpellsInfo() : [];
        this.createSpellsList(spells, colors, depths);
    }

    getElementColor(element) {
        const colors = {
            'tierra': 0x8B4513,  // Marrón
            'fuego': 0xFF4500,   // Rojo-naranja
            'agua': 0x1E90FF,    // Azul
            'aire': 0xE6E6FA,    // Lavanda claro
            'undefined': 0x666666 // Gris para undefined
        };
        return colors[element] || colors['undefined'];
    }

    getElementIcon(element) {
        const icons = {
            'tierra': '🌍',
            'fuego': '🔥',
            'agua': '💧',
            'aire': '💨',
            'undefined': '❓'
        };
        return icons[element] || icons['undefined'];
    }

    getElementName(element) {
        const names = {
            'tierra': 'Tierra',
            'fuego': 'Fuego',
            'agua': 'Agua',
            'aire': 'Aire',
            'undefined': 'Desconocido'
        };
        return names[element] || names['undefined'];
    }

    hideSpellsModal() {
        console.log('🔮 hideSpellsModal llamado');

        // Destruir elementos individuales si existen
        const elementsToDestroy = [
            'spellsModalBg',
            'spellsModalPanel',
            'spellsModalTitle',
            'spellsModalCloseX',
            'spellsModalPoints',
            'spellsModalContent',
            'closeSpellsButton'
        ];

        elementsToDestroy.forEach(elementName => {
            if (this[elementName] && this[elementName].destroy) {
                this[elementName].destroy();
                this[elementName] = null;
            }
        });

        // Destruir array de elementos del modal
        if (this.spellsModalElements) {
            console.log('🔮 Destruyendo', this.spellsModalElements.length, 'elementos del modal');
            this.spellsModalElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.spellsModalElements = null;
        }

        // Destruir array de elementos de hechizos
        if (this.spellListElements) {
            console.log('🔮 Destruyendo', this.spellListElements.length, 'elementos de hechizos');
            this.spellListElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.spellListElements = null;
        }

        console.log('🔮 Modal cerrado');
    }

    showConfigMenu() {
        console.log('⚙️ Abriendo menú de configuración...');
        this.createConfigModal();
    }

    createConfigModal() {
        const colors = LayoutConfig.COLORS;
        const depths = LayoutConfig.DEPTHS;

        // Fondo semi-transparente que cubre toda la pantalla
        this.configModalBg = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            LayoutConfig.GAME_WIDTH,
            LayoutConfig.GAME_HEIGHT,
            0x000000,
            0.7
        );
        this.configModalBg.setDepth(depths.MODAL_BACKGROUND);
        this.configModalBg.setInteractive();
        this.configModalBg.on('pointerdown', () => this.hideConfigModal());

        // Panel del menú de configuración en el centro
        this.configModalPanel = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2,
            300,
            200,
            colors.PANEL_BG,
            0.95
        );
        this.configModalPanel.setDepth(depths.MODAL_ELEMENTS);
        this.configModalPanel.setStrokeStyle(3, colors.PANEL_BORDER);

        // Título del modal
        this.configModalTitle = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 70,
            'CONFIGURACIÓN',
            LayoutUtils.createTextStyle('TITLE', { color: colors.TEXT_ACCENT })
        );
        this.configModalTitle.setOrigin(0.5);
        this.configModalTitle.setDepth(depths.MODAL_ELEMENTS + 1);

        // Botón de logout
        this.logoutModalButton = this.scene.add.rectangle(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 20,
            200,
            40,
            colors.BUTTON_BG,
            0.9
        );
        this.logoutModalButton.setDepth(depths.MODAL_ELEMENTS + 1);
        this.logoutModalButton.setStrokeStyle(2, colors.PANEL_BORDER);
        this.logoutModalButton.setInteractive();

        this.logoutModalText = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 - 20,
            'Cerrar Sesión',
            LayoutUtils.createTextStyle('BUTTON', { color: colors.TEXT_ERROR })
        );
        this.logoutModalText.setOrigin(0.5);
        this.logoutModalText.setDepth(depths.MODAL_ELEMENTS + 2);

        // Eventos del botón logout
        this.logoutModalButton.on('pointerdown', () => {
            this.hideConfigModal();
            this.handleLogout();
        });
        this.logoutModalButton.on('pointerover', () => {
            this.logoutModalButton.setFillStyle(colors.BUTTON_HOVER);
        });
        this.logoutModalButton.on('pointerout', () => {
            this.logoutModalButton.setFillStyle(colors.BUTTON_BG);
        });

        // Botón de cerrar
        this.closeModalButton = this.scene.add.text(
            LayoutConfig.GAME_WIDTH / 2,
            LayoutConfig.GAME_HEIGHT / 2 + 40,
            'Cerrar',
            LayoutUtils.createTextStyle('BUTTON', { color: colors.TEXT_SECONDARY })
        );
        this.closeModalButton.setOrigin(0.5);
        this.closeModalButton.setDepth(depths.MODAL_ELEMENTS + 1);
        this.closeModalButton.setInteractive();
        this.closeModalButton.on('pointerdown', () => this.hideConfigModal());
        this.closeModalButton.on('pointerover', () => {
            this.closeModalButton.setColor(colors.TEXT_PRIMARY);
        });
        this.closeModalButton.on('pointerout', () => {
            this.closeModalButton.setColor(colors.TEXT_SECONDARY);
        });

        // Guardar referencias para poder limpiar
        this.configModalElements = [
            this.configModalBg,
            this.configModalPanel,
            this.configModalTitle,
            this.logoutModalButton,
            this.logoutModalText,
            this.closeModalButton
        ];
    }

    hideConfigModal() {
        if (this.configModalElements) {
            this.configModalElements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.configModalElements = null;
        }
    }

    clearContentArea() {
        // Limpiar solo los elementos del área de contenido, no todo el panel
        if (this.contentText) {
            this.contentText.setText('');
        }
    }

    handleLogout() {
        console.log('🚪 Cerrando sesión...');
        if (this.scene.handleLogout) {
            this.scene.handleLogout();
        }
    }

    // Ya no necesitamos estos métodos porque usamos modales

    toggle() {
        this.isVisible = !this.isVisible;
        this.elements.forEach(element => {
            element.setVisible(this.isVisible);
        });
    }

    destroy() {
        // Limpiar todos los modales si existen
        this.hideConfigModal();
        this.hideInventoryModal();
        this.hideSpellsModal();

        // Limpiar elementos del panel
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
    }

    async saveSpellChanges() {
        try {
            console.log('💾 Guardando cambios de hechizos...');

            // Debug: verificar qué hay en el registry
            console.log('🔍 Registry userData:', this.scene.registry.get('userData'));
            console.log('🔍 Registry currentCharacterId:', this.scene.registry.get('currentCharacterId'));
            console.log('🔍 Scene userData:', this.scene.userData);
            console.log('🔍 Scene currentCharacterId:', this.scene.currentCharacterId);

            // Obtener datos del usuario (intentar múltiples fuentes)
            const userData = this.scene.registry.get('userData') || this.scene.userData;
            const currentCharacterId = this.scene.registry.get('currentCharacterId') || this.scene.currentCharacterId;

            if (!userData || !currentCharacterId) {
                console.error('❌ No hay datos de usuario o ID de personaje');
                console.error('userData:', userData);
                console.error('currentCharacterId:', currentCharacterId);
                return;
            }

            // Preparar datos de hechizos para el backend
            const { SPELL_ID_MAP } = await import('../../classes/Spell.js');
            const spellsData = this.player.spells.map(spell => {
                // Buscar el ID del backend usando el mapeo inverso
                const spellId = Object.keys(SPELL_ID_MAP).find(id => SPELL_ID_MAP[id] === spell.name);

                return {
                    spellId: spellId,
                    level: spell.level,
                    unlocked: true
                };
            });

            // Datos a enviar
            const updateData = {
                spells: spellsData,
                spellPoints: this.player.spellPoints
            };

            console.log('📤 Enviando datos:', updateData);

            // Hacer la petición al backend
            const response = await fetch(`http://localhost:3000/api/characters/${currentCharacterId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Hechizos guardados exitosamente:', result);
            } else {
                console.error('❌ Error guardando hechizos:', response.status);
            }
        } catch (error) {
            console.error('❌ Error guardando cambios de hechizos:', error);
        }
    }
}
