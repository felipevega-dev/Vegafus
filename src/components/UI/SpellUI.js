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
        // Crear botones de hechizos
        this.createSpellButtons();
    }

    createSpellButtons() {
        // Limpiar TODOS los elementos existentes (incluyendo overlays de disabled)
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];

        // Limpiar botones existentes
        this.spellButtons.forEach(button => {
            if (button.background) button.background.destroy();
            if (button.text) button.text.destroy();
            if (button.info) button.info.destroy();
            if (button.damage) button.damage.destroy();
            if (button.icon) button.icon.destroy();
            if (button.slot) button.slot.destroy();
        });
        this.spellButtons = [];

        // Crear el fondo del menú vertical
        if (this.menuBackground) this.menuBackground.destroy();
        this.menuBackground = this.scene.add.image(1150, 350, 'menuvertical'); // Bajado mucho más
        this.menuBackground.setDepth(1500);
        this.menuBackground.setScale(0.25); // Mucho más pequeño
        this.elements.push(this.menuBackground);

        const spells = this.player.getSpellsInfo();

        spells.forEach((spell, index) => {
            // Calcular posición de las casillas en el menú vertical
            // El menú tiene 2 columnas y múltiples filas
            const col = index % 2; // 0 = izquierda, 1 = derecha
            const row = Math.floor(index / 2); // Fila

            // Posiciones base del menú (ajustadas para calzar con las casillas del UI)
            const baseX = 1150; // Posición X central
            const baseY = 232; // Ajustado para calzar con las casillas
            const spacingX = 70; // Espaciado horizontal entre casillas
            const spacingY = 70; // Espaciado vertical entre casillas

            const x = baseX + (col - 0.5) * spacingX; // -0.5 para centrar entre las dos columnas
            const y = baseY + row * spacingY;

            // Crear área invisible para interacción (sobre la casilla)
            const buttonBg = this.scene.add.rectangle(x, y, 65, 65, 0x000000, 0); // Área de clic que cubra todo el icono
            buttonBg.setDepth(1501);
            buttonBg.setInteractive();

            // Obtener el hechizo real para información detallada
            const realSpell = this.player.spells[index];

            // Icono del hechizo centrado en la casilla
            let spellIcon = null;
            const elementColors = {
                tierra: 0x8B4513,
                fuego: 0xFF4400,
                agua: 0x00FFFF,
                aire: 0xCCCCCC
            };
            const color = elementColors[realSpell.element] || 0x666666;

            if (realSpell.iconPath) {
                // Verificar si la textura existe en el cache
                const textureKey = `spell_icon_${realSpell.name.replace(/\s+/g, '_').toLowerCase()}`;

                if (this.scene.textures.exists(textureKey)) {
                    // Si la textura ya está cargada, usarla
                    spellIcon = this.scene.add.image(x, y, textureKey);
                    spellIcon.setDisplaySize(60, 60); // Iconos mucho más grandes
                    spellIcon.setDepth(1502);
                } else {
                    // Crear círculo como fallback inmediatamente
                    spellIcon = this.scene.add.circle(x, y, 30, color, 0.8); // Círculo mucho más grande
                    spellIcon.setDepth(1502);

                    // Intentar cargar la imagen dinámicamente en segundo plano
                    this.scene.load.image(textureKey, realSpell.iconPath);
                    this.scene.load.once('complete', () => {
                        if (this.scene.textures.exists(textureKey)) {
                            // Si se cargó exitosamente, reemplazar el círculo con la imagen
                            const iconX = spellIcon.x;
                            const iconY = spellIcon.y;
                            const iconDepth = spellIcon.depth;

                            spellIcon.destroy();
                            spellIcon = this.scene.add.image(iconX, iconY, textureKey);
                            spellIcon.setDisplaySize(60, 60); // Iconos mucho más grandes
                            spellIcon.setDepth(iconDepth);

                            // Actualizar la referencia en el botón
                            const buttonIndex = this.spellButtons.findIndex(btn => btn.icon === spellIcon);
                            if (buttonIndex >= 0) {
                                this.spellButtons[buttonIndex].icon = spellIcon;
                            }
                        }
                    });
                    this.scene.load.start();
                }
            } else {
                // Crear círculo de color elemental como fallback
                spellIcon = this.scene.add.circle(x, y, 30, color, 0.8); // Círculo mucho más grande
                spellIcon.setDepth(1502);
            }

            // Efecto visual de disponibilidad del hechizo
            if (!spell.canCast) {
                // Overlay negro para hechizos no disponibles que cubra todo el icono
                const disabledOverlay = this.scene.add.rectangle(x, y, 65, 65, 0x000000, 0.6);
                disabledOverlay.setDepth(1503);
                this.elements.push(disabledOverlay);
            }

            // Evento de clic
            buttonBg.on('pointerdown', () => {
                if (this.scene.turnManager.isPlayerTurn && spell.canCast) {
                    this.spellSystem.selectSpell(index);
                }
            });

            // Efecto hover con tooltip
            let tooltip = null;
            let hoverOverlay = null;

            buttonBg.on('pointerover', () => {
                if (spell.canCast) {
                    // Crear overlay de hover dorado que cubra todo el icono
                    hoverOverlay = this.scene.add.rectangle(x, y, 65, 65, 0xFFD700, 0.3);
                    hoverOverlay.setDepth(1503);
                }
                // Mostrar tooltip
                tooltip = this.showSpellTooltip(index, x - 120, y - 40); // Ajustado para nueva posición
            });

            buttonBg.on('pointerout', () => {
                // Limpiar overlay de hover
                if (hoverOverlay) {
                    hoverOverlay.destroy();
                    hoverOverlay = null;
                }
                // Ocultar tooltip
                if (tooltip) {
                    tooltip.destroy();
                    tooltip = null;
                }
            });

            this.spellButtons.push({
                background: buttonBg,
                icon: spellIcon,
                spell: spell,
                index: index,
                x: x,
                y: y
            });
        });

        // Agregar botones a elementos para cleanup
        this.spellButtons.forEach(button => {
            this.elements.push(button.background);
            if (button.icon) this.elements.push(button.icon);
        });
    }

    updateSpellButtons() {
        this.createSpellButtons();
    }

    updateSelectedSpell(selectedIndex) {
        // Limpiar overlays de selección anteriores
        if (this.selectedOverlay) {
            this.selectedOverlay.destroy();
            this.selectedOverlay = null;
        }

        // Crear overlay de selección para el hechizo seleccionado
        if (selectedIndex >= 0 && selectedIndex < this.spellButtons.length) {
            const button = this.spellButtons[selectedIndex];
            this.selectedOverlay = this.scene.add.rectangle(
                button.x, button.y, 65, 65, 0x00FF00, 0.4 // Tamaño para cubrir completamente el icono de 60x60
            );
            this.selectedOverlay.setDepth(1503);
            this.elements.push(this.selectedOverlay);
        }
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
        // Limpiar overlay de selección
        if (this.selectedOverlay) {
            this.selectedOverlay.destroy();
            this.selectedOverlay = null;
        }

        // Limpiar fondo del menú
        if (this.menuBackground) {
            this.menuBackground.destroy();
            this.menuBackground = null;
        }

        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
        this.spellButtons = [];
    }
}
