/**
 * Componente UI para mostrar y gestionar hechizos en combate
 */
export class SpellUI {
    constructor(scene, player, spellSystem) {
        this.scene = scene;
        this.player = player;
        this.spellSystem = spellSystem;
        this.elements = [];
        this.spellButtons = [];
        
        this.create();
    }

    create() {
        // Panel de hechizos
        this.spellPanel = this.scene.add.rectangle(1100, 200, 160, 300, 0x000000, 0.8);
        this.spellPanel.setDepth(1500);
        this.elements.push(this.spellPanel);

        // Título del panel
        this.spellTitle = this.scene.add.text(1100, 80, 'Hechizos', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.spellTitle.setOrigin(0.5);
        this.spellTitle.setDepth(1501);
        this.elements.push(this.spellTitle);

        // Crear botones de hechizos
        this.createSpellButtons();
    }

    createSpellButtons() {
        // Limpiar botones existentes
        this.spellButtons.forEach(button => {
            if (button.background) button.background.destroy();
            if (button.text) button.text.destroy();
            if (button.info) button.info.destroy();
        });
        this.spellButtons = [];

        const spells = this.player.getSpellsInfo();

        spells.forEach((spell, index) => {
            const y = 120 + (index * 60);

            // Fondo del botón
            const buttonBg = this.scene.add.rectangle(1100, y, 140, 50, 0x333333, 0.9);
            buttonBg.setDepth(1501);
            buttonBg.setInteractive();

            // Texto del hechizo
            const buttonText = this.scene.add.text(1100, y - 10, spell.name, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: spell.canCast ? '#ffffff' : '#666666',
                fontStyle: 'bold'
            });
            buttonText.setOrigin(0.5);
            buttonText.setDepth(1502);

            // Información adicional
            const infoText = this.scene.add.text(1100, y + 10, `PA:${spell.actionPointCost} Rango:${spell.range}`, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: spell.canCast ? '#ffff00' : '#444444'
            });
            infoText.setOrigin(0.5);
            infoText.setDepth(1502);

            // Evento de clic
            buttonBg.on('pointerdown', () => {
                if (this.scene.turnManager.isPlayerTurn && spell.canCast) {
                    this.spellSystem.selectSpell(index);
                }
            });

            // Efecto hover
            buttonBg.on('pointerover', () => {
                if (spell.canCast) {
                    buttonBg.setFillStyle(0x555555);
                }
            });

            buttonBg.on('pointerout', () => {
                const isSelected = this.spellSystem.getSelectedSpellIndex() === index;
                buttonBg.setFillStyle(isSelected ? 0x666600 : 0x333333);
            });

            this.spellButtons.push({
                background: buttonBg,
                text: buttonText,
                info: infoText,
                spell: spell,
                index: index
            });
        });

        // Agregar botones a elementos para cleanup
        this.spellButtons.forEach(button => {
            this.elements.push(button.background);
            this.elements.push(button.text);
            this.elements.push(button.info);
        });
    }

    updateSpellButtons() {
        this.createSpellButtons();
    }

    updateSelectedSpell(selectedIndex) {
        this.spellButtons.forEach((button, index) => {
            if (index === selectedIndex) {
                button.background.setFillStyle(0x666600); // Amarillo oscuro para seleccionado
            } else {
                button.background.setFillStyle(0x333333);
            }
        });
    }

    // Mostrar información detallada de un hechizo
    showSpellTooltip(spellIndex, x, y) {
        if (spellIndex < 0 || spellIndex >= this.player.spells.length) return;

        const spell = this.player.spells[spellIndex];
        
        const tooltip = this.scene.add.text(x, y, 
            `${spell.name}\n` +
            `Daño: ${spell.damage}\n` +
            `Elemento: ${spell.element}\n` +
            `Rango: ${spell.range}\n` +
            `PA: ${spell.actionPointCost}\n` +
            `Cooldown: ${spell.cooldown}`, {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: { x: 8, y: 6 }
        });
        tooltip.setDepth(1600);
        
        return tooltip;
    }

    // Mostrar efectos de cooldown
    updateCooldownDisplay() {
        this.spellButtons.forEach((button, index) => {
            const spell = this.player.spells[index];
            if (spell.currentCooldown > 0) {
                // Mostrar overlay de cooldown
                const cooldownOverlay = this.scene.add.rectangle(
                    button.background.x, button.background.y,
                    button.background.width, button.background.height,
                    0x000000, 0.7
                );
                cooldownOverlay.setDepth(1503);
                
                const cooldownText = this.scene.add.text(
                    button.background.x, button.background.y,
                    spell.currentCooldown.toString(), {
                    fontSize: '20px',
                    fontFamily: 'Arial',
                    color: '#ff0000',
                    fontStyle: 'bold'
                });
                cooldownText.setOrigin(0.5);
                cooldownText.setDepth(1504);
                
                // Agregar a elementos temporales
                this.elements.push(cooldownOverlay);
                this.elements.push(cooldownText);
            }
        });
    }

    // Crear atajos de teclado para hechizos
    setupKeyboardShortcuts() {
        // Teclas para hechizos (1, 2, 3, 4)
        const spellKeys = [
            this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
            this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
            this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
            this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR)
        ];

        spellKeys.forEach((key, index) => {
            key.on('down', () => {
                if (index < this.player.spells.length) {
                    this.spellSystem.selectSpell(index);
                }
            });
        });

        // Tecla para cancelar selección de hechizo
        const escapeKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        escapeKey.on('down', () => {
            this.spellSystem.cancelSpellSelection();
        });
    }

    destroy() {
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
        this.spellButtons = [];
    }
}
