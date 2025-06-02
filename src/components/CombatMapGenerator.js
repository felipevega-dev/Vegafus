/**
 * Generador de mapas de combate simétricos
 */
export class CombatMapGenerator {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.tileSize = 40;
        this.startX = 320;
        this.startY = 100;
    }

    createSymmetricMap(width = 15, height = 15) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const posX = this.startX + (x * this.tileSize);
                const posY = this.startY + (y * this.tileSize);

                // Crear patrón simétrico
                let tileType = 'iso-grass'; // Por defecto hierba
                let isPositioningZone = false;

                // Bordes del mapa
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                    tileType = 'iso-stone';
                }
                // Obstáculos simétricos en el centro
                else if ((x === 7 && y === 7) || // Centro
                         (x === 5 && y === 5) || (x === 9 && y === 9) || // Diagonales
                         (x === 5 && y === 9) || (x === 9 && y === 5)) {
                    tileType = 'iso-water';
                    isPositioningZone = true; // Las celdas azules son zonas de posicionamiento
                }
                // Algunas piedras decorativas simétricas
                else if ((x === 3 && y === 7) || (x === 11 && y === 7) ||
                         (x === 7 && y === 3) || (x === 7 && y === 11)) {
                    tileType = 'iso-stone';
                }

                // Crear celda visual
                const cellBg = this.scene.add.rectangle(posX, posY, this.tileSize - 2, this.tileSize - 2, 0x228B22, 0.3);
                cellBg.setDepth(0);

                // Borde de la celda
                const cellBorder = this.scene.add.rectangle(posX, posY, this.tileSize - 2, this.tileSize - 2);
                cellBorder.setStrokeStyle(1, 0x00ff00, 0.5);
                cellBorder.setDepth(1);

                // Configurar propiedades de la celda
                this.configureCellProperties(cellBg, cellBorder, tileType, isPositioningZone, x, y);

                // Configurar interactividad
                this.setupCellInteractivity(cellBg, tileType, isPositioningZone, x, y);
            }
        }
    }

    configureCellProperties(cellBg, cellBorder, tileType, isPositioningZone, x, y) {
        // Color según el tipo de tile
        if (tileType === 'iso-stone') {
            cellBg.setFillStyle(0x696969, 0.8); // Gris para piedra
            this.grid.cells[y][x].walkable = false;
        } else if (tileType === 'iso-water') {
            if (isPositioningZone) {
                cellBg.setFillStyle(0x0088ff, 0.8); // Azul brillante para zonas de posicionamiento
                this.grid.cells[y][x].walkable = true; // Las zonas azules son caminables
                this.grid.cells[y][x].isPositioningZone = true;

                // Añadir borde especial para zonas de posicionamiento
                cellBorder.setStrokeStyle(2, 0x00aaff, 1.0);
            } else {
                cellBg.setFillStyle(0x4169E1, 0.6); // Azul para agua normal
                this.grid.cells[y][x].walkable = false;
            }
        } else {
            cellBg.setFillStyle(0x228B22, 0.3); // Verde para hierba
        }

        // Guardar referencia para hover effects
        cellBg.gridX = x;
        cellBg.gridY = y;
        cellBg.isPositioningZone = isPositioningZone;
        cellBg.tileType = tileType;
        cellBg.setInteractive();
    }

    setupCellInteractivity(cellBg, tileType, isPositioningZone, x, y) {
        // Efectos de hover
        cellBg.on('pointerover', () => {
            if (this.scene.turnManager.gameState === 'positioning') {
                // Durante posicionamiento, resaltar solo celdas azules válidas
                const currentCell = this.grid.cells[y][x];
                if (currentCell.walkable && currentCell.isPositioningZone && !currentCell.occupied) {
                    cellBg.setFillStyle(0xffff00, 0.8); // Amarillo brillante para indicar válido
                }
            } else if (this.scene.turnManager.isPlayerTurn && this.scene.turnManager.gameState === 'playing') {
                this.scene.movementSystem.showMovementPreview(x, y);
            }
        });

        cellBg.on('pointerout', () => {
            if (this.scene.turnManager.gameState === 'positioning') {
                // Restaurar opacidad original
                this.restoreOriginalCellColor(cellBg, tileType, isPositioningZone);
            } else {
                this.scene.movementSystem.clearMovementPreview();
            }
        });
    }

    restoreOriginalCellColor(cellBg, tileType, isPositioningZone) {
        if (tileType === 'iso-stone') {
            cellBg.setFillStyle(0x696969, 0.8);
        } else if (tileType === 'iso-water') {
            if (isPositioningZone) {
                cellBg.setFillStyle(0x0088ff, 0.8); // Azul brillante para zonas de posicionamiento
            } else {
                cellBg.setFillStyle(0x4169E1, 0.6); // Azul normal para agua
            }
        } else {
            cellBg.setFillStyle(0x228B22, 0.3);
        }
    }

    // Crear diferentes tipos de mapas
    createArenaMap() {
        // Mapa tipo arena con más obstáculos
        this.createSymmetricMap(15, 15);
    }

    createOpenFieldMap() {
        // Mapa abierto con pocos obstáculos
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                const posX = this.startX + (x * this.tileSize);
                const posY = this.startY + (y * this.tileSize);

                let tileType = 'iso-grass';
                let isPositioningZone = false;

                // Solo bordes como obstáculos
                if (x === 0 || y === 0 || x === 14 || y === 14) {
                    tileType = 'iso-stone';
                }
                // Zonas de posicionamiento en las esquinas
                else if ((x === 2 && y === 2) || (x === 12 && y === 12) ||
                         (x === 2 && y === 12) || (x === 12 && y === 2)) {
                    tileType = 'iso-water';
                    isPositioningZone = true;
                }

                const cellBg = this.scene.add.rectangle(posX, posY, this.tileSize - 2, this.tileSize - 2, 0x228B22, 0.3);
                cellBg.setDepth(0);

                const cellBorder = this.scene.add.rectangle(posX, posY, this.tileSize - 2, this.tileSize - 2);
                cellBorder.setStrokeStyle(1, 0x00ff00, 0.5);
                cellBorder.setDepth(1);

                this.configureCellProperties(cellBg, cellBorder, tileType, isPositioningZone, x, y);
                this.setupCellInteractivity(cellBg, tileType, isPositioningZone, x, y);
            }
        }
    }

    createMazeMap() {
        // Mapa tipo laberinto
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                const posX = this.startX + (x * this.tileSize);
                const posY = this.startY + (y * this.tileSize);

                let tileType = 'iso-grass';
                let isPositioningZone = false;

                // Crear patrón de laberinto
                if (x === 0 || y === 0 || x === 14 || y === 14) {
                    tileType = 'iso-stone';
                }
                // Paredes internas del laberinto
                else if ((x % 4 === 0 && y % 2 === 0) || (y % 4 === 0 && x % 2 === 0)) {
                    tileType = 'iso-stone';
                }
                // Zonas de posicionamiento
                else if ((x === 7 && y === 7) || (x === 3 && y === 3) || (x === 11 && y === 11)) {
                    tileType = 'iso-water';
                    isPositioningZone = true;
                }

                const cellBg = this.scene.add.rectangle(posX, posY, this.tileSize - 2, this.tileSize - 2, 0x228B22, 0.3);
                cellBg.setDepth(0);

                const cellBorder = this.scene.add.rectangle(posX, posY, this.tileSize - 2, this.tileSize - 2);
                cellBorder.setStrokeStyle(1, 0x00ff00, 0.5);
                cellBorder.setDepth(1);

                this.configureCellProperties(cellBg, cellBorder, tileType, isPositioningZone, x, y);
                this.setupCellInteractivity(cellBg, tileType, isPositioningZone, x, y);
            }
        }
    }
}
