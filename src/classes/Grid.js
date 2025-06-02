export class Grid {
    constructor(scene, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.tileWidth = 64;
        this.tileHeight = 32;

        // Matriz para almacenar información de cada celda
        this.cells = Array(height).fill().map(() => Array(width).fill().map(() => ({
            walkable: true,
            occupied: false,
            object: null
        })));
    }

    // Convertir coordenadas de grid a coordenadas isométricas
    gridToIso(gridX, gridY) {
        return {
            x: (gridX - gridY) * (this.tileWidth / 2),
            y: (gridX + gridY) * (this.tileHeight / 2)
        };
    }

    // Convertir coordenadas isométricas a coordenadas de grid
    isoToGrid(isoX, isoY) {
        // Ajustar por el origen
        const x = Math.round((isoX / (this.tileWidth / 2) + isoY / (this.tileHeight / 2)) / 2);
        const y = Math.round((isoY / (this.tileHeight / 2) - isoX / (this.tileWidth / 2)) / 2);
        return { x, y };
    }

    // Comprobar si una celda es válida y transitable
    isWalkable(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return false;
        }
        return this.cells[y][x].walkable && !this.cells[y][x].occupied;
    }

    // Marcar una celda como ocupada
    setOccupied(x, y, object) {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            this.cells[y][x].occupied = true;
            this.cells[y][x].object = object;
        }
    }

    // Liberar una celda
    setFree(x, y) {
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
            this.cells[y][x].occupied = false;
            this.cells[y][x].object = null;
        }
    }

    // Calcular distancia entre dos puntos del grid
    getDistance(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    // Obtener celdas en rango de movimiento
    getCellsInRange(centerX, centerY, range) {
        const cells = [];
        for (let x = Math.max(0, centerX - range); x <= Math.min(this.width - 1, centerX + range); x++) {
            for (let y = Math.max(0, centerY - range); y <= Math.min(this.height - 1, centerY + range); y++) {
                if (this.getDistance(centerX, centerY, x, y) <= range && this.isWalkable(x, y)) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    }
}




















