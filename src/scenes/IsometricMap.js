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
        // Crear sistema de grid más grande y simétrico para combate
        this.grid = new Grid(this, 15, 15);

        // Crear mapa simétrico
        this.createSymmetricMap();

        // Crear jugador y enemigos
        this.createPlayer();
        this.createEnemies();

        // Crear sistema de turnos
        this.createTurnSystem();

        // Crear UI de hechizos
        this.createSpellUI();

        // Configurar controles
        this.setupControls();

        // Configurar cámara
        this.cameras.main.setBounds(0, 0, 1280, 720);
        this.cameras.main.startFollow(this.player.sprite);

        // Variables para el sistema de movimiento y hechizos
        this.selectedCell = null;
        this.movementIndicators = [];
        this.attackIndicators = [];
        this.selectedSpellIndex = -1;
        this.spellMode = false;
        this.spellRangeIndicators = [];
    }
    createSymmetricMap() {
        // Crear mapa simétrico de 15x15 para combate (formato cuadrado)
        const tileSize = 40; // Tamaño de cada celda cuadrada
        const startX = 320; // Posición inicial X
        const startY = 100; // Posición inicial Y

        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 15; x++) {
                // Posición cuadrada simple
                const posX = startX + (x * tileSize);
                const posY = startY + (y * tileSize);

                // Crear patrón simétrico
                let tileType = 'iso-grass'; // Por defecto hierba
                let isPositioningZone = false;

                // Bordes del mapa
                if (x === 0 || y === 0 || x === 14 || y === 14) {
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

                // Crear rectángulo visual para la celda
                const cellBg = this.add.rectangle(posX, posY, tileSize - 2, tileSize - 2, 0x228B22, 0.3);
                cellBg.setDepth(0);

                // Borde de la celda
                const cellBorder = this.add.rectangle(posX, posY, tileSize - 2, tileSize - 2);
                cellBorder.setStrokeStyle(1, 0x00ff00, 0.5);
                cellBorder.setDepth(1);

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
                cellBg.setInteractive();

                // Efectos de hover
                cellBg.on('pointerover', () => {
                    if (this.turnManager.gameState === 'positioning') {
                        // Durante posicionamiento, resaltar solo celdas azules válidas
                        const currentCell = this.grid.cells[y][x];
                        if (currentCell.walkable && currentCell.isPositioningZone && !currentCell.occupied) {
                            cellBg.setFillStyle(0xffff00, 0.8); // Amarillo brillante para indicar válido
                        }
                    } else if (this.turnManager.isPlayerTurn && this.turnManager.gameState === 'playing') {
                        this.showMovementPreview(x, y);
                    }
                });

                cellBg.on('pointerout', () => {
                    if (this.turnManager.gameState === 'positioning') {
                        // Restaurar opacidad original
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
                    } else {
                        this.clearMovementPreview();
                    }
                });
            }
        }
    }

    createPlayer() {
        // Verificar si hay datos guardados del jugador
        const savedPlayerData = this.registry.get('playerData');

        if (savedPlayerData) {
            // Restaurar jugador con datos guardados
            this.player = new Player(this, 5, 5, savedPlayerData.playerClass || 'mage');
            this.player.currentHP = savedPlayerData.currentHP || this.player.maxHP;
            this.player.maxHP = savedPlayerData.maxHP || this.player.maxHP;
            this.player.level = savedPlayerData.level || 1;
            this.player.experience = savedPlayerData.experience || 0;
            this.player.attack = savedPlayerData.attack || this.player.attack;
            this.player.defense = savedPlayerData.defense || this.player.defense;

            console.log(`Jugador restaurado en combate: Nivel ${this.player.level}, XP: ${this.player.experience}`);
        } else {
            // Crear jugador nuevo
            this.player = new Player(this, 5, 5, 'mage');
        }
    }

    createEnemies() {
        // No crear enemigos inicialmente - se crearán después del posicionamiento
        this.enemies = [];
    }

    // Generar enemigos aleatoriamente después del posicionamiento
    spawnEnemiesRandomly() {
        const enemyTypes = ['basic', 'strong', 'fast'];
        const numEnemies = 1; // Solo 1 enemigo para testing

        // Obtener celdas disponibles (no ocupadas y caminables)
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

        // Crear enemigos en posiciones aleatorias
        for (let i = 0; i < numEnemies && availableCells.length > 0; i++) {
            const randomIndex = Phaser.Math.Between(0, availableCells.length - 1);
            const spawnPos = availableCells.splice(randomIndex, 1)[0];
            const enemyType = enemyTypes[i % enemyTypes.length];

            const enemy = new Enemy(this, spawnPos.x, spawnPos.y, enemyType);
            this.enemies.push(enemy);

            // Añadir al sistema de turnos
            this.turnManager.addEntity(enemy);

            // Efecto visual de aparición
            this.createSpawnEffect(spawnPos.x, spawnPos.y);
        }
    }

    // Efecto visual de aparición de enemigos
    createSpawnEffect(gridX, gridY) {
        const worldPos = this.grid.gridToWorld(gridX, gridY);

        // Círculo de aparición
        const spawnCircle = this.add.circle(worldPos.x, worldPos.y, 30, 0xff0000, 0.7);
        spawnCircle.setDepth(200);

        // Animación de aparición
        this.tweens.add({
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

    createTurnSystem() {
        // Crear gestor de turnos
        this.turnManager = new TurnManager(this);

        // Añadir jugador al sistema de turnos
        this.turnManager.addEntity(this.player);

        // Iniciar fase de posicionamiento (no combate aún)
        this.turnManager.startPositioning();
    }

    createSpellUI() {
        // Panel de hechizos
        this.spellPanel = this.add.rectangle(1100, 200, 160, 300, 0x000000, 0.8);
        this.spellPanel.setDepth(1500);

        // Título del panel
        this.spellTitle = this.add.text(1100, 80, 'Hechizos', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.spellTitle.setOrigin(0.5);
        this.spellTitle.setDepth(1501);

        // Botones de hechizos
        this.spellButtons = [];
        this.createSpellButtons();
    }

    createSpellButtons() {
        // Limpiar botones existentes
        this.spellButtons.forEach(button => {
            if (button.background) button.background.destroy();
            if (button.text) button.text.destroy();
        });
        this.spellButtons = [];

        const spells = this.player.getSpellsInfo();

        spells.forEach((spell, index) => {
            const y = 120 + (index * 60);

            // Fondo del botón
            const buttonBg = this.add.rectangle(1100, y, 140, 50, 0x333333, 0.9);
            buttonBg.setDepth(1501);
            buttonBg.setInteractive();

            // Texto del hechizo
            const buttonText = this.add.text(1100, y - 10, spell.name, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: spell.canCast ? '#ffffff' : '#666666',
                fontStyle: 'bold'
            });
            buttonText.setOrigin(0.5);
            buttonText.setDepth(1502);

            // Información adicional
            const infoText = this.add.text(1100, y + 10, `PA:${spell.actionPointCost} Rango:${spell.range}`, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: spell.canCast ? '#ffff00' : '#444444'
            });
            infoText.setOrigin(0.5);
            infoText.setDepth(1502);

            // Evento de clic
            buttonBg.on('pointerdown', () => {
                if (this.turnManager.isPlayerTurn && spell.canCast) {
                    this.selectSpell(index);
                }
            });

            // Efecto hover
            buttonBg.on('pointerover', () => {
                if (spell.canCast) {
                    buttonBg.setFillStyle(0x555555);
                }
            });

            buttonBg.on('pointerout', () => {
                buttonBg.setFillStyle(this.selectedSpellIndex === index ? 0x666600 : 0x333333);
            });

            this.spellButtons.push({
                background: buttonBg,
                text: buttonText,
                info: infoText,
                spell: spell
            });
        });
    }

    selectSpell(spellIndex) {
        if (this.turnManager.gameState !== 'playing') return;

        this.selectedSpellIndex = spellIndex;
        this.spellMode = true;

        // Mostrar rango del hechizo
        this.showSpellRange(spellIndex);

        // Actualizar colores de botones
        this.spellButtons.forEach((button, index) => {
            if (index === spellIndex) {
                button.background.setFillStyle(0x666600); // Amarillo oscuro para seleccionado
            } else {
                button.background.setFillStyle(0x333333);
            }
        });

        console.log(`Hechizo seleccionado: ${this.player.spells[spellIndex].name}`);
    }

    setupControls() {
        // Configurar input del mouse para movimiento y hechizos
        this.input.on('pointerdown', (pointer) => {
            if (this.turnManager.gameState === 'positioning' ||
                (this.turnManager.isPlayerTurn && this.turnManager.gameState === 'playing')) {
                this.handleMouseClick(pointer);
            }
        });

        // Configurar teclas
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Teclas para hechizos (1, 2, 3)
        this.spell1Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        this.spell2Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        this.spell3Key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);

        this.spell1Key.on('down', () => this.selectSpell(0));
        this.spell2Key.on('down', () => this.selectSpell(1));
        this.spell3Key.on('down', () => this.selectSpell(2));

        // Tecla para cancelar selección de hechizo
        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escapeKey.on('down', () => {
            this.spellMode = false;
            this.selectedSpellIndex = -1;
            this.clearSpellRange();
            this.updateSpellButtons();
            console.log('Selección de hechizo cancelada');
        });

        // Teclas para terminar turno
        this.endTurnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.endTurnKey.on('down', () => {
            if (this.turnManager.isPlayerTurn && this.turnManager.gameState === 'playing') {
                this.turnManager.nextTurn();
            }
        });

        // SPACE también termina turno
        this.spaceKey.on('down', () => {
            if (this.turnManager.isPlayerTurn && this.turnManager.gameState === 'playing') {
                this.turnManager.nextTurn();
            }
        });
    }

    updateSpellButtons() {
        this.createSpellButtons();
    }

    handleMouseClick(pointer) {
        // Convertir coordenadas del mouse a coordenadas de grid
        const gridPos = this.grid.worldToGrid(pointer.worldX, pointer.worldY);

        // Debug: mostrar coordenadas del click
        console.log(`Click en: mouse(${Math.round(pointer.worldX)}, ${Math.round(pointer.worldY)}) -> grid(${gridPos.x}, ${gridPos.y})`);

        // Verificar si la posición es válida
        if (gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= this.grid.width || gridPos.y >= this.grid.height) {
            console.log('Click fuera del grid');
            return;
        }

        // Fase de posicionamiento
        if (this.turnManager.gameState === 'positioning') {
            // Solo permitir movimiento a celdas azules (zonas de posicionamiento)
            const cell = this.grid.cells[gridPos.y][gridPos.x];
            if (cell.walkable && cell.isPositioningZone && !cell.occupied) {
                // Mover jugador sin restricciones de puntos de movimiento durante posicionamiento
                this.movePlayerToPosition(gridPos.x, gridPos.y);
                console.log(`Jugador movido a posición azul: ${gridPos.x}, ${gridPos.y}`);
            } else {
                console.log(`Celda no válida para posicionamiento: walkable=${cell.walkable}, isPositioningZone=${cell.isPositioningZone}, occupied=${cell.occupied}`);
            }
            return;
        }

        // Si estamos en modo hechizo
        if (this.spellMode && this.selectedSpellIndex >= 0) {
            if (this.player.castSpell(this.selectedSpellIndex, gridPos.x, gridPos.y)) {
                this.spellMode = false;
                this.selectedSpellIndex = -1;
                this.clearSpellRange();
                this.updateSpellButtons();
                this.turnManager.updateTurnUI();

                // Verificar si el juego ha terminado después del hechizo
                this.turnManager.checkGameEnd();
            }
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
                this.updateSpellButtons();
                // Verificar si el juego ha terminado después del ataque
                this.turnManager.checkGameEnd();
            }
        } else {
            // Intentar mover al jugador
            if (this.player.moveTo(gridPos.x, gridPos.y)) {
                this.turnManager.updateTurnUI();
                this.updateSpellButtons();
            }
        }
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

    // Mostrar preview de movimiento
    showMovementPreview(targetX, targetY) {
        this.clearMovementPreview();

        if (!this.turnManager.isPlayerTurn || this.spellMode) return;

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

            const previewCell = this.add.rectangle(
                worldPos.x, worldPos.y,
                this.grid.tileSize - 4, this.grid.tileSize - 4,
                0xffff00, 0.5
            );
            previewCell.setDepth(50);

            // Añadir número de paso
            const stepNumber = this.add.text(worldPos.x, worldPos.y, i.toString(), {
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
        const costText = this.add.text(targetX * this.grid.tileSize + this.grid.startX,
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

                    const rangeIndicator = this.add.rectangle(
                        worldPos.x, worldPos.y,
                        this.grid.tileSize - 6, this.grid.tileSize - 6,
                        color, 0.4
                    );
                    rangeIndicator.setDepth(60);

                    // Añadir borde
                    const border = this.add.rectangle(
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

        // Mostrar información del hechizo
        const spellInfo = this.add.text(
            this.player.sprite.x, this.player.sprite.y - 60,
            `${spell.name} - Rango: ${spell.range}`,
            {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 6, y: 3 }
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
}


























