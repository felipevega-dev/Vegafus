export class Grid {
    constructor(scene, width, height) {        this.scene = scene;
        this.width = width;        this.height = height;
        this.tileWidth = 64;        this.tileHeight = 32;
                // Matriz para almacenar información de cada celda
        this.cells = Array(height).fill().map(() => Array(width).fill().map(() => ({            walkable: true,
            occupied: false,            object: null
        })));    }
        // Convertir coordenadas de grid a coordenadas isométricas
    gridToIso(gridX, gridY) {        return {
            x: (gridX - gridY) * (this.tileWidth / 2),            y: (gridX + gridY) * (this.tileHeight / 2)
        };    }
        // Convertir coordenadas isométricas a coordenadas de grid
    isoToGrid(isoX, isoY) {        // Ajustar por el origen
        const x = Math.round((isoX / (this.tileWidth / 2) + isoY / (this.tileHeight / 2)) / 2);        const y = Math.round((isoY / (this.tileHeight / 2) - isoX / (this.tileWidth / 2)) / 2);
        return { x, y };    }
        // Comprobar si una celda es válida y transitable
    isWalkable(x, y) {        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return false;        }
        return this.cells[y][x].walkable;
    }
}




















