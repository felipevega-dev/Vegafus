/**
 * Sistema de movimiento específico para combate
 */
export class CombatMovementSystem {
    constructor(scene, grid, player) {
        this.scene = scene;
        this.grid = grid;
        this.player = player;
        this.movementIndicators = [];
    }

    // Mostrar preview de movimiento en combate
    showMovementPreview(targetX, targetY) {
        this.clearMovementPreview();

        if (!this.scene.turnManager.isPlayerTurn || this.scene.spellSystem.isInSpellMode()) return;

        // Encontrar camino hacia el objetivo
        const path = this.grid.findPath(
            this.player.gridX, this.player.gridY,
            targetX, targetY,
            this.player.currentMovementPoints
        );

        if (!path || path.length === 0) return;

        // Mostrar el camino
        for (let i = 1; i < path.length; i++) { // Empezar desde 1 para omitir la posición actual
            const worldPos = this.grid.gridToWorld(path[i].x, path[i].y);

            const previewCell = this.scene.add.rectangle(
                worldPos.x, worldPos.y,
                this.grid.tileSize - 4, this.grid.tileSize - 4,
                0xffff00, 0.5
            );
            previewCell.setDepth(50);

            // Añadir número de paso
            const stepNumber = this.scene.add.text(worldPos.x, worldPos.y, i.toString(), {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#000000',
                fontStyle: 'bold'
            });
            stepNumber.setOrigin(0.5);
            stepNumber.setDepth(51);

            this.movementIndicators.push(previewCell);
            this.movementIndicators.push(stepNumber);
        }

        // Mostrar costo de movimiento
        const movementCost = path.length - 1;
        const costText = this.scene.add.text(
            targetX * this.grid.tileSize + this.grid.startX,
            targetY * this.grid.tileSize + this.grid.startY - 20,
            `Costo: ${movementCost} PM`, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: movementCost <= this.player.currentMovementPoints ? '#00ff00' : '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 4, y: 2 }
        });
        costText.setOrigin(0.5);
        costText.setDepth(52);
        this.movementIndicators.push(costText);
    }

    // Limpiar preview de movimiento
    clearMovementPreview() {
        this.movementIndicators.forEach(indicator => {
            if (indicator && indicator.destroy) {
                indicator.destroy();
            }
        });
        this.movementIndicators = [];
    }

    // Mover jugador durante la fase de posicionamiento
    movePlayerToPosition(newGridX, newGridY) {
        // Liberar celda anterior
        this.grid.setFree(this.player.gridX, this.player.gridY);

        // Actualizar posición
        this.player.gridX = newGridX;
        this.player.gridY = newGridY;

        // Ocupar nueva celda
        this.grid.setOccupied(this.player.gridX, this.player.gridY, this.player);

        // Mover sprite instantáneamente
        const worldPos = this.grid.gridToWorld(this.player.gridX, this.player.gridY);
        this.player.sprite.setPosition(worldPos.x, worldPos.y);
        this.player.updateHealthBarPosition();
    }

    // Verificar si una posición es válida para posicionamiento
    isValidPositioningCell(x, y) {
        if (x < 0 || y < 0 || x >= this.grid.width || y >= this.grid.height) {
            return false;
        }

        const cell = this.grid.cells[y][x];
        return cell.walkable && cell.isPositioningZone && !cell.occupied;
    }

    // Obtener todas las celdas válidas para posicionamiento
    getValidPositioningCells() {
        const validCells = [];
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                if (this.isValidPositioningCell(x, y)) {
                    validCells.push({ x, y });
                }
            }
        }
        return validCells;
    }

    // Resaltar celdas de posicionamiento
    highlightPositioningCells() {
        const validCells = this.getValidPositioningCells();
        
        validCells.forEach(cell => {
            const worldPos = this.grid.gridToWorld(cell.x, cell.y);
            
            const highlight = this.scene.add.rectangle(
                worldPos.x, worldPos.y,
                this.grid.tileSize - 6, this.grid.tileSize - 6,
                0xffff00, 0.3
            );
            highlight.setDepth(45);
            
            // Efecto de parpadeo
            this.scene.tweens.add({
                targets: highlight,
                alpha: { from: 0.3, to: 0.7 },
                duration: 1000,
                yoyo: true,
                repeat: -1
            });
            
            this.movementIndicators.push(highlight);
        });
    }

    destroy() {
        this.clearMovementPreview();
    }
}
