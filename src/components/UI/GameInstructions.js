/**
 * Componente para mostrar las instrucciones del juego
 */
export class GameInstructions {
    constructor(scene, x = 400, y = 30) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.elements = [];
        
        this.create();
    }

    create() {
        // Instrucciones principales
        const instructions = this.scene.add.text(this.x, this.y, 
            'Click en monstruos para interactuar | C = Características | ESC para cancelar', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        instructions.setDepth(1001);
        this.elements.push(instructions);
    }

    destroy() {
        this.elements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });
        this.elements = [];
    }
}
