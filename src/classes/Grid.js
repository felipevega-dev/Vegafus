export class Grid {
    constructor(scene, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.tileSize = 40; // Tamaño de celda cuadrada
        this.startX = 320; // Posición inicial X del grid
        this.startY = 100; // Posición inicial Y del grid

        // Matriz para almacenar información de cada celda
        this.cells = Array(height).fill().map(() => Array(width).fill().map(() => ({
            walkable: true,
            occupied: false,
            object: null
        })));
    }

    // Convertir coordenadas de grid a coordenadas de mundo
    gridToWorld(gridX, gridY) {
        return {
            x: this.startX + (gridX * this.tileSize),
            y: this.startY + (gridY * this.tileSize)
        };
    }

    // Convertir coordenadas de mundo a coordenadas de grid
    worldToGrid(worldX, worldY) {
        const x = Math.floor((worldX - this.startX) / this.tileSize);
        const y = Math.floor((worldY - this.startY) / this.tileSize);
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

    // Encontrar camino usando A* simplificado
    findPath(startX, startY, endX, endY, maxDistance) {
        // Si el destino no es alcanzable, retornar null
        if (!this.isWalkable(endX, endY)) {
            return null;
        }

        // Si la distancia es mayor al máximo permitido, encontrar el punto más cercano
        const distance = this.getDistance(startX, startY, endX, endY);
        if (distance > maxDistance) {
            // Encontrar el punto más cercano al destino dentro del rango
            const direction = this.getDirection(startX, startY, endX, endY);
            endX = startX + Math.round(direction.x * maxDistance);
            endY = startY + Math.round(direction.y * maxDistance);

            // Asegurar que esté dentro del grid
            endX = Math.max(0, Math.min(this.width - 1, endX));
            endY = Math.max(0, Math.min(this.height - 1, endY));

            // Si la nueva posición no es caminable, buscar una alternativa
            if (!this.isWalkable(endX, endY)) {
                return this.findNearestWalkable(startX, startY, maxDistance);
            }
        }

        // Pathfinding simple usando BFS
        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        const directions = [
            { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (current.x === endX && current.y === endY) {
                return current.path.concat([{ x: endX, y: endY }]);
            }

            for (const dir of directions) {
                const newX = current.x + dir.x;
                const newY = current.y + dir.y;
                const key = `${newX},${newY}`;

                if (!visited.has(key) && this.isWalkable(newX, newY)) {
                    visited.add(key);
                    const newPath = current.path.concat([{ x: current.x, y: current.y }]);

                    // Limitar la longitud del camino
                    if (newPath.length < maxDistance + 1) {
                        queue.push({ x: newX, y: newY, path: newPath });
                    }
                }
            }
        }

        return null; // No se encontró camino
    }

    // Obtener dirección normalizada entre dos puntos
    getDirection(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return { x: 0, y: 0 };

        return {
            x: dx / length,
            y: dy / length
        };
    }

    // Encontrar la celda caminable más cercana dentro del rango
    findNearestWalkable(centerX, centerY, range) {
        for (let r = 1; r <= range; r++) {
            for (let x = Math.max(0, centerX - r); x <= Math.min(this.width - 1, centerX + r); x++) {
                for (let y = Math.max(0, centerY - r); y <= Math.min(this.height - 1, centerY + r); y++) {
                    if (this.getDistance(centerX, centerY, x, y) <= range && this.isWalkable(x, y)) {
                        return [{ x: centerX, y: centerY }, { x, y }];
                    }
                }
            }
        }
        return null;
    }
}




















