/**
 * Escena base para diferentes tipos de combate
 * Esta clase puede ser extendida para crear diferentes tipos de combate
 */
import { Grid } from '@classes/Grid.js';
import { TurnManager } from '@systems/TurnManager.js';
import { CombatMapGenerator } from '@components/CombatMapGenerator.js';
import { CombatMovementSystem } from '@systems/combat/CombatMovementSystem.js';
import { SpellSystem } from '@systems/combat/SpellSystem.js';
import { EnemyManager } from '@systems/combat/EnemyManager.js';
import { SpellUI } from '@components/UI/SpellUI.js';
import { PlayerManager } from '@systems/PlayerManager.js';

export class Combat extends Phaser.Scene {
    constructor(key = 'Combat') {
        super({ key });
    }

    preload() {
        // Cargar assets básicos de combate
        this.loadCombatAssets();
    }

    loadCombatAssets() {
        // Cargar tileset isométrico (placeholder por ahora)
        // En el futuro estos serían assets reales
        this.load.image('iso-grass', 'assets/images/tiles/iso-grass.png');
        this.load.image('iso-water', 'assets/images/tiles/iso-water.png');
        this.load.image('iso-stone', 'assets/images/tiles/iso-stone.png');

        // Cargar sprite del personaje
        this.load.spritesheet('character', 'assets/images/characters/character.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    async create(data) {
        // Inicializar datos básicos
        this.initializeData(data);

        // Crear grid para combate
        this.grid = new Grid(this, 15, 15);

        // Inicializar sistemas
        this.initializeSystems();

        // Crear mapa de combate
        this.createCombatMap();

        // Crear jugador (ESPERAR a que termine)
        await this.createPlayer();

        // Configurar cámara
        this.setupCamera();

        // Configurar controles
        this.setupControls();

        // Inicializar UI (después de que el player esté listo)
        this.createUI();

        // Iniciar fase de posicionamiento
        this.startPositioningPhase();
    }

    initializeData(data) {
        // Guardar datos del usuario autenticado
        this.userData = data?.userData || this.registry.get('userData') || null;
        this.currentCharacterId = data?.characterId || this.registry.get('currentCharacterId') || null;

        // Tipo de mapa (puede ser configurado desde fuera)
        this.mapType = data?.mapType || 'symmetric';
        this.enemyCount = data?.enemyCount || 1;
        this.combatType = data?.combatType || 'normal'; // normal, boss, wave
    }

    initializeSystems() {
        // Crear generador de mapas
        this.mapGenerator = new CombatMapGenerator(this, this.grid);

        // Sistema de turnos
        this.turnManager = new TurnManager(this);
    }

    createCombatMap() {
        // Crear diferentes tipos de mapas según configuración
        switch (this.mapType) {
            case 'arena':
                this.mapGenerator.createArenaMap();
                break;
            case 'openfield':
                this.mapGenerator.createOpenFieldMap();
                break;
            case 'maze':
                this.mapGenerator.createMazeMap();
                break;
            default:
                this.mapGenerator.createSymmetricMap();
        }
    }

    async createPlayer() {
        // Usar PlayerManager para crear/cargar jugador
        this.playerManager = new PlayerManager(this, this.userData, this.currentCharacterId);
        this.player = await this.playerManager.createPlayer();

        if (!this.player) {
            console.error('Error: No se pudo crear el jugador en combate');
            return;
        }

        // Configurar puntos de movimiento para combate (no exploración)
        this.player.maxMovementPoints = 3;
        this.player.currentMovementPoints = 3;

        // Inicializar sistemas que dependen del jugador
        this.initializePlayerDependentSystems();

        // Mover jugador a zona de posicionamiento automáticamente
        this.movePlayerToPositioningZone();

        // Añadir jugador al sistema de turnos
        this.turnManager.addEntity(this.player);
    }

    initializePlayerDependentSystems() {
        // Sistema de movimiento de combate
        this.movementSystem = new CombatMovementSystem(this, this.grid, this.player);

        // Sistema de hechizos
        this.spellSystem = new SpellSystem(this, this.grid, this.player);

        // Gestor de enemigos
        this.enemyManager = new EnemyManager(this, this.grid, this.player);
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, 1280, 720);
        if (this.player && this.player.sprite) {
            this.cameras.main.startFollow(this.player.sprite);
        }
    }

    setupControls() {
        // Input del mouse para movimiento y hechizos
        this.input.on('pointerdown', (pointer) => {
            this.handleMouseClick(pointer);
        });

        // Configurar teclas básicas
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

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

    createUI() {
        // Crear UI de hechizos
        this.spellUI = new SpellUI(this, this.player, this.spellSystem);
        this.spellUI.setupKeyboardShortcuts();
    }

    startPositioningPhase() {
        // Iniciar fase de posicionamiento
        this.turnManager.startPositioning();

        // Resaltar celdas de posicionamiento
        this.movementSystem.highlightPositioningCells();

        console.log('Fase de posicionamiento iniciada');
    }

    handleMouseClick(pointer) {
        // Convertir coordenadas del mouse a coordenadas de grid
        const gridPos = this.grid.worldToGrid(pointer.worldX, pointer.worldY);

        // Verificar si la posición es válida
        if (gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= this.grid.width || gridPos.y >= this.grid.height) {
            return;
        }

        // Fase de posicionamiento
        if (this.turnManager.gameState === 'positioning') {
            this.handlePositioningClick(gridPos.x, gridPos.y);
            return;
        }

        // Fase de combate
        if (this.turnManager.gameState === 'playing' && this.turnManager.isPlayerTurn) {
            this.handleCombatClick(gridPos.x, gridPos.y);
        }
    }

    handlePositioningClick(x, y) {
        // Solo permitir movimiento a celdas válidas de posicionamiento
        if (this.movementSystem.isValidPositioningCell(x, y)) {
            this.movementSystem.movePlayerToPosition(x, y);
            console.log(`Jugador posicionado en: ${x}, ${y}`);
        }
    }

    handleCombatClick(x, y) {
        // Si estamos en modo hechizo
        if (this.spellSystem.isInSpellMode()) {
            this.spellSystem.castSpell(x, y);
            return;
        }

        // Verificar si hay un enemigo en esa posición
        const targetEnemy = this.enemyManager.getEnemyAt(x, y);

        if (targetEnemy) {
            // Intentar atacar al enemigo
            if (this.player.attackEnemy(targetEnemy)) {
                this.turnManager.updateTurnUI();
                this.spellUI.updateSpellButtons();
                this.turnManager.checkGameEnd();
            }
        } else {
            // Intentar mover al jugador
            if (this.player.moveTo(x, y)) {
                this.turnManager.updateTurnUI();
                this.spellUI.updateSpellButtons();
            }
        }
    }

    // Iniciar combate después del posicionamiento
    startCombat() {
        // Limpiar indicadores de posicionamiento
        this.movementSystem.clearMovementPreview();

        // Generar enemigos según el tipo de combate
        this.spawnEnemies();

        // Cambiar a estado de combate
        this.turnManager.startCombat();

        console.log('¡Combate iniciado!');
    }

    spawnEnemies() {
        switch (this.combatType) {
            case 'boss':
                this.enemyManager.spawnBoss();
                break;
            case 'wave':
                this.enemyManager.spawnWave(1);
                break;
            case 'formation':
                this.enemyManager.spawnFormation('line');
                break;
            default:
                this.enemyManager.spawnEnemiesRandomly(this.enemyCount);
        }
    }

    // Método para finalizar combate
    endCombat(victory = false) {
        if (victory) {
            console.log('¡Victoria!');
            // Lógica de victoria (XP, recompensas, etc.)
            this.handleVictory();
        } else {
            console.log('Derrota...');
            // Lógica de derrota
            this.handleDefeat();
        }
    }

    handleVictory() {
        // Implementar lógica de victoria
        // Por ahora, volver al mapa de exploración
        this.time.delayedCall(2000, () => {
            // Limpiar estado antes de cambiar de escena
            this.cleanupBeforeSceneChange();

            this.scene.start('ExplorationMapRefactored', {
                userData: this.userData,
                characterId: this.currentCharacterId,
                comingFromCombat: true // Bandera para indicar que viene del combate
            });
        });
    }

    handleDefeat() {
        // Implementar lógica de derrota
        // Por ahora, volver al mapa de exploración
        this.time.delayedCall(2000, () => {
            // Limpiar estado antes de cambiar de escena
            this.cleanupBeforeSceneChange();

            this.scene.start('ExplorationMapRefactored', {
                userData: this.userData,
                characterId: this.currentCharacterId,
                comingFromCombat: true // Bandera para indicar que viene del combate
            });
        });
    }

    // Mover jugador automáticamente a una zona de posicionamiento
    movePlayerToPositioningZone() {
        // Buscar la primera zona de posicionamiento disponible
        const validCells = this.movementSystem.getValidPositioningCells();

        if (validCells.length > 0) {
            // Elegir la primera celda disponible (o la más central)
            const targetCell = validCells[0];

            // Mover al jugador a esa posición
            this.movementSystem.movePlayerToPosition(targetCell.x, targetCell.y);

            console.log(`Jugador posicionado automáticamente en: ${targetCell.x}, ${targetCell.y}`);
        } else {
            console.warn('No se encontraron zonas de posicionamiento válidas');
        }
    }

    // Limpiar estado antes de cambiar de escena
    cleanupBeforeSceneChange() {
        console.log('🧹 Limpiando estado antes de cambiar de escena...');

        // Destruir completamente TurnManager para limpiar todos los elementos de UI
        if (this.turnManager) {
            this.turnManager.destroy();
            this.turnManager = null;
        }

        // Destruir SpellUI para limpiar elementos de hechizos
        if (this.spellUI) {
            this.spellUI.destroy();
            this.spellUI = null;
        }

        // Limpiar sistemas
        if (this.movementSystem) this.movementSystem.clearMovementPreview();
        if (this.spellSystem) this.spellSystem.clearSpellRange();
        if (this.enemyManager) this.enemyManager.clearEnemies();

        // Limpiar cualquier elemento de texto que pueda haber quedado
        this.cleanupRemainingTextElements();

        console.log('✅ Estado limpiado correctamente');
    }

    // Método para limpiar elementos de texto que puedan haber quedado
    cleanupRemainingTextElements() {
        // Buscar y destruir todos los elementos de texto con depth alto (UI)
        if (this.children && this.children.list) {
            const textElements = this.children.list.filter(child => {
                return child.type === 'Text' && child.depth >= 1000;
            });

            textElements.forEach(element => {
                try {
                    if (element && element.destroy) {
                        element.destroy();
                    }
                } catch (error) {
                    console.warn('Error limpiando elemento de texto:', error);
                }
            });
        }

        // También limpiar elementos de imagen/gráficos de UI
        if (this.children && this.children.list) {
            const uiElements = this.children.list.filter(child => {
                return (child.type === 'Image' || child.type === 'Rectangle' || child.type === 'Graphics') &&
                       child.depth >= 1500;
            });

            uiElements.forEach(element => {
                try {
                    if (element && element.destroy) {
                        element.destroy();
                    }
                } catch (error) {
                    console.warn('Error limpiando elemento de UI:', error);
                }
            });
        }
    }

    destroy() {
        // Limpiar todos los sistemas
        if (this.movementSystem) this.movementSystem.destroy();
        if (this.spellSystem) this.spellSystem.destroy();
        if (this.enemyManager) this.enemyManager.destroy();
        if (this.spellUI) this.spellUI.destroy();

        super.destroy();
    }
}