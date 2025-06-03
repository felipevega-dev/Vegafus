import { CombatSummary } from './CombatSummary.js';
import { DropSystem } from './DropSystem.js';

export class TurnManager {
    constructor(scene) {
        this.scene = scene;
        this.currentTurn = 0;
        this.turnOrder = [];
        this.currentEntityIndex = 0;
        this.isPlayerTurn = true;
        this.gameState = 'positioning'; // 'positioning', 'playing', 'victory', 'defeat'

        // Sistema de temporizador
        this.turnTimeLimit = 30000; // 30 segundos por turno
        this.currentTurnTimer = null;
        this.timeRemaining = this.turnTimeLimit;

        // Sistema de resumen de combate
        this.combatSummary = new CombatSummary(scene);
        this.defeatedEnemies = [];

        // Sistema de drops
        this.dropSystem = new DropSystem(scene);

        // UI del sistema de turnos
        this.createTurnUI();
    }

    // Añadir entidades al orden de turnos
    addEntity(entity) {
        this.turnOrder.push(entity);
    }

    // Inicializar fase de posicionamiento
    startPositioning() {
        this.gameState = 'positioning';
        this.updateTurnUI();
    }

    // Inicializar el combate real
    startCombat() {
        this.currentTurn = 1;
        this.currentEntityIndex = 0;
        this.gameState = 'playing';

        if (this.turnOrder.length > 0) {
            this.startCurrentEntityTurn();
        }

        this.updateTurnUI();
    }

    // Confirmar posición y comenzar combate
    confirmPositionAndStartCombat() {
        if (this.gameState !== 'positioning') return;

        // Generar enemigos aleatoriamente
        this.scene.spawnEnemiesRandomly();

        // Cambiar a modo combate
        this.startCombat();
    }

    // Iniciar el turno de la entidad actual
    startCurrentEntityTurn() {
        const currentEntity = this.getCurrentEntity();

        if (!currentEntity || !currentEntity.isAlive) {
            this.nextTurn();
            return;
        }

        // Limpiar temporizador anterior
        if (this.currentTurnTimer) {
            this.currentTurnTimer.destroy();
        }

        // Terminar turno de la entidad anterior
        this.turnOrder.forEach(entity => {
            if (entity.endTurn) entity.endTurn();
        });

        // Determinar si es turno del jugador o enemigo
        this.isPlayerTurn = currentEntity.constructor.name === 'Player';

        // Iniciar turno de la entidad actual
        if (currentEntity.startTurn) {
            currentEntity.startTurn();
        }

        // Configurar temporizador solo para el jugador
        if (this.isPlayerTurn) {
            this.timeRemaining = this.turnTimeLimit;
            this.startTurnTimer();

            // Actualizar UI de hechizos DESPUÉS de que se haya ejecutado startTurn()
            if (this.scene.updateSpellButtons) {
                this.scene.updateSpellButtons();
            }
        }

        // Si es turno del enemigo, ejecutar IA después de un breve delay
        if (!this.isPlayerTurn && currentEntity.performAI) {
            this.scene.time.delayedCall(1000, () => {
                if (this.gameState === 'playing') {
                    currentEntity.performAI(this.getPlayer());
                    this.scene.time.delayedCall(1500, () => {
                        this.nextTurn();
                    });
                }
            });
        }

        this.updateTurnUI();
    }

    // Iniciar temporizador de turno
    startTurnTimer() {
        this.currentTurnTimer = this.scene.time.addEvent({
            delay: 100, // Actualizar cada 100ms
            callback: () => {
                this.timeRemaining -= 100;
                this.updateTurnUI();

                if (this.timeRemaining <= 0) {
                    // Tiempo agotado, pasar al siguiente turno
                    this.nextTurn();
                }
            },
            loop: true
        });
    }

    // Pasar al siguiente turno
    nextTurn() {
        if (this.gameState !== 'playing') return;

        this.currentEntityIndex++;
        
        // Si hemos completado una ronda, incrementar el número de turno
        if (this.currentEntityIndex >= this.turnOrder.length) {
            this.currentEntityIndex = 0;
            this.currentTurn++;
        }

        // Verificar condiciones de victoria/derrota
        if (this.checkGameEnd()) {
            return;
        }

        this.startCurrentEntityTurn();
    }

    // Obtener la entidad actual
    getCurrentEntity() {
        if (this.currentEntityIndex < this.turnOrder.length) {
            return this.turnOrder[this.currentEntityIndex];
        }
        return null;
    }

    // Obtener el jugador
    getPlayer() {
        return this.turnOrder.find(entity => entity.constructor.name === 'Player');
    }

    // Obtener todos los enemigos vivos
    getAliveEnemies() {
        return this.turnOrder.filter(entity => 
            entity.constructor.name === 'Enemy' && entity.isAlive
        );
    }

    // Verificar si el juego ha terminado
    checkGameEnd() {
        const player = this.getPlayer();
        const aliveEnemies = this.getAliveEnemies();

        // Verificar derrota del jugador
        if (!player || !player.isAlive) {
            this.gameState = 'defeat';
            this.showGameEndMessage('¡Has sido derrotado!', 0xff0000);
            return true;
        }

        // Verificar victoria (todos los enemigos muertos)
        if (aliveEnemies.length === 0) {
            this.gameState = 'victory';
            // Llamada asíncrona sin await para no bloquear el flujo
            this.handleVictory(player).catch(error => {
                console.error('Error manejando victoria:', error);
            });
            return true;
        }

        return false;
    }

    // Manejar victoria del jugador
    async handleVictory(player) {
        // Calcular experiencia ganada
        const experienceGained = CombatSummary.calculateExperience(this.defeatedEnemies);

        // Verificar subida de nivel
        const leveledUp = CombatSummary.checkLevelUp(player, experienceGained);

        if (leveledUp) {
            // Actualizar UI del jugador si subió de nivel
            this.updateTurnUI();
        }

        // Calcular y aplicar drops (ahora asíncrono)
        const drops = await this.dropSystem.calculateCombatDrops(player, this.defeatedEnemies);
        await this.dropSystem.applyDropsToPlayer(player, drops);

        console.log('🎉 ¡Victoria! Drops obtenidos:', drops);

        // Actualizar UI del jugador después de aplicar drops
        this.updateTurnUI();

        // Mostrar resumen de combate (ahora incluirá los drops)
        this.combatSummary.showSummary(this.defeatedEnemies, experienceGained, player, drops);
    }

    // Registrar enemigo derrotado
    registerDefeatedEnemy(enemy) {
        this.defeatedEnemies.push({
            type: enemy.type,
            name: enemy.constructor.name
        });
    }

    // Mostrar mensaje de fin de juego
    showGameEndMessage(message, color) {
        const gameEndText = this.scene.add.text(
            640, 360,
            message,
            {
                fontSize: '48px',
                fontFamily: 'Arial',
                color: `#${color.toString(16).padStart(6, '0')}`,
                fontStyle: 'bold'
            }
        );
        gameEndText.setOrigin(0.5);
        gameEndText.setDepth(2000);

        // Añadir botón de reinicio
        const restartButton = this.scene.add.text(
            640, 420,
            'Presiona ESPACIO para reiniciar',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                backgroundColor: '#333333',
                padding: { x: 20, y: 10 }
            }
        );
        restartButton.setOrigin(0.5);
        restartButton.setDepth(2000);

        // Configurar tecla de reinicio
        this.scene.input.keyboard.once('keydown-SPACE', () => {
            this.scene.scene.restart();
        });
    }

    // Crear interfaz de usuario para los turnos
    createTurnUI() {
        // Panel de información de turno
        this.turnPanel = this.scene.add.rectangle(100, 60, 180, 100, 0x000000, 0.7);
        this.turnPanel.setDepth(1500);

        // Texto del turno actual
        this.turnText = this.scene.add.text(100, 25, 'Turno: 1', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.turnText.setOrigin(0.5);
        this.turnText.setDepth(1501);

        // Texto de la entidad actual
        this.entityText = this.scene.add.text(100, 45, 'Jugador', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#00ff00'
        });
        this.entityText.setOrigin(0.5);
        this.entityText.setDepth(1501);

        // Texto del temporizador
        this.timerText = this.scene.add.text(100, 65, 'Tiempo: 30s', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00'
        });
        this.timerText.setOrigin(0.5);
        this.timerText.setDepth(1501);

        // Botón de terminar turno (solo visible en turno del jugador)
        this.endTurnButton = this.scene.add.text(100, 85, 'Terminar Turno', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#666666',
            padding: { x: 8, y: 4 }
        });
        this.endTurnButton.setOrigin(0.5);
        this.endTurnButton.setDepth(1501);
        this.endTurnButton.setInteractive();
        this.endTurnButton.on('pointerdown', () => {
            if (this.isPlayerTurn && this.gameState === 'playing') {
                this.nextTurn();
            }
        });

        // Botón "Listo" para confirmar posición
        this.readyButton = this.scene.add.text(100, 85, 'LISTO', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#00aa00',
            padding: { x: 12, y: 6 }
        });
        this.readyButton.setOrigin(0.5);
        this.readyButton.setDepth(1501);
        this.readyButton.setInteractive();
        this.readyButton.on('pointerdown', () => {
            if (this.gameState === 'positioning') {
                this.confirmPositionAndStartCombat();
            }
        });

        // Efectos hover para el botón Listo
        this.readyButton.on('pointerover', () => {
            if (this.gameState === 'positioning') {
                this.readyButton.setStyle({ backgroundColor: '#00cc00' });
            }
        });

        this.readyButton.on('pointerout', () => {
            if (this.gameState === 'positioning') {
                this.readyButton.setStyle({ backgroundColor: '#00aa00' });
            }
        });

        // Panel de información del jugador
        this.createPlayerInfoPanel();
    }

    // Crear panel de información del jugador
    createPlayerInfoPanel() {
        // Panel principal
        this.playerPanel = this.scene.add.rectangle(640, 50, 300, 80, 0x000000, 0.7);
        this.playerPanel.setDepth(1500);

        // Texto de vida
        this.playerHPText = this.scene.add.text(580, 30, 'HP: 100/100', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#00ff00'
        });
        this.playerHPText.setDepth(1501);

        // Texto de puntos de acción
        this.playerAPText = this.scene.add.text(580, 50, 'PA: 6/6', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffff00'
        });
        this.playerAPText.setDepth(1501);

        // Texto de puntos de movimiento
        this.playerMPText = this.scene.add.text(580, 70, 'PM: 3/3', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#00ffff'
        });
        this.playerMPText.setDepth(1501);
    }

    // Actualizar la interfaz de usuario
    updateTurnUI() {
        // Manejar fase de posicionamiento
        if (this.gameState === 'positioning') {
            this.turnText.setText('Posicionamiento');
            this.entityText.setText('Elige tu posición');
            this.entityText.setColor('#00ffff');
            this.timerText.setVisible(false);
            this.endTurnButton.setVisible(false);
            this.readyButton.setVisible(true);

            // Actualizar información del jugador
            const player = this.getPlayer();
            if (player) {
                this.playerHPText.setText(`HP: ${player.currentHP}/${player.maxHP}`);
                this.playerAPText.setText(`PA: ${player.maxActionPoints}/${player.maxActionPoints}`);
                this.playerMPText.setText(`PM: ${player.maxMovementPoints}/${player.maxMovementPoints}`);
            }
            return;
        }

        // Ocultar botón de listo durante el combate
        this.readyButton.setVisible(false);

        const currentEntity = this.getCurrentEntity();

        // Actualizar información de turno
        this.turnText.setText(`Turno: ${this.currentTurn}`);

        if (currentEntity) {
            const entityName = currentEntity.constructor.name === 'Player' ? 'Jugador' : 'Enemigo';
            this.entityText.setText(entityName);
            this.entityText.setColor(this.isPlayerTurn ? '#00ff00' : '#ff0000');
        }

        // Actualizar temporizador
        if (this.isPlayerTurn && this.gameState === 'playing') {
            const seconds = Math.ceil(this.timeRemaining / 1000);
            this.timerText.setText(`Tiempo: ${seconds}s`);

            // Cambiar color según el tiempo restante
            if (seconds <= 5) {
                this.timerText.setColor('#ff0000'); // Rojo cuando quedan 5 segundos
            } else if (seconds <= 10) {
                this.timerText.setColor('#ff8800'); // Naranja cuando quedan 10 segundos
            } else {
                this.timerText.setColor('#ffff00'); // Amarillo normal
            }

            this.timerText.setVisible(true);
        } else {
            this.timerText.setVisible(false);
        }

        // Mostrar/ocultar botón de terminar turno
        this.endTurnButton.setVisible(this.isPlayerTurn && this.gameState === 'playing');

        // Actualizar información del jugador
        const player = this.getPlayer();
        if (player) {
            this.playerHPText.setText(`HP: ${player.currentHP}/${player.maxHP}`);
            this.playerAPText.setText(`PA: ${player.currentActionPoints}/${player.maxActionPoints}`);
            this.playerMPText.setText(`PM: ${player.currentMovementPoints}/${player.maxMovementPoints}`);
        }
    }

    // Limpiar el sistema de turnos
    destroy() {
        if (this.currentTurnTimer) {
            this.currentTurnTimer.destroy();
        }
        if (this.turnPanel) this.turnPanel.destroy();
        if (this.turnText) this.turnText.destroy();
        if (this.entityText) this.entityText.destroy();
        if (this.timerText) this.timerText.destroy();
        if (this.endTurnButton) this.endTurnButton.destroy();
        if (this.readyButton) this.readyButton.destroy();
        if (this.playerPanel) this.playerPanel.destroy();
        if (this.playerHPText) this.playerHPText.destroy();
        if (this.playerAPText) this.playerAPText.destroy();
        if (this.playerMPText) this.playerMPText.destroy();
    }
}
