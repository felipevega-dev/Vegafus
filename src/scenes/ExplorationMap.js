import { Player } from '../classes/Player.js';
import { Grid } from '../classes/Grid.js';

export class ExplorationMap extends Phaser.Scene {
    constructor() {
        super({ key: 'ExplorationMap' });
    }

    preload() {
        // Crear sprites simples si no existen las imágenes
        this.load.on('filecomplete', (key) => {
            console.log('Archivo cargado:', key);
        });

        this.load.on('loaderror', (file) => {
            console.log('Error cargando:', file.key);
            // Crear sprite placeholder
            this.createPlaceholderSprite(file.key);
        });

        // Intentar cargar assets básicos
        this.load.image('character', 'assets/images/character.png');
        this.load.image('enemy', 'assets/images/enemy.png');
    }

    createPlaceholderSprite(key) {
        // Crear un sprite simple usando gráficos de Phaser
        const graphics = this.add.graphics();

        if (key === 'character') {
            graphics.fillStyle(0x00ff00); // Verde para el jugador
            graphics.fillCircle(16, 16, 12);
        } else if (key === 'enemy') {
            graphics.fillStyle(0xff0000); // Rojo para enemigos
            graphics.fillCircle(16, 16, 12);
        }

        graphics.generateTexture(key, 32, 32);
        graphics.destroy();
    }

    async create(data) {
        console.log('Iniciando mapa de exploración');

        // Guardar datos del usuario autenticado
        this.userData = data?.user || null;
        if (this.userData) {
            console.log('Usuario autenticado:', this.userData.username);
        }

        // Recuperar ID del personaje si viene del combate
        this.currentCharacterId = this.registry.get('currentCharacterId') || null;

        // Crear grid más grande para exploración
        this.grid = new Grid(this, 30, 20); // 30x20 para exploración

        // Variables del sistema
        this.selectedCell = null;
        this.movementIndicators = [];
        this.monsters = [];
        this.interactionMode = false; // Para mostrar opciones de interacción
        this.isMoving = false; // Para controlar animaciones de movimiento

        // Crear el mapa de exploración
        this.createExplorationMap();

        // Crear jugador (ahora async) - ESPERAR a que termine
        await this.createPlayer();

        // Solo continuar después de que el jugador esté creado
        if (this.player) {
            // Limpiar monstruos existentes y generar nuevos
            this.clearExistingMonsters();
            this.spawnRandomMonsters();

            // Configurar controles
            this.setupControls();

            // Crear UI
            this.createUI();

            // Iniciar auto-guardado si hay usuario autenticado
            if (this.userData) {
                this.startAutoSave();
            }
        } else {
            console.error('Error: No se pudo crear el jugador');
        }
    }

    createExplorationMap() {
        // Crear mapa de exploración más grande (30x20)
        const tileSize = 32; // Tiles más pequeños para el mapa de exploración
        const startX = 50;
        const startY = 50;

        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 30; x++) {
                const posX = startX + (x * tileSize);
                const posY = startY + (y * tileSize);

                // Crear diferentes tipos de terreno
                let tileType = 'grass';
                let walkable = true;

                // Bordes del mapa
                if (x === 0 || y === 0 || x === 29 || y === 19) {
                    tileType = 'mountain';
                    walkable = false;
                }
                // Algunos obstáculos aleatorios
                else if (Math.random() < 0.1) {
                    tileType = 'tree';
                    walkable = false;
                }
                // Algunos ríos
                else if ((x === 10 || x === 20) && y > 2 && y < 17) {
                    tileType = 'water';
                    walkable = false;
                }

                // Crear celda visual
                const cellBg = this.add.rectangle(posX, posY, tileSize - 1, tileSize - 1, this.getTileColor(tileType), 0.6);
                cellBg.setDepth(0);
                
                // Borde de la celda
                const cellBorder = this.add.rectangle(posX, posY, tileSize - 1, tileSize - 1);
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
                    if (walkable) {
                        this.showMovementPreview(x, y);
                    }
                });
                
                cellBg.on('pointerout', () => {
                    this.clearMovementPreview();
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

    async createPlayer() {
        // Si hay usuario autenticado, intentar cargar su personaje del backend
        if (this.userData) {
            try {
                await this.loadPlayerFromBackend();
            } catch (error) {
                console.error('Error cargando personaje del backend:', error);
                // Si falla, crear personaje por defecto
                this.createDefaultPlayer();
            }
        } else {
            // Sin usuario autenticado, usar datos locales
            this.createDefaultPlayer();
        }

        // En exploración no hay límite de movimiento
        this.player.maxMovementPoints = 999;
        this.player.currentMovementPoints = 999;

        // Actualizar UI después de crear el jugador
        this.updatePlayerUI();

        // Si viene del combate (hay datos guardados), guardar progreso actualizado
        const savedPlayerData = this.registry.get('playerData');
        if (savedPlayerData && this.currentCharacterId) {
            // Esperar un poco para que se complete la carga, luego guardar
            this.time.delayedCall(1000, () => {
                this.saveProgressToBackend();
            });
        }
    }

    async loadPlayerFromBackend() {
        const { apiClient } = await import('../utils/ApiClient.js');

        // Obtener personajes del usuario
        const response = await apiClient.getCharacters();
        const characters = response.characters;

        if (characters && characters.length > 0) {
            // Por ahora, usar el primer personaje (más tarde podemos hacer selección)
            const character = characters[0];

            console.log('Personaje cargado del backend:', character);

            // Crear jugador con datos del backend
            this.player = new Player(
                this,
                character.position?.x || 5,
                character.position?.y || 10,
                character.class || 'mage'
            );

            // Aplicar estadísticas del personaje
            this.player.level = character.level || 1;
            this.player.experience = character.experience || 0;
            this.player.currentHP = character.stats?.hp?.current || 100;
            this.player.maxHP = character.stats?.hp?.max || 100;
            this.player.attack = character.stats?.attack || 20;
            this.player.defense = character.stats?.defense || 10;

            // Guardar ID del personaje para futuras actualizaciones
            this.currentCharacterId = character.id;

            console.log(`Personaje cargado: ${character.name} - Nivel ${this.player.level}, XP: ${this.player.experience}`);
        } else {
            // No tiene personajes, crear uno nuevo
            await this.createNewCharacterInBackend();
        }
    }

    async createNewCharacterInBackend() {
        const { apiClient } = await import('../utils/ApiClient.js');

        try {
            // Crear personaje por defecto
            const response = await apiClient.createCharacter('Aventurero', 'mage');
            const character = response.character;

            console.log('Nuevo personaje creado:', character);

            // Crear jugador con datos del nuevo personaje
            this.player = new Player(this, 5, 10, character.class);
            this.player.level = character.level;
            this.player.experience = character.experience;
            this.player.currentHP = character.stats.hp.current;
            this.player.maxHP = character.stats.hp.max;
            this.player.attack = character.stats.attack;
            this.player.defense = character.stats.defense;

            this.currentCharacterId = character.id;

            console.log(`Nuevo personaje creado: Nivel ${this.player.level}, XP: ${this.player.experience}`);
        } catch (error) {
            console.error('Error creando personaje:', error);
            this.createDefaultPlayer();
        }
    }

    createDefaultPlayer() {
        // Verificar si hay datos guardados localmente
        const savedPlayerData = this.registry.get('playerData');

        if (savedPlayerData) {
            // Restaurar jugador con datos guardados localmente
            this.player = new Player(this, savedPlayerData.gridX || 5, savedPlayerData.gridY || 10, savedPlayerData.playerClass || 'mage');
            this.player.currentHP = savedPlayerData.currentHP || this.player.maxHP;
            this.player.level = savedPlayerData.level || 1;
            this.player.experience = savedPlayerData.experience || 0;

            console.log(`Jugador restaurado localmente: Nivel ${this.player.level}, XP: ${this.player.experience}`);
        } else {
            // Crear jugador completamente nuevo
            this.player = new Player(this, 5, 10, 'mage');
            console.log('Jugador nuevo creado');
        }
    }

    clearExistingMonsters() {
        // Limpiar monstruos existentes
        if (this.monsters) {
            this.monsters.forEach(monster => {
                if (monster.sprite && monster.sprite.destroy) {
                    monster.sprite.destroy();
                }
                // Liberar celda ocupada
                if (monster.gridX !== undefined && monster.gridY !== undefined) {
                    this.grid.setFree(monster.gridX, monster.gridY);
                }
            });
        }
        this.monsters = [];
    }

    updatePlayerUI() {
        // Actualizar información del jugador solo si existe
        if (this.playerInfo && this.playerInfo.setText) {
            this.playerInfo.setText(`HP: ${this.player.currentHP}/${this.player.maxHP} | Nivel: ${this.player.level}`);
        }

        // Actualizar barra de experiencia
        if (this.expBar && this.updateExperienceBar) {
            this.updateExperienceBar();
        }
    }

    spawnRandomMonsters() {
        const monsterCount = 8; // 8 monstruos en el mapa
        const monsterTypes = ['basic', 'strong', 'fast'];
        
        for (let i = 0; i < monsterCount; i++) {
            // Encontrar posición aleatoria válida
            let x, y;
            let attempts = 0;
            
            do {
                x = Phaser.Math.Between(2, 27);
                y = Phaser.Math.Between(2, 17);
                attempts++;
            } while ((!this.grid.isWalkable(x, y) || this.grid.cells[y][x].occupied || 
                     this.grid.getDistance(x, y, this.player.gridX, this.player.gridY) < 3) && 
                     attempts < 50);
            
            if (attempts < 50) {
                const monsterType = monsterTypes[i % monsterTypes.length];
                const monster = this.createMonster(x, y, monsterType);
                this.monsters.push(monster);
            }
        }
    }

    createMonster(gridX, gridY, type) {
        const worldPos = this.grid.gridToWorld(gridX, gridY);
        
        // Crear sprite del monstruo
        const sprite = this.add.sprite(worldPos.x, worldPos.y, 'enemy');
        sprite.setDepth(100);
        sprite.setInteractive();
        
        // Color según tipo
        const colors = {
            'basic': 0xff6666,
            'strong': 0xff3333,
            'fast': 0xffaa66
        };
        sprite.setTint(colors[type] || 0xff6666);
        
        // Ocupar celda
        this.grid.setOccupied(gridX, gridY, { type: 'monster' });
        
        // Evento de clic en monstruo
        sprite.on('pointerdown', () => {
            this.showMonsterInteraction(gridX, gridY, type);
        });
        
        return {
            sprite,
            gridX,
            gridY,
            type,
            isAlive: true
        };
    }

    showMonsterInteraction(gridX, gridY, monsterType) {
        // Limpiar interacciones previas
        this.clearInteractionUI();
        
        const worldPos = this.grid.gridToWorld(gridX, gridY);
        
        // Panel de interacción
        const panel = this.add.rectangle(worldPos.x, worldPos.y - 60, 120, 80, 0x000000, 0.8);
        panel.setDepth(200);
        
        // Botón de atacar
        const attackButton = this.add.text(worldPos.x, worldPos.y - 80, 'ATACAR', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        attackButton.setOrigin(0.5);
        attackButton.setDepth(201);
        attackButton.setInteractive();
        
        // Botón de huir
        const fleeButton = this.add.text(worldPos.x, worldPos.y - 50, 'HUIR', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        fleeButton.setOrigin(0.5);
        fleeButton.setDepth(201);
        fleeButton.setInteractive();
        
        // Eventos
        attackButton.on('pointerdown', () => {
            this.startCombat(monsterType);
        });
        
        fleeButton.on('pointerdown', () => {
            this.clearInteractionUI();
        });
        
        // Guardar referencias para limpiar
        this.interactionUI = [panel, attackButton, fleeButton];
        this.interactionMode = true;
    }

    clearInteractionUI() {
        if (this.interactionUI) {
            this.interactionUI.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.interactionUI = [];
        }
        this.interactionMode = false;
    }

    startCombat(monsterType) {
        console.log(`Iniciando combate contra: ${monsterType}`);

        // Guardar estado completo del jugador
        this.registry.set('playerData', {
            gridX: this.player.gridX,
            gridY: this.player.gridY,
            currentHP: this.player.currentHP,
            maxHP: this.player.maxHP,
            level: this.player.level,
            experience: this.player.experience,
            playerClass: this.player.playerClass,
            attack: this.player.attack,
            defense: this.player.defense
        });

        // Guardar datos del usuario para mantener la sesión
        this.registry.set('userData', this.userData);
        this.registry.set('currentCharacterId', this.currentCharacterId);

        console.log(`Datos guardados: Nivel ${this.player.level}, XP: ${this.player.experience}`);

        // Cambiar a escena de combate
        this.scene.start('IsometricMap');
    }

    setupControls() {
        // Input del mouse
        this.input.on('pointerdown', (pointer) => {
            if (!this.interactionMode) {
                this.handleMouseClick(pointer);
            }
        });
        
        // Tecla ESC para cancelar interacciones
        this.escapeKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.escapeKey.on('down', () => {
            this.clearInteractionUI();
        });
    }

    handleMouseClick(pointer) {
        const gridPos = this.grid.worldToGrid(pointer.worldX, pointer.worldY);

        if (gridPos.x < 0 || gridPos.y < 0 || gridPos.x >= this.grid.width || gridPos.y >= this.grid.height) {
            return;
        }

        // En exploración, mover con animación suave
        if (this.grid.isWalkable(gridPos.x, gridPos.y) && !this.grid.cells[gridPos.y][gridPos.x].occupied) {
            this.movePlayerWithAnimation(gridPos.x, gridPos.y);
        }
    }

    movePlayerWithAnimation(targetX, targetY) {
        // Evitar múltiples movimientos simultáneos
        if (this.isMoving) return;

        this.isMoving = true;

        // Liberar celda anterior
        this.grid.setFree(this.player.gridX, this.player.gridY);

        // Calcular posición mundial del objetivo
        const targetWorldPos = this.grid.gridToWorld(targetX, targetY);

        // Animar el movimiento
        this.tweens.add({
            targets: this.player.sprite,
            x: targetWorldPos.x,
            y: targetWorldPos.y,
            duration: 300, // 300ms de animación
            ease: 'Power2',
            onComplete: () => {
                // Actualizar posición lógica después de la animación
                this.player.gridX = targetX;
                this.player.gridY = targetY;

                // Ocupar nueva celda
                this.grid.setOccupied(this.player.gridX, this.player.gridY, this.player);

                // Actualizar barra de vida
                this.player.updateHealthBarPosition();

                // Permitir nuevo movimiento
                this.isMoving = false;

                console.log(`Jugador movido a: ${targetX}, ${targetY}`);
            }
        });
    }

    createUI() {
        // Panel de información del jugador (más grande)
        const playerPanel = this.add.rectangle(120, 40, 220, 70, 0x000000, 0.8);
        playerPanel.setDepth(1000);
        playerPanel.setStrokeStyle(2, 0x444444);

        // Información básica del jugador
        this.playerInfo = this.add.text(120, 20,
            `HP: ${this.player.currentHP}/${this.player.maxHP} | Nivel: ${this.player.level}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        this.playerInfo.setOrigin(0.5);
        this.playerInfo.setDepth(1001);

        // Barra de experiencia
        this.createExperienceBar();

        // Instrucciones
        this.add.text(400, 30, 'Click en monstruos para interactuar | ESC para cancelar', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setDepth(1001);

        // Mostrar información del usuario y botón de logout si está autenticado
        if (this.userData) {
            this.add.text(1100, 20, `Usuario: ${this.userData.username}`, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setDepth(1001);

            // Botón de logout
            const logoutButton = this.add.text(1200, 40, 'LOGOUT', {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#ff4444',
                backgroundColor: '#333333',
                padding: { x: 8, y: 4 }
            });
            logoutButton.setOrigin(0.5);
            logoutButton.setDepth(1001);
            logoutButton.setInteractive();
            logoutButton.on('pointerdown', () => this.handleLogout());
        }
    }

    createExperienceBar() {
        const barWidth = 180;
        const barHeight = 12;
        const barX = 120;
        const barY = 45;

        // Fondo de la barra
        this.expBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333);
        this.expBarBg.setDepth(1001);
        this.expBarBg.setStrokeStyle(1, 0x666666);

        // Barra de experiencia
        this.expBar = this.add.rectangle(barX, barY, 0, barHeight, 0x00ff00);
        this.expBar.setDepth(1002);
        this.expBar.setOrigin(0.5, 0.5);

        // Texto de experiencia
        this.expText = this.add.text(barX, barY + 20, '', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        this.expText.setOrigin(0.5);
        this.expText.setDepth(1001);

        // Actualizar la barra
        this.updateExperienceBar();
    }

    updateExperienceBar() {
        const currentLevel = this.player.level;
        const currentExp = this.player.experience;

        // Calcular experiencia para el nivel actual y siguiente
        const expForCurrentLevel = (currentLevel - 1) * 200;
        const expForNextLevel = currentLevel * 200;
        const expInCurrentLevel = currentExp - expForCurrentLevel;
        const expNeededForLevel = expForNextLevel - expForCurrentLevel;

        // Calcular porcentaje
        const percentage = Math.max(0, Math.min(1, expInCurrentLevel / expNeededForLevel));

        // Actualizar barra visual
        const barWidth = 180;
        this.expBar.width = barWidth * percentage;

        // Actualizar texto
        this.expText.setText(`XP: ${expInCurrentLevel}/${expNeededForLevel} (Total: ${currentExp})`);

        console.log(`Barra XP actualizada: ${expInCurrentLevel}/${expNeededForLevel} (${Math.round(percentage * 100)}%)`);
    }

    // Métodos de preview (simplificados del combate)
    showMovementPreview(targetX, targetY) {
        this.clearMovementPreview();

        // En exploración, solo mostrar si la celda es alcanzable
        const path = this.grid.findPath(
            this.player.gridX, this.player.gridY,
            targetX, targetY,
            999 // Sin límite de movimiento en exploración
        );

        if (!path || path.length === 0) return;

        // Mostrar solo la celda objetivo
        const worldPos = this.grid.gridToWorld(targetX, targetY);

        const previewCell = this.add.rectangle(
            worldPos.x, worldPos.y,
            this.grid.tileSize - 4, this.grid.tileSize - 4,
            0x00ff00, 0.6 // Verde para indicar movimiento libre
        );
        previewCell.setDepth(50);

        this.movementIndicators.push(previewCell);
    }

    clearMovementPreview() {
        this.movementIndicators.forEach(indicator => {
            if (indicator && indicator.destroy) {
                indicator.destroy();
            }
        });
        this.movementIndicators = [];
    }

    async saveProgressToBackend() {
        // Solo guardar si hay usuario autenticado y personaje cargado
        if (!this.userData || !this.currentCharacterId || !this.player) {
            return;
        }

        try {
            const { apiClient } = await import('../utils/ApiClient.js');

            const gameData = {
                level: this.player.level,
                experience: this.player.experience,
                stats: {
                    hp: {
                        current: this.player.currentHP,
                        max: this.player.maxHP
                    },
                    attack: this.player.attack,
                    defense: this.player.defense
                },
                position: {
                    x: this.player.gridX,
                    y: this.player.gridY
                }
            };

            await apiClient.saveProgress(this.currentCharacterId, gameData);
            console.log('✅ Progreso guardado en el backend');
        } catch (error) {
            console.error('❌ Error guardando progreso:', error);
        }
    }

    // Método para guardar automáticamente cada cierto tiempo
    startAutoSave() {
        // Guardar cada 30 segundos
        this.autoSaveTimer = this.time.addEvent({
            delay: 30000, // 30 segundos
            callback: () => {
                this.saveProgressToBackend();
            },
            loop: true
        });
    }

    async handleLogout() {
        try {
            // Guardar progreso antes de hacer logout
            await this.saveProgressToBackend();

            // Importar apiClient dinámicamente
            const { apiClient } = await import('../utils/ApiClient.js');

            await apiClient.logout();
            console.log('Logout exitoso');

            // Limpiar timer de auto-guardado
            if (this.autoSaveTimer) {
                this.autoSaveTimer.destroy();
            }

            // Volver a la escena de autenticación
            this.scene.start('AuthSceneHTML');
        } catch (error) {
            console.error('Error en logout:', error);
            // Aún así volver a la pantalla de login
            this.scene.start('AuthSceneHTML');
        }
    }
}
