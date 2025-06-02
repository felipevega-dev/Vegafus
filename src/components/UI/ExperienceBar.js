/**
 * Componente para la barra de experiencia
 */
export class ExperienceBar {
    constructor(scene, x = 120, y = 45) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.barWidth = 180;
        this.barHeight = 12;
        this.elements = [];
        this.player = null;
        
        this.create();
    }

    create() {
        // Fondo de la barra
        this.expBarBg = this.scene.add.rectangle(this.x, this.y, this.barWidth, this.barHeight, 0x333333);
        this.expBarBg.setDepth(1001);
        this.expBarBg.setStrokeStyle(1, 0x666666);
        this.elements.push(this.expBarBg);

        // Barra de experiencia
        this.expBar = this.scene.add.rectangle(this.x, this.y, 0, this.barHeight, 0x00ff00);
        this.expBar.setDepth(1002);
        this.expBar.setOrigin(0.5, 0.5);
        this.elements.push(this.expBar);

        // Texto de experiencia
        this.expText = this.scene.add.text(this.x, this.y + 20, '', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        this.expText.setOrigin(0.5);
        this.expText.setDepth(1001);
        this.elements.push(this.expText);
    }

    updatePlayer(player) {
        this.player = player;
        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.player) {
            console.log('⚠️ No hay jugador para actualizar XP');
            return;
        }

        const currentLevel = this.player.level;
        const currentExp = this.player.experience;
        const expForNextLevel = currentLevel * 200; // XP necesaria para el siguiente nivel

        // Calcular porcentaje de progreso hacia el siguiente nivel
        const percentage = Math.max(0, Math.min(1, currentExp / expForNextLevel));

        // Actualizar barra visual
        if (this.expBar) {
            this.expBar.width = this.barWidth * percentage;
        }

        // Actualizar texto
        if (this.expText) {
            this.expText.setText(`XP: ${currentExp}/${expForNextLevel} (${Math.round(percentage * 100)}%)`);
        }

        console.log(`✅ Barra XP actualizada: ${currentExp}/${expForNextLevel} (${Math.round(percentage * 100)}%)`);
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
