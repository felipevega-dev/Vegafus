/**
 * Sistema para gestionar el movimiento del jugador en exploración
 */
export class MovementSystem {
    constructor(scene, grid, player) {
        this.scene = scene;
        this.grid = grid;
        this.player = player;
        this.isMoving = false;
        this.movementIndicators = [];
    }

    movePlayerWithAnimation(targetX, targetY) {
        // Evitar múltiples movimientos simultáneos
        if (this.isMoving) return;

        this.isMoving = true;

        // Liberar celda anterior
        this.grid.setFree(this.player.gridX, this.player.gridY);

        // Calcular posición mundial del objetivo
        const targetWorldPos = this.grid.gridToWorld(targetX, targetY);

        // Animar el movimiento
        this.scene.tweens.add({
            targets: this.player.sprite,
            x: targetWorldPos.x,
            y: targetWorldPos.y,
            duration: 300, // 300ms de animación
            ease: 'Power2',
            onComplete: () => {
                // Actualizar posición lógica después de la animación
                this.player.gridX = targetX;
                this.player.gridY = targetY;

                // Ocupar nueva celda
                this.grid.setOccupied(this.player.gridX, this.player.gridY, this.player);

                // Actualizar barra de vida
                this.player.updateHealthBarPosition();

                // Permitir nuevo movimiento
                this.isMoving = false;

                console.log(`Jugador movido a: ${targetX}, ${targetY}`);
            }
        });
    }

    showMovementPreview(targetX, targetY) {
        this.clearMovementPreview();

        // En exploración, solo mostrar si la celda es alcanzable
        const path = this.grid.findPath(
            this.player.gridX, this.player.gridY,
            targetX, targetY,
            999 // Sin límite de movimiento en exploración
        );

        if (!path || path.length === 0) return;

        // Mostrar solo la celda objetivo
        const worldPos = this.grid.gridToWorld(targetX, targetY);

        const previewCell = this.scene.add.rectangle(
            worldPos.x, worldPos.y,
            this.grid.tileSize - 4, this.grid.tileSize - 4,
            0x00ff00, 0.6 // Verde para indicar movimiento libre
        );
        previewCell.setDepth(50);

        this.movementIndicators.push(previewCell);
    }

    clearMovementPreview() {
        this.movementIndicators.forEach(indicator => {
            if (indicator && indicator.destroy) {
                indicator.destroy();
            }
        });
        this.movementIndicators = [];
    }

    handleMouseClick(pointer) {
        const gridPos = this.grid.worldToGrid(pointer.worldX, pointer.worldY);

        if (gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= this.grid.width || gridPos.y >= this.grid.height) {
            return;
        }

        // En exploración, mover con animación suave
        if (this.grid.isWalkable(gridPos.x, gridPos.y) && !this.grid.cells[gridPos.y][gridPos.x].occupied) {
            this.movePlayerWithAnimation(gridPos.x, gridPos.y);
        }
    }

    destroy() {
        this.clearMovementPreview();
    }
}
