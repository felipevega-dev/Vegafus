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
            rightPanel.x + rightPanel.width / 2,
            50,
            'MENÚ',
            LayoutUtils.createTextStyle('TITLE', { color: colors.TEXT_ACCENT })
        );
        this.titleText.setOrigin(0.5);
        this.titleText.setDepth(depths.UI_TEXT);
        this.elements.push(this.titleText);

        console.log('🎮 Panel creado en posición:', rightPanel.x, rightPanel.y);

        // Crear área de contenido
        this.createContentArea();

        // Crear botones del menú
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
            { text: 'Inventario', key: 'I', action: () => this.showInventory() },
            { text: 'Características', key: 'C', action: () => this.showCharacteristics() },
            { text: 'Hechizos', key: 'H', action: () => this.showSpells() },
            { text: 'Estadísticas', key: 'E', action: () => this.showStats() }
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
        this.scene.input.keyboard.on('keydown-I', () => this.showInventory());
        
        // Características (C) - ya existe, pero podemos sobrescribirlo
        this.scene.input.keyboard.on('keydown-C', () => this.showCharacteristics());
        
        // Hechizos (H)
        this.scene.input.keyboard.on('keydown-H', () => this.showSpells());
        
        // Estadísticas (E)
        this.scene.input.keyboard.on('keydown-E', () => this.showStats());
    }

    showInventory() {
        console.log('🎒 Abriendo inventario...');
        this.activePanel = 'inventory';

        // Abrir el panel de inventario detallado
        if (this.scene.inventoryPanel) {
            console.log('🎒 Usando panel de inventario existente');
            this.scene.inventoryPanel.show();
        } else {
            // Fallback: mostrar contenido básico en el panel lateral
            console.log('🎒 Mostrando inventario en panel lateral');
            const content = this.getInventoryContent();
            console.log('🎒 Contenido del inventario:', content);
            this.updateContent('INVENTARIO', content);
        }
    }

    showCharacteristics() {
        this.activePanel = 'characteristics';
        // Abrir la escena de características existente
        this.scene.scene.launch('CharacteristicsScene', { 
            player: this.player,
            returnScene: this.scene.scene.key 
        });
    }

    showSpells() {
        this.activePanel = 'spells';
        this.updateContent('HECHIZOS', this.getSpellsContent());
    }

    showStats() {
        this.activePanel = 'stats';
        this.updateContent('ESTADÍSTICAS', this.getStatsContent());
    }

    updateContent(title, content) {
        console.log('🔄 Actualizando contenido del panel:', title);
        console.log('🔄 Título elemento:', !!this.titleText);
        console.log('🔄 Contenido elemento:', !!this.contentText);

        // Actualizar título
        if (this.titleText) {
            this.titleText.setText(title);
        }

        // Actualizar contenido
        if (this.contentText) {
            this.contentText.setText(content);
        }
    }

    getInventoryContent() {
        // Por ahora contenido básico, se expandirá cuando implementes el sistema de inventario
        const items = this.player.inventory || [];
        
        if (items.length === 0) {
            return 'Inventario vacío\n\nAquí aparecerán\ntus objetos y\nequipamiento';
        }
        
        let content = `Objetos: ${items.length}\n\n`;
        items.slice(0, 8).forEach((item, index) => {
            content += `${index + 1}. ${item.name}\n`;
        });
        
        if (items.length > 8) {
            content += `\n... y ${items.length - 8} más`;
        }
        
        return content;
    }

    getSpellsContent() {
        const spells = this.player.getSpellsInfo ? this.player.getSpellsInfo() : [];
        
        if (spells.length === 0) {
            return 'Sin hechizos\ndisponibles';
        }
        
        let content = `Hechizos: ${spells.length}\n\n`;
        spells.forEach((spell, index) => {
            content += `${index + 1}. ${spell.name}\n`;
            content += `   PA: ${spell.actionPointCost}\n`;
            content += `   Rango: ${spell.range}\n\n`;
        });
        
        return content;
    }

    getStatsContent() {
        const stats = this.player.characteristics || {};
        
        let content = `Nivel: ${this.player.level}\n`;
        content += `XP: ${this.player.experience}\n`;
        content += `HP: ${this.player.currentHP}/${this.player.maxHP}\n\n`;
        
        content += 'Características:\n';
        Object.entries(stats).forEach(([key, value]) => {
            const displayName = this.getCharacteristicDisplayName(key);
            content += `${displayName}: ${value}\n`;
        });
        
        return content;
    }

    getCharacteristicDisplayName(key) {
        const names = {
            tierra: 'Tierra',
            fuego: 'Fuego',
            agua: 'Agua',
            aire: 'Aire',
            vida: 'Vida',
            sabiduria: 'Sabiduría'
        };
        return names[key] || key;
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.elements.forEach(element => {
            element.setVisible(this.isVisible);
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
