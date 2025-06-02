import { Player } from '../classes/Player.js';
import { Grid } from '../classes/Grid.js';

export class ExplorationMap extends Phaser.Scene {
    constructor() {
        super({ key: 'ExplorationMap' });
    }

    preload() {
        // Cargar assets básicos (reutilizar los del combate)
        this.load.image('character', 'assets/images/character.png');
        this.load.image('enemy', 'assets/images/enemy.png');
    }

    create(data) {
        console.log('Iniciando mapa de exploración');

        // Guardar datos del usuario autenticado
        this.userData = data?.user || null;
        if (this.userData) {
            console.log('Usuario autenticado:', this.userData.username);
        }

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
        
        // Crear jugador
        this.createPlayer();

        // Limpiar monstruos existentes y generar nuevos
        this.clearExistingMonsters();
        this.spawnRandomMonsters();

        // Configurar controles
        this.setupControls();

        // Crear UI
        this.createUI();
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

    createPlayer() {
        // Verificar si hay datos guardados del jugador
        const savedPlayerData = this.registry.get('playerData');

        if (savedPlayerData) {
            // Restaurar jugador con datos guardados
            this.player = new Player(this, savedPlayerData.gridX || 5, savedPlayerData.gridY || 10, savedPlayerData.playerClass || 'mage');
            this.player.currentHP = savedPlayerData.currentHP || this.player.maxHP;
            this.player.level = savedPlayerData.level || 1;
            this.player.experience = savedPlayerData.experience || 0;

            console.log(`Jugador restaurado: Nivel ${this.player.level}, XP: ${this.player.experience}`);
        } else {
            // Crear jugador nuevo
            this.player = new Player(this, 5, 10, 'mage');
        }

        // En exploración no hay límite de movimiento
        this.player.maxMovementPoints = 999;
        this.player.currentMovementPoints = 999;

        // No actualizar UI aquí, se hará en create()
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

    async handleLogout() {
        try {
            // Importar apiClient dinámicamente
            const { apiClient } = await import('../utils/ApiClient.js');

            await apiClient.logout();
            console.log('Logout exitoso');

            // Volver a la escena de autenticación
            this.scene.start('AuthSceneHTML');
        } catch (error) {
            console.error('Error en logout:', error);
            // Aún así volver a la pantalla de login
            this.scene.start('AuthSceneHTML');
        }
    }
}
