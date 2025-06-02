/**
 * Sistema para gestionar enemigos en combate
 */
import { Enemy } from '@classes/Enemy.js';

export class EnemyManager {
    constructor(scene, grid, player) {
        this.scene = scene;
        this.grid = grid;
        this.player = player;
        this.enemies = [];
        this.enemyTypes = ['basic', 'strong', 'fast'];
    }

    // Generar enemigos aleatoriamente después del posicionamiento
    spawnEnemiesRandomly(numEnemies = 1) {
        // Obtener celdas disponibles (no ocupadas y caminables)
        const availableCells = this.getAvailableSpawnCells();

        // Crear enemigos en posiciones aleatorias
        for (let i = 0; i < numEnemies && availableCells.length > 0; i++) {
            const randomIndex = Phaser.Math.Between(0, availableCells.length - 1);
            const spawnPos = availableCells.splice(randomIndex, 1)[0];
            const enemyType = this.enemyTypes[i % this.enemyTypes.length];

            const enemy = this.createEnemy(spawnPos.x, spawnPos.y, enemyType);
            this.enemies.push(enemy);

            // Añadir al sistema de turnos
            this.scene.turnManager.addEntity(enemy);

            // Efecto visual de aparición
            this.createSpawnEffect(spawnPos.x, spawnPos.y);
        }

        console.log(`${numEnemies} enemigos generados`);
    }

    // Crear un enemigo específico
    createEnemy(x, y, type) {
        const enemy = new Enemy(this.scene, x, y, type);
        return enemy;
    }

    // Obtener celdas disponibles para spawn de enemigos
    getAvailableSpawnCells() {
        const availableCells = [];
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                if (this.grid.isWalkable(x, y) && !this.grid.cells[y][x].occupied) {
                    // Evitar spawn muy cerca del jugador (mínimo 3 celdas de distancia)
                    const distanceToPlayer = this.grid.getDistance(x, y, this.player.gridX, this.player.gridY);
                    if (distanceToPlayer >= 3) {
                        availableCells.push({ x, y });
                    }
                }
            }
        }
        return availableCells;
    }

    // Efecto visual de aparición de enemigos
    createSpawnEffect(gridX, gridY) {
        const worldPos = this.grid.gridToWorld(gridX, gridY);

        // Círculo de aparición
        const spawnCircle = this.scene.add.circle(worldPos.x, worldPos.y, 30, 0xff0000, 0.7);
        spawnCircle.setDepth(200);

        // Animación de aparición
        this.scene.tweens.add({
            targets: spawnCircle,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                spawnCircle.destroy();
            }
        });
    }

    // Spawn de enemigos por oleadas
    spawnWave(waveNumber) {
        const enemiesPerWave = Math.min(1 + Math.floor(waveNumber / 2), 4); // Máximo 4 enemigos
        this.spawnEnemiesRandomly(enemiesPerWave);
    }

    // Spawn de jefe
    spawnBoss(bossType = 'boss') {
        const availableCells = this.getAvailableSpawnCells();
        
        if (availableCells.length > 0) {
            // Elegir una posición central o específica para el jefe
            const centerCells = availableCells.filter(cell => {
                const centerX = Math.floor(this.grid.width / 2);
                const centerY = Math.floor(this.grid.height / 2);
                return this.grid.getDistance(cell.x, cell.y, centerX, centerY) <= 3;
            });
            
            const spawnPos = centerCells.length > 0 ? 
                centerCells[Math.floor(Math.random() * centerCells.length)] :
                availableCells[Math.floor(Math.random() * availableCells.length)];
            
            const boss = this.createEnemy(spawnPos.x, spawnPos.y, bossType);
            this.enemies.push(boss);
            
            // Añadir al sistema de turnos
            this.scene.turnManager.addEntity(boss);
            
            // Efecto especial de aparición para jefe
            this.createBossSpawnEffect(spawnPos.x, spawnPos.y);
            
            console.log(`Jefe ${bossType} generado en ${spawnPos.x}, ${spawnPos.y}`);
        }
    }

    // Efecto especial de aparición de jefe
    createBossSpawnEffect(gridX, gridY) {
        const worldPos = this.grid.gridToWorld(gridX, gridY);

        // Múltiples círculos concéntricos
        for (let i = 0; i < 3; i++) {
            const spawnCircle = this.scene.add.circle(worldPos.x, worldPos.y, 20 + (i * 15), 0xff0000, 0.8 - (i * 0.2));
            spawnCircle.setDepth(200 + i);

            this.scene.tweens.add({
                targets: spawnCircle,
                scaleX: 3 + i,
                scaleY: 3 + i,
                alpha: 0,
                duration: 1200 + (i * 200),
                ease: 'Power2',
                delay: i * 100,
                onComplete: () => {
                    spawnCircle.destroy();
                }
            });
        }

        // Efecto de temblor de pantalla
        this.scene.cameras.main.shake(500, 0.02);
    }

    // Obtener enemigos vivos
    getAliveEnemies() {
        return this.enemies.filter(enemy => enemy.isAlive);
    }

    // Verificar si quedan enemigos vivos
    hasAliveEnemies() {
        return this.getAliveEnemies().length > 0;
    }

    // Eliminar enemigos muertos
    cleanupDeadEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            if (!enemy.isAlive) {
                // Liberar celda ocupada
                this.grid.setFree(enemy.gridX, enemy.gridY);
                // El sprite ya debería estar destruido por el propio enemigo
                return false;
            }
            return true;
        });
    }

    // Obtener enemigo en una posición específica
    getEnemyAt(x, y) {
        return this.enemies.find(enemy => 
            enemy.isAlive && enemy.gridX === x && enemy.gridY === y
        );
    }

    // Spawn de enemigos en formación específica
    spawnFormation(formation = 'line') {
        const availableCells = this.getAvailableSpawnCells();
        
        if (availableCells.length === 0) return;

        let spawnPositions = [];
        
        switch (formation) {
            case 'line':
                // Línea horizontal de enemigos
                spawnPositions = this.getLineFormation(availableCells);
                break;
            case 'circle':
                // Círculo de enemigos
                spawnPositions = this.getCircleFormation(availableCells);
                break;
            case 'triangle':
                // Formación triangular
                spawnPositions = this.getTriangleFormation(availableCells);
                break;
            default:
                spawnPositions = availableCells.slice(0, 3);
        }

        spawnPositions.forEach((pos, index) => {
            const enemyType = this.enemyTypes[index % this.enemyTypes.length];
            const enemy = this.createEnemy(pos.x, pos.y, enemyType);
            this.enemies.push(enemy);
            this.scene.turnManager.addEntity(enemy);
            this.createSpawnEffect(pos.x, pos.y);
        });
    }

    getLineFormation(availableCells) {
        // Buscar celdas en línea horizontal
        const centerY = Math.floor(this.grid.height / 2);
        return availableCells.filter(cell => Math.abs(cell.y - centerY) <= 1).slice(0, 3);
    }

    getCircleFormation(availableCells) {
        // Buscar celdas alrededor del centro
        const centerX = Math.floor(this.grid.width / 2);
        const centerY = Math.floor(this.grid.height / 2);
        return availableCells.filter(cell => {
            const distance = this.grid.getDistance(cell.x, cell.y, centerX, centerY);
            return distance >= 2 && distance <= 4;
        }).slice(0, 4);
    }

    getTriangleFormation(availableCells) {
        // Formación triangular
        return availableCells.slice(0, 3);
    }

    destroy() {
        this.enemies.forEach(enemy => {
            if (enemy.sprite && enemy.sprite.destroy) {
                enemy.sprite.destroy();
            }
        });
        this.enemies = [];
    }
}
