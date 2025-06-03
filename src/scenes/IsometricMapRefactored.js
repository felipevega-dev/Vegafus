/**
 * Versión refactorizada de IsometricMap usando la nueva arquitectura modular
 */
import { Combat } from '@scenes/Combat.js';

export class IsometricMapRefactored extends Combat {
    constructor() {
        super('IsometricMapRefactored');
    }

    preload() {
        // Usar el preload del padre
        super.preload();
        
        // Crear sprites placeholder si no existen assets reales
        this.createPlaceholderSprites();
    }

    createPlaceholderSprites() {
        // Crear sprite para el jugador
        const playerGraphics = this.add.graphics();
        playerGraphics.fillStyle(0x00ff00); // Verde para el jugador
        playerGraphics.fillCircle(16, 16, 12);
        playerGraphics.generateTexture('character', 32, 32);
        playerGraphics.destroy();

        // Crear sprite para enemigos
        const enemyGraphics = this.add.graphics();
        enemyGraphics.fillStyle(0xff0000); // Rojo para enemigos
        enemyGraphics.fillCircle(16, 16, 12);
        enemyGraphics.generateTexture('enemy', 32, 32);
        enemyGraphics.destroy();

        console.log('✅ Sprites placeholder creados para combate');
    }

    create(data) {
        console.log('Iniciando combate isométrico refactorizado');
        
        // Configurar datos específicos para combate isométrico
        const combatData = {
            ...data,
            mapType: 'symmetric', // Mapa simétrico clásico
            enemyCount: 1,
            combatType: 'normal'
        };

        // Llamar al create del padre con los datos configurados
        super.create(combatData);
    }

    // Sobrescribir el método de creación de mapa para usar el estilo isométrico clásico
    createCombatMap() {
        // Usar el mapa simétrico por defecto
        this.mapGenerator.createSymmetricMap();
    }

    // Configuración específica para combate isométrico
    setupCamera() {
        super.setupCamera();
        
        // Configuración específica de cámara para vista isométrica
        this.cameras.main.setZoom(1);
        this.cameras.main.centerOn(640, 360);
    }

    // Sobrescribir el manejo de victoria para volver al mapa de exploración original
    handleVictory() {
        console.log('¡Victoria en combate isométrico!');

        // Mostrar resumen de combate
        this.showCombatSummary(true);

        // Volver al mapa de exploración después de un delay
        this.time.delayedCall(3000, () => {
            this.scene.start('ExplorationMapRefactored', {
                userData: this.userData,
                characterId: this.currentCharacterId,
                comingFromCombat: true // Bandera para indicar que viene del combate
            });
        });
    }

    handleDefeat() {
        console.log('Derrota en combate isométrico...');

        // Mostrar resumen de combate
        this.showCombatSummary(false);

        // Volver al mapa de exploración después de un delay
        this.time.delayedCall(3000, () => {
            this.scene.start('ExplorationMapRefactored', {
                userData: this.userData,
                characterId: this.currentCharacterId,
                comingFromCombat: true // Bandera para indicar que viene del combate
            });
        });
    }

    // Mostrar resumen de combate
    showCombatSummary(victory) {
        // Crear overlay semi-transparente
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);
        overlay.setDepth(2000);

        // Panel de resumen
        const summaryPanel = this.add.rectangle(640, 360, 400, 300, 0x1a1a2e, 0.95);
        summaryPanel.setDepth(2001);
        summaryPanel.setStrokeStyle(3, victory ? 0x00ff00 : 0xff0000);

        // Título
        const title = this.add.text(640, 250, victory ? '¡VICTORIA!' : 'DERROTA', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: victory ? '#00ff00' : '#ff0000',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setDepth(2002);

        // Información del combate
        const info = this.add.text(640, 320, 
            `Nivel: ${this.player.level}\n` +
            `HP restante: ${this.player.currentHP}/${this.player.maxHP}\n` +
            `Experiencia ganada: ${victory ? '50' : '10'} XP`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        info.setOrigin(0.5);
        info.setDepth(2002);

        // Botón para continuar
        const continueButton = this.add.text(640, 420, 'Continuar', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        });
        continueButton.setOrigin(0.5);
        continueButton.setDepth(2002);
        continueButton.setInteractive();

        continueButton.on('pointerdown', () => {
            this.scene.start('ExplorationMapRefactored', {
                userData: this.userData,
                characterId: this.currentCharacterId,
                comingFromCombat: true // Bandera para indicar que viene del combate
            });
        });

        continueButton.on('pointerover', () => {
            continueButton.setStyle({ backgroundColor: '#555555' });
        });

        continueButton.on('pointerout', () => {
            continueButton.setStyle({ backgroundColor: '#333333' });
        });

        // Efecto de aparición
        this.tweens.add({
            targets: [summaryPanel, title, info, continueButton],
            alpha: { from: 0, to: 1 },
            y: { from: '+=50', to: '+=0' },
            duration: 500,
            ease: 'Back.easeOut'
        });
    }

    // Método para configurar diferentes tipos de combate isométrico
    setupIsometricCombat(type = 'normal') {
        switch (type) {
            case 'boss':
                this.combatType = 'boss';
                this.enemyCount = 1;
                break;
            case 'multiple':
                this.combatType = 'formation';
                this.enemyCount = 3;
                break;
            case 'arena':
                this.mapType = 'arena';
                this.combatType = 'wave';
                break;
            default:
                this.combatType = 'normal';
                this.enemyCount = 1;
        }
    }
}
