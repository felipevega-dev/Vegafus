import { Grid } from '@classes/Grid.js';
import { PlayerInfoPanel } from '@components/UI/PlayerInfoPanel.js';
import { ExperienceBar } from '@components/UI/ExperienceBar.js';
import { GameInstructions } from '@components/UI/GameInstructions.js';
import { UserInfoPanel } from '@components/UI/UserInfoPanel.js';
import { MapGenerator } from '@components/MapGenerator.js';
import { MonsterManager } from '@systems/combat/MonsterManager.js';
import { MovementSystem } from '@systems/MovementSystem.js';
import { SaveSystem } from '@systems/SaveSystem.js';
import { NotificationSystem } from '@systems/NotificationSystem.js';
import { PlayerManager } from '@systems/PlayerManager.js';

export class ExplorationMapRefactored extends Phaser.Scene {
    constructor() {
        super({ key: 'ExplorationMapRefactored' });
    }

    preload() {
        // Crear sprites placeholder directamente
        this.mapGenerator = new MapGenerator(this, null);
        this.mapGenerator.createPlaceholderSprites();
    }

    async create(data) {
        console.log('Iniciando mapa de exploración refactorizado');

        // Inicializar datos básicos
        this.initializeData(data);

        // Crear grid
        this.grid = new Grid(this, 30, 20); // 30x20 para exploración

        // Inicializar sistemas
        this.initializeSystems();

        // Crear el mapa de exploración
        this.mapGenerator = new MapGenerator(this, this.grid);
        this.mapGenerator.createExplorationMap();

        // Crear jugador (ahora async) - ESPERAR a que termine
        await this.createPlayer();

        // Solo continuar después de que el jugador esté creado
        if (this.player) {
            // Configurar sistemas que dependen del jugador
            this.setupPlayerDependentSystems();

            // Configurar controles
            this.setupControls();

            // Crear UI
            this.createUI();

            // Iniciar auto-guardado si hay usuario autenticado
            if (this.userData) {
                this.saveSystem.startAutoSave();
            }
        } else {
            console.error('Error: No se pudo crear el jugador');
        }
    }

    initializeData(data) {
        // Guardar datos del usuario autenticado
        this.userData = data?.userData || data?.user || null;
        if (this.userData) {
            console.log('Usuario autenticado:', this.userData.username);
        }

        // Obtener ID del personaje (puede venir de la selección o del combate)
        this.currentCharacterId = data?.characterId || this.registry.get('currentCharacterId') || null;

        if (this.currentCharacterId) {
            console.log('🎭 Personaje seleccionado ID:', this.currentCharacterId);
        }
    }

    initializeSystems() {
        // Sistemas que no dependen del jugador
        this.notificationSystem = new NotificationSystem(this);
        this.saveSystem = new SaveSystem(this, this.userData, this.currentCharacterId, null);
    }

    async createPlayer() {
        this.playerManager = new PlayerManager(this, this.userData, this.currentCharacterId);
        this.player = await this.playerManager.createPlayer();
        
        // Actualizar el sistema de guardado con el jugador
        this.saveSystem.player = this.player;
        this.saveSystem.currentCharacterId = this.playerManager.getCurrentCharacterId();
        this.currentCharacterId = this.playerManager.getCurrentCharacterId();

        // Actualizar UI después de crear el jugador (con delay para asegurar que todo esté listo)
        this.time.delayedCall(100, () => {
            this.updatePlayerUI();
        });
    }

    setupPlayerDependentSystems() {
        // Sistemas que dependen del jugador
        this.monsterManager = new MonsterManager(this, this.grid, this.player);
        this.movementSystem = new MovementSystem(this, this.grid, this.player);

        // Limpiar monstruos existentes y generar nuevos
        this.monsterManager.spawnRandomMonsters();
    }

    setupControls() {
        // Input del mouse
        this.input.on('pointerdown', (pointer) => {
            if (!this.monsterManager.isInInteractionMode()) {
                this.movementSystem.handleMouseClick(pointer);
            }
        });
        
        // Tecla ESC para cancelar interacciones
        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escapeKey.on('down', () => {
            this.monsterManager.clearInteractionUI();
        });

        // Tecla C para abrir características
        this.cKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
        this.cKey.on('down', () => {
            this.openCharacteristics();
        });
    }

    createUI() {
        // Crear componentes de UI
        this.playerInfoPanel = new PlayerInfoPanel(this);
        this.experienceBar = new ExperienceBar(this);
        this.gameInstructions = new GameInstructions(this);

        // Botón de características
        const characteristicsBtn = this.add.text(120, 80, 'CARACTERÍSTICAS (C)', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        characteristicsBtn.setOrigin(0.5);
        characteristicsBtn.setDepth(1001);
        characteristicsBtn.setInteractive();
        characteristicsBtn.on('pointerdown', () => this.openCharacteristics());

        // Panel de usuario si está autenticado
        if (this.userData) {
            this.userInfoPanel = new UserInfoPanel(this, this.userData, () => this.handleLogout());
        }

        // Actualizar UI con datos del jugador
        this.updatePlayerUI();
    }

    updatePlayerUI() {
        if (!this.player) {
            console.log('⚠️ No hay jugador para actualizar UI');
            return;
        }

        // Actualizar componentes de UI
        if (this.playerInfoPanel) {
            this.playerInfoPanel.updatePlayer(this.player);
        }

        if (this.experienceBar) {
            this.experienceBar.updatePlayer(this.player);
        }
    }

    openCharacteristics() {
        if (!this.player) {
            console.log('No hay jugador para mostrar características');
            return;
        }

        console.log('🎯 Abriendo interfaz de características');

        // Pausar esta escena y abrir la interfaz de características
        this.scene.pause();
        this.scene.launch('CharacteristicsScene', {
            player: this.player,
            userData: this.userData,
            characterId: this.currentCharacterId,
            parentScene: 'ExplorationMapRefactored'
        });
    }

    async handleLogout() {
        try {
            const success = await this.saveSystem.saveBeforeLogout();

            // Limpiar sistemas
            this.cleanup();

            // Volver a la escena de autenticación
            this.scene.start('AuthSceneHTML');
        } catch (error) {
            console.error('Error en logout:', error);
            // Aún así volver a la pantalla de login
            this.scene.start('AuthSceneHTML');
        }
    }

    cleanup() {
        // Limpiar todos los sistemas
        if (this.saveSystem) {
            this.saveSystem.destroy();
        }
        if (this.monsterManager) {
            this.monsterManager.destroy();
        }
        if (this.movementSystem) {
            this.movementSystem.destroy();
        }
        if (this.playerInfoPanel) {
            this.playerInfoPanel.destroy();
        }
        if (this.experienceBar) {
            this.experienceBar.destroy();
        }
        if (this.gameInstructions) {
            this.gameInstructions.destroy();
        }
        if (this.userInfoPanel) {
            this.userInfoPanel.destroy();
        }
    }

    destroy() {
        this.cleanup();
        super.destroy();
    }
}
