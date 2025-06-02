/**
 * Generador de mapas de exploración
 */
export class MapGenerator {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.tileSize = 32;
        this.startX = 50;
        this.startY = 50;
    }

    createExplorationMap(width = 30, height = 20) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const posX = this.startX + (x * this.tileSize);
                const posY = this.startY + (y * this.tileSize);

                // Crear diferentes tipos de terreno
                let tileType = 'grass';
                let walkable = true;

                // Bordes del mapa
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                    tileType = 'mountain';
                    walkable = false;
                }
                // Algunos obstáculos aleatorios
                else if (Math.random() < 0.1) {
                    tileType = 'tree';
                    walkable = false;
                }
                // Algunos ríos
                else if ((x === 10 || x === 20) && y > 2 && y < height - 3) {
                    tileType = 'water';
                    walkable = false;
                }

                // Crear celda visual
                const cellBg = this.scene.add.rectangle(posX, posY, this.tileSize - 1, this.tileSize - 1, this.getTileColor(tileType), 0.6);
                cellBg.setDepth(0);
                
                // Borde de la celda
                const cellBorder = this.scene.add.rectangle(posX, posY, this.tileSize - 1, this.tileSize - 1);
                cellBorder.setStrokeStyle(1, 0x444444, 0.3);
                cellBorder.setDepth(1);
                
                // Configurar grid
                this.grid.cells[y][x].walkable = walkable;
                
                // Hacer interactiva
                cellBg.gridX = x;
                cellBg.gridY = y;
                cellBg.setInteractive();
                
                // Efectos de hover
                cellBg.on('pointerover', () => {
                    if (walkable && this.scene.movementSystem) {
                        this.scene.movementSystem.showMovementPreview(x, y);
                    }
                });
                
                cellBg.on('pointerout', () => {
                    if (this.scene.movementSystem) {
                        this.scene.movementSystem.clearMovementPreview();
                    }
                });
            }
        }
    }

    getTileColor(tileType) {
        switch (tileType) {
            case 'grass': return 0x228B22;
            case 'mountain': return 0x696969;
            case 'tree': return 0x006400;
            case 'water': return 0x4169E1;
            default: return 0x228B22;
        }
    }

    createPlaceholderSprites() {
        // Crear sprite para el jugador
        const playerGraphics = this.scene.add.graphics();
        playerGraphics.fillStyle(0x00ff00); // Verde para el jugador
        playerGraphics.fillCircle(16, 16, 12);
        playerGraphics.generateTexture('character', 32, 32);
        playerGraphics.destroy();

        // Crear sprite para enemigos
        const enemyGraphics = this.scene.add.graphics();
        enemyGraphics.fillStyle(0xff0000); // Rojo para enemigos
        enemyGraphics.fillCircle(16, 16, 12);
        enemyGraphics.generateTexture('enemy', 32, 32);
        enemyGraphics.destroy();

        console.log('✅ Sprites placeholder creados');
    }
}
