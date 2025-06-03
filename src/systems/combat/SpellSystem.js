/**
 * Sistema de hechizos para combate
 */
export class SpellSystem {
    constructor(scene, grid, player) {
        this.scene = scene;
        this.grid = grid;
        this.player = player;
        this.selectedSpellIndex = -1;
        this.spellMode = false;
        this.spellRangeIndicators = [];
    }

    selectSpell(spellIndex) {
        if (this.scene.turnManager.gameState !== 'playing') return;

        this.selectedSpellIndex = spellIndex;
        this.spellMode = true;

        // Mostrar rango del hechizo
        this.showSpellRange(spellIndex);

        // Actualizar colores de botones en la UI
        if (this.scene.spellUI) {
            this.scene.spellUI.updateSelectedSpell(spellIndex);
        }

        console.log(`Hechizo seleccionado: ${this.player.spells[spellIndex].name}`);
    }

    cancelSpellSelection() {
        this.spellMode = false;
        this.selectedSpellIndex = -1;
        this.clearSpellRange();
        
        if (this.scene.spellUI) {
            this.scene.spellUI.updateSelectedSpell(-1);
        }
        
        console.log('Selección de hechizo cancelada');
    }

    // Mostrar rango de hechizo
    showSpellRange(spellIndex) {
        this.clearSpellRange();

        if (spellIndex < 0 || spellIndex >= this.player.spells.length) return;

        const spell = this.player.spells[spellIndex];
        const playerX = this.player.gridX;
        const playerY = this.player.gridY;

        // Mostrar todas las celdas en rango
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const distance = this.grid.getDistance(playerX, playerY, x, y);

                if (distance <= spell.range && distance > 0) {
                    const worldPos = this.grid.gridToWorld(x, y);

                    // Color según si es un objetivo válido
                    const cell = this.grid.cells[y][x];
                    const hasEnemy = cell.object && cell.object.constructor.name === 'Enemy';
                    const color = hasEnemy ? 0xff0000 : 0x0088ff; // Rojo para enemigos, azul para celdas vacías

                    const rangeIndicator = this.scene.add.rectangle(
                        worldPos.x, worldPos.y,
                        this.grid.tileSize - 6, this.grid.tileSize - 6,
                        color, 0.4
                    );
                    rangeIndicator.setDepth(60);

                    // Añadir borde
                    const border = this.scene.add.rectangle(
                        worldPos.x, worldPos.y,
                        this.grid.tileSize - 6, this.grid.tileSize - 6
                    );
                    border.setStrokeStyle(2, color, 0.8);
                    border.setDepth(61);

                    this.spellRangeIndicators.push(rangeIndicator);
                    this.spellRangeIndicators.push(border);
                }
            }
        }

        // Mostrar información detallada del hechizo
        const damageEstimate = spell.getDamageEstimate(this.player);
        const spellInfo = this.scene.add.text(
            this.player.sprite.x, this.player.sprite.y - 60,
            `${spell.name} (Nv.${spell.level})\nDaño: ${damageEstimate} | PA: ${spell.actionPointCost} | Rango: ${spell.range}`,
            {
                fontSize: '11px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: { x: 8, y: 4 },
                align: 'center'
            }
        );
        spellInfo.setOrigin(0.5);
        spellInfo.setDepth(62);
        this.spellRangeIndicators.push(spellInfo);
    }

    // Limpiar preview de rango de hechizo
    clearSpellRange() {
        this.spellRangeIndicators.forEach(indicator => {
            if (indicator && indicator.destroy) {
                indicator.destroy();
            }
        });
        this.spellRangeIndicators = [];
    }

    // Intentar lanzar hechizo
    castSpell(targetX, targetY) {
        if (!this.spellMode || this.selectedSpellIndex < 0) {
            return false;
        }

        const success = this.player.castSpell(this.selectedSpellIndex, targetX, targetY);
        
        if (success) {
            this.cancelSpellSelection();
            
            // Actualizar UI
            if (this.scene.spellUI) {
                this.scene.spellUI.updateSpellButtons();
            }
            
            this.scene.turnManager.updateTurnUI();

            // Verificar si el juego ha terminado después del hechizo
            this.scene.turnManager.checkGameEnd();
        }

        return success;
    }

    // Verificar si estamos en modo hechizo
    isInSpellMode() {
        return this.spellMode;
    }

    // Obtener el índice del hechizo seleccionado
    getSelectedSpellIndex() {
        return this.selectedSpellIndex;
    }

    // Mostrar efectos visuales de área de efecto
    showAreaOfEffect(centerX, centerY, radius, color = 0xff8800) {
        const indicators = [];
        
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const distance = this.grid.getDistance(centerX, centerY, x, y);
                
                if (distance <= radius) {
                    const worldPos = this.grid.gridToWorld(x, y);
                    
                    const aoeIndicator = this.scene.add.circle(
                        worldPos.x, worldPos.y,
                        this.grid.tileSize / 3,
                        color, 0.6
                    );
                    aoeIndicator.setDepth(65);
                    
                    // Efecto de pulso
                    this.scene.tweens.add({
                        targets: aoeIndicator,
                        scaleX: 1.5,
                        scaleY: 1.5,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2',
                        onComplete: () => {
                            aoeIndicator.destroy();
                        }
                    });
                    
                    indicators.push(aoeIndicator);
                }
            }
        }
        
        return indicators;
    }

    destroy() {
        this.clearSpellRange();
    }
}
