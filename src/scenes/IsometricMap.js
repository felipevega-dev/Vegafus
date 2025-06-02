import { Grid } from '../classes/Grid.js';
import { Player } from '../classes/Player.js';
import { Enemy } from '../classes/Enemy.js';
import { TurnManager } from '../systems/TurnManager.js';

export class IsometricMap extends Phaser.Scene {
    constructor() {
        super('IsometricMap');
    }

    preload() {
        // Cargar tileset isométrico (necesitarás crear o conseguir estos assets)
        this.load.image('iso-grass', 'assets/images/tiles/iso-grass.png');
        this.load.image('iso-water', 'assets/images/tiles/iso-water.png');
        this.load.image('iso-stone', 'assets/images/tiles/iso-stone.png');

        // Cargar sprite del personaje
        this.load.spritesheet('character', 'assets/images/characters/character.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        // Crear sistema de grid
        this.grid = new Grid(this, 10, 10);

        // Crear mapa simple
        this.createMap();

        // Crear jugador y enemigos
        this.createPlayer();
        this.createEnemies();

        // Crear sistema de turnos
        this.createTurnSystem();

        // Configurar controles
        this.setupControls();

        // Configurar cámara
        this.cameras.main.setBounds(0, 0, 1280, 720);
        this.cameras.main.startFollow(this.player.sprite);

        // Variables para el sistema de movimiento
        this.selectedCell = null;
        this.movementIndicators = [];
        this.attackIndicators = [];
    }
    createMap() {
        // Implementación básica - se mejorará después
        const tileWidth = 64;
        const tileHeight = 32;

        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                // Convertir coordenadas de grid a isométricas
                const isoX = (x - y) * tileWidth / 2;
                const isoY = (x + y) * tileHeight / 2;

                // Elegir tile aleatorio para demostración
                const tileType = Phaser.Math.Between(0, 10) > 8 ? 'iso-water' :
                                (Phaser.Math.Between(0, 10) > 7 ? 'iso-stone' : 'iso-grass');

                // Añadir tile al mapa
                const tile = this.add.image(640 + isoX, 300 + isoY, tileType);
                tile.setDepth(isoY); // Para correcto ordenamiento de capas
            }
        }
    }

    createPlayer() {
        // Crear jugador en posición inicial del grid
        this.player = new Player(this, 2, 2);
    }

    createEnemies() {
        // Crear algunos enemigos en diferentes posiciones
        this.enemies = [];

        // Enemigo básico
        this.enemies.push(new Enemy(this, 6, 6, 'basic'));

        // Enemigo fuerte
        this.enemies.push(new Enemy(this, 7, 3, 'strong'));

        // Enemigo rápido
        this.enemies.push(new Enemy(this, 3, 7, 'fast'));
    }

    createTurnSystem() {
        // Crear gestor de turnos
        this.turnManager = new TurnManager(this);

        // Añadir jugador al sistema de turnos
        this.turnManager.addEntity(this.player);

        // Añadir enemigos al sistema de turnos
        this.enemies.forEach(enemy => {
            this.turnManager.addEntity(enemy);
        });

        // Iniciar combate
        this.turnManager.startCombat();
    }

    setupControls() {
        // Configurar input del mouse para movimiento
        this.input.on('pointerdown', (pointer) => {
            if (this.turnManager.isPlayerTurn && this.turnManager.gameState === 'playing') {
                this.handleMouseClick(pointer);
            }
        });

        // Configurar teclas
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);

        // Tecla para terminar turno
        this.endTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.endTurnKey.on('down', () => {
            if (this.turnManager.isPlayerTurn && this.turnManager.gameState === 'playing') {
                this.turnManager.nextTurn();
            }
        });
    }

    handleMouseClick(pointer) {
        // Convertir coordenadas del mouse a coordenadas de grid
        const worldX = pointer.worldX - 640;
        const worldY = pointer.worldY - 300;
        const gridPos = this.grid.isoToGrid(worldX, worldY);

        // Verificar si la posición es válida
        if (gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= this.grid.width || gridPos.y >= this.grid.height) {
            return;
        }

        // Verificar si hay un enemigo en esa posición
        const targetEnemy = this.enemies.find(enemy =>
            enemy.isAlive && enemy.gridX === gridPos.x && enemy.gridY === gridPos.y
        );

        if (targetEnemy) {
            // Intentar atacar al enemigo
            if (this.player.attackEnemy(targetEnemy)) {
                this.turnManager.updateTurnUI();
                // Verificar si el juego ha terminado después del ataque
                this.turnManager.checkGameEnd();
            }
        } else {
            // Intentar mover al jugador
            if (this.player.moveTo(gridPos.x, gridPos.y)) {
                this.turnManager.updateTurnUI();
            }
        }
    }
}




























