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
            if (button.damage) button.damage.destroy();
            if (button.icon) button.icon.destroy();
        });
        this.spellButtons = [];

        const spells = this.player.getSpellsInfo();

        spells.forEach((spell, index) => {
            const y = 120 + (index * 70); // Aumentar espacio para más información

            // Fondo del botón (más alto)
            const buttonBg = this.scene.add.rectangle(1100, y, 140, 60, 0x333333, 0.9);
            buttonBg.setDepth(1501);
            buttonBg.setInteractive();

            // Obtener el hechizo real para información detallada
            const realSpell = this.player.spells[index];

            // Icono del hechizo (si existe)
            let spellIcon = null;
            if (realSpell.iconPath) {
                // Verificar si la textura existe en el cache
                const textureKey = `spell_icon_${realSpell.name.replace(/\s+/g, '_').toLowerCase()}`;

                if (this.scene.textures.exists(textureKey)) {
                    // Si la textura ya está cargada, usarla
                    spellIcon = this.scene.add.image(1100 - 45, y, textureKey);
                    spellIcon.setDisplaySize(32, 32);
                    spellIcon.setDepth(1502);
                } else {
                    // Intentar cargar la imagen dinámicamente
                    this.scene.load.image(textureKey, realSpell.iconPath);
                    this.scene.load.once('complete', () => {
                        if (this.scene.textures.exists(textureKey)) {
                            // Si se cargó exitosamente, reemplazar el círculo con la imagen
                            if (spellIcon) spellIcon.destroy();
                            spellIcon = this.scene.add.image(1100 - 45, y, textureKey);
                            spellIcon.setDisplaySize(32, 32);
                            spellIcon.setDepth(1502);
                        }
                    });
                    this.scene.load.start();

                    // Crear círculo temporal mientras se carga
                    const elementColors = {
                        tierra: 0x8B4513,
                        fuego: 0xFF4400,
                        agua: 0x00FFFF,
                        aire: 0xCCCCCC
                    };
                    const color = elementColors[realSpell.element] || 0x666666;
                    spellIcon = this.scene.add.circle(1100 - 45, y, 16, color, 0.8);
                    spellIcon.setDepth(1502);
                }
            } else {
                // Crear círculo de color elemental como fallback
                const elementColors = {
                    tierra: 0x8B4513,
                    fuego: 0xFF4400,
                    agua: 0x00FFFF,
                    aire: 0xCCCCCC
                };
                const color = elementColors[realSpell.element] || 0x666666;
                spellIcon = this.scene.add.circle(1100 - 45, y, 16, color, 0.8);
                spellIcon.setDepth(1502);
            }

            // Texto del hechizo con nivel (ajustado para el icono)
            const spellNameWithLevel = `${spell.name} (Nv.${realSpell.level})`;
            const buttonText = this.scene.add.text(1100 - 10, y - 15, spellNameWithLevel, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: spell.canCast ? '#ffffff' : '#666666',
                fontStyle: 'bold'
            });
            buttonText.setOrigin(0.5);
            buttonText.setDepth(1502);

            // Información de PA y Rango (ajustado para el icono)
            const infoText = this.scene.add.text(1100 - 10, y, `PA:${spell.actionPointCost} Rango:${spell.range}`, {
                fontSize: '9px',
                fontFamily: 'Arial',
                color: spell.canCast ? '#ffff00' : '#444444'
            });
            infoText.setOrigin(0.5);
            infoText.setDepth(1502);

            // Estimación de daño (ajustado para el icono)
            const damageEstimate = realSpell.getDamageEstimate(this.player);
            const damageText = this.scene.add.text(1100 - 10, y + 12, `Daño: ${damageEstimate}`, {
                fontSize: '9px',
                fontFamily: 'Arial',
                color: spell.canCast ? '#00ff00' : '#444444'
            });
            damageText.setOrigin(0.5);
            damageText.setDepth(1502);

            // Evento de clic
            buttonBg.on('pointerdown', () => {
                if (this.scene.turnManager.isPlayerTurn && spell.canCast) {
                    this.spellSystem.selectSpell(index);
                }
            });

            // Efecto hover con tooltip
            let tooltip = null;
            buttonBg.on('pointerover', () => {
                if (spell.canCast) {
                    buttonBg.setFillStyle(0x555555);
                }
                // Mostrar tooltip
                tooltip = this.showSpellTooltip(index, buttonBg.x + 80, buttonBg.y - 50);
            });

            buttonBg.on('pointerout', () => {
                const isSelected = this.spellSystem.getSelectedSpellIndex() === index;
                buttonBg.setFillStyle(isSelected ? 0x666600 : 0x333333);
                // Ocultar tooltip
                if (tooltip) {
                    tooltip.destroy();
                    tooltip = null;
                }
            });

            this.spellButtons.push({
                background: buttonBg,
                text: buttonText,
                info: infoText,
                damage: damageText,
                icon: spellIcon,
                spell: spell,
                index: index
            });
        });

        // Agregar botones a elementos para cleanup
        this.spellButtons.forEach(button => {
            this.elements.push(button.background);
            this.elements.push(button.text);
            this.elements.push(button.info);
            this.elements.push(button.damage);
            if (button.icon) this.elements.push(button.icon);
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
        const damageEstimate = spell.getDamageEstimate(this.player);
        const scaledDamage = spell.getScaledDamage();
        const elementBonus = this.player.characteristics[spell.element] || 0;

        const tooltip = this.scene.add.text(x, y,
            `${spell.name} (Nivel ${spell.level})\n` +
            `Elemento: ${spell.element.charAt(0).toUpperCase() + spell.element.slice(1)}\n` +
            `Daño base: ${scaledDamage}\n` +
            `Daño estimado: ${damageEstimate}\n` +
            `Bono elemental: +${elementBonus}%\n` +
            `PA: ${spell.actionPointCost} | Rango: ${spell.range}\n` +
            `Cooldown: ${spell.cooldown} turnos\n` +
            `${spell.description}`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: { x: 8, y: 6 },
            wordWrap: { width: 200 }
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
