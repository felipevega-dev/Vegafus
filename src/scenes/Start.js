export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Cargar assets básicos para el menú
        this.load.image('start-bg', 'assets/images/ui/start-background.png');
        this.load.image('start-button', 'assets/images/ui/start-button.png');
    }

    create() {
        // Texto de título
        this.add.text(640, 200, 'MI JUEGO TIPO DOFUS', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Botón para iniciar
        const startButton = this.add.text(640, 400, 'COMENZAR', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#6b8e23',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        // Cambiar a la escena del mapa al hacer clic
        startButton.on('pointerdown', () => {
            this.scene.start('IsometricMap');
        });
    }
}













