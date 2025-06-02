export class TurnManager {
    constructor(scene) {
        this.scene = scene;
        this.currentTurn = 0;
        this.turnOrder = [];
        this.currentEntityIndex = 0;
        this.isPlayerTurn = true;
        this.gameState = 'playing'; // 'playing', 'victory', 'defeat'
        
        // UI del sistema de turnos
        this.createTurnUI();
    }

    // Añadir entidades al orden de turnos
    addEntity(entity) {
        this.turnOrder.push(entity);
    }

    // Inicializar el sistema de turnos
    startCombat() {
        this.currentTurn = 1;
        this.currentEntityIndex = 0;
        this.gameState = 'playing';
        
        if (this.turnOrder.length > 0) {
            this.startCurrentEntityTurn();
        }
        
        this.updateTurnUI();
    }

    // Iniciar el turno de la entidad actual
    startCurrentEntityTurn() {
        const currentEntity = this.getCurrentEntity();
        
        if (!currentEntity || !currentEntity.isAlive) {
            this.nextTurn();
            return;
        }

        // Terminar turno de la entidad anterior
        this.turnOrder.forEach(entity => {
            if (entity.endTurn) entity.endTurn();
        });

        // Iniciar turno de la entidad actual
        if (currentEntity.startTurn) {
            currentEntity.startTurn();
        }

        // Determinar si es turno del jugador o enemigo
        this.isPlayerTurn = currentEntity.constructor.name === 'Player';
        
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
            this.showGameEndMessage('¡Victoria!', 0x00ff00);
            return true;
        }

        return false;
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
        this.turnPanel = this.scene.add.rectangle(100, 50, 180, 80, 0x000000, 0.7);
        this.turnPanel.setDepth(1500);

        // Texto del turno actual
        this.turnText = this.scene.add.text(100, 30, 'Turno: 1', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.turnText.setOrigin(0.5);
        this.turnText.setDepth(1501);

        // Texto de la entidad actual
        this.entityText = this.scene.add.text(100, 50, 'Jugador', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#00ff00'
        });
        this.entityText.setOrigin(0.5);
        this.entityText.setDepth(1501);

        // Botón de terminar turno (solo visible en turno del jugador)
        this.endTurnButton = this.scene.add.text(100, 70, 'Terminar Turno', {
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
        const currentEntity = this.getCurrentEntity();
        
        // Actualizar información de turno
        this.turnText.setText(`Turno: ${this.currentTurn}`);
        
        if (currentEntity) {
            const entityName = currentEntity.constructor.name === 'Player' ? 'Jugador' : 'Enemigo';
            this.entityText.setText(entityName);
            this.entityText.setColor(this.isPlayerTurn ? '#00ff00' : '#ff0000');
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
        if (this.turnPanel) this.turnPanel.destroy();
        if (this.turnText) this.turnText.destroy();
        if (this.entityText) this.entityText.destroy();
        if (this.endTurnButton) this.endTurnButton.destroy();
        if (this.playerPanel) this.playerPanel.destroy();
        if (this.playerHPText) this.playerHPText.destroy();
        if (this.playerAPText) this.playerAPText.destroy();
        if (this.playerMPText) this.playerMPText.destroy();
    }
}
