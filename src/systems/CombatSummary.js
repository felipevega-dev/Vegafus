export class CombatSummary {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.summaryElements = [];
    }

    // Mostrar resumen de combate
    showSummary(defeatedEnemies, experienceGained, player) {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.defeatedEnemies = defeatedEnemies;
        this.experienceGained = experienceGained;
        this.player = player;
        
        this.createSummaryWindow();
    }

    createSummaryWindow() {
        // Fondo semi-transparente
        const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setDepth(2000);
        this.summaryElements.push(overlay);

        // Panel principal
        const panel = this.scene.add.rectangle(640, 360, 600, 400, 0x222222, 0.95);
        panel.setDepth(2001);
        panel.setStrokeStyle(3, 0xffffff);
        this.summaryElements.push(panel);

        // Título
        const title = this.scene.add.text(640, 200, '¡VICTORIA!', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setDepth(2002);
        this.summaryElements.push(title);

        // Subtítulo
        const subtitle = this.scene.add.text(640, 240, 'Resumen del Combate', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        subtitle.setOrigin(0.5);
        subtitle.setDepth(2002);
        this.summaryElements.push(subtitle);

        // Lista de enemigos derrotados
        let yPos = 280;
        
        const enemiesTitle = this.scene.add.text(640, yPos, 'Enemigos Derrotados:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffff00',
            fontStyle: 'bold'
        });
        enemiesTitle.setOrigin(0.5);
        enemiesTitle.setDepth(2002);
        this.summaryElements.push(enemiesTitle);
        
        yPos += 30;

        this.defeatedEnemies.forEach((enemy, index) => {
            const enemyText = this.scene.add.text(640, yPos, `• ${this.getEnemyDisplayName(enemy.type)}`, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff'
            });
            enemyText.setOrigin(0.5);
            enemyText.setDepth(2002);
            this.summaryElements.push(enemyText);
            yPos += 25;
        });

        yPos += 20;

        // Experiencia ganada
        const expText = this.scene.add.text(640, yPos, `Experiencia Ganada: +${this.experienceGained} XP`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#00ffff',
            fontStyle: 'bold'
        });
        expText.setOrigin(0.5);
        expText.setDepth(2002);
        this.summaryElements.push(expText);

        yPos += 30;

        // Nivel actual
        const levelText = this.scene.add.text(640, yPos, `Nivel Actual: ${this.player.level}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        levelText.setOrigin(0.5);
        levelText.setDepth(2002);
        this.summaryElements.push(levelText);

        yPos += 25;

        // Experiencia total
        const totalExpText = this.scene.add.text(640, yPos, `Experiencia Total: ${this.player.experience} XP`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc'
        });
        totalExpText.setOrigin(0.5);
        totalExpText.setDepth(2002);
        this.summaryElements.push(totalExpText);

        yPos += 40;

        // Botón de continuar
        const continueButton = this.scene.add.rectangle(640, yPos, 200, 40, 0x006600, 1);
        continueButton.setDepth(2002);
        continueButton.setStrokeStyle(2, 0x00ff00);
        continueButton.setInteractive();
        this.summaryElements.push(continueButton);

        const continueText = this.scene.add.text(640, yPos, 'Continuar', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        continueText.setOrigin(0.5);
        continueText.setDepth(2003);
        this.summaryElements.push(continueText);

        // Eventos del botón
        continueButton.on('pointerover', () => {
            continueButton.setFillStyle(0x008800);
        });

        continueButton.on('pointerout', () => {
            continueButton.setFillStyle(0x006600);
        });

        continueButton.on('pointerdown', () => {
            this.closeSummary();
        });

        // También permitir cerrar con ESPACIO
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKeyHandler = () => {
            this.closeSummary();
        };
        this.spaceKey.on('down', this.spaceKeyHandler);

        // Efecto de aparición
        this.summaryElements.forEach(element => {
            element.setAlpha(0);
            this.scene.tweens.add({
                targets: element,
                alpha: element.alpha || 1,
                duration: 500,
                ease: 'Power2'
            });
        });
    }

    getEnemyDisplayName(type) {
        switch (type) {
            case 'basic':
                return 'Goblin Básico';
            case 'strong':
                return 'Orco Fuerte';
            case 'fast':
                return 'Esqueleto Rápido';
            default:
                return 'Enemigo Desconocido';
        }
    }

    closeSummary() {
        if (!this.isVisible) return;

        // Efecto de desaparición
        this.scene.tweens.add({
            targets: this.summaryElements,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Destruir elementos
                this.summaryElements.forEach(element => {
                    if (element && element.destroy) {
                        element.destroy();
                    }
                });
                this.summaryElements = [];
                this.isVisible = false;

                // Limpiar evento de teclado
                if (this.spaceKey && this.spaceKeyHandler) {
                    this.spaceKey.off('down', this.spaceKeyHandler);
                }

                // Volver al mapa de exploración
                this.returnToExploration();
            }
        });
    }

    returnToExploration() {
        // Por ahora, simplemente reiniciar la escena
        // En el futuro, aquí cambiaríamos a la escena de exploración
        console.log('Volviendo al mapa de exploración...');
        
        // Crear un mensaje temporal
        const returnMessage = this.scene.add.text(640, 360, 'Volviendo al mapa de exploración...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        });
        returnMessage.setOrigin(0.5);
        returnMessage.setDepth(3000);

        // Después de 2 segundos, reiniciar la escena (temporal)
        this.scene.time.delayedCall(2000, () => {
            this.scene.scene.restart();
        });
    }

    // Calcular experiencia ganada basada en enemigos derrotados
    static calculateExperience(defeatedEnemies) {
        let totalExp = 0;
        
        defeatedEnemies.forEach(enemy => {
            switch (enemy.type) {
                case 'basic':
                    totalExp += 50;
                    break;
                case 'strong':
                    totalExp += 100;
                    break;
                case 'fast':
                    totalExp += 75;
                    break;
                default:
                    totalExp += 25;
            }
        });

        return totalExp;
    }

    // Verificar si el jugador sube de nivel
    static checkLevelUp(player, experienceGained) {
        const oldLevel = player.level;
        player.experience += experienceGained;
        
        // Fórmula simple de nivel: cada 200 XP = 1 nivel
        const newLevel = Math.floor(player.experience / 200) + 1;
        
        if (newLevel > oldLevel) {
            player.level = newLevel;
            
            // Mejorar estadísticas al subir de nivel
            player.maxHP += 20;
            player.currentHP = player.maxHP; // Curación completa al subir nivel
            player.maxMP += 10;
            player.currentMP = player.maxMP;
            player.attack += 5;
            player.defense += 3;
            
            console.log(`¡Nivel subido! Ahora eres nivel ${newLevel}`);
            return true;
        }
        
        return false;
    }
}
