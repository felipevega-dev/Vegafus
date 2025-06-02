/**
 * Componente para mostrar la información del jugador en la UI
 */
export class PlayerInfoPanel {
    constructor(scene, x = 120, y = 40) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.elements = [];
        this.player = null;
        
        this.create();
    }

    create() {
        // Panel de información del jugador
        const playerPanel = this.scene.add.rectangle(this.x, this.y, 220, 70, 0x000000, 0.8);
        playerPanel.setDepth(1000);
        playerPanel.setStrokeStyle(2, 0x444444);
        this.elements.push(playerPanel);

        // Información básica del jugador
        this.playerInfo = this.scene.add.text(this.x, this.y - 20, '', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        this.playerInfo.setOrigin(0.5);
        this.playerInfo.setDepth(1001);
        this.elements.push(this.playerInfo);

        // Información de puntos de capital
        this.capitalPointsInfo = this.scene.add.text(this.x, this.y - 5, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center'
        });
        this.capitalPointsInfo.setOrigin(0.5);
        this.capitalPointsInfo.setDepth(1001);
        this.elements.push(this.capitalPointsInfo);
    }

    updatePlayer(player) {
        this.player = player;
        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.player) {
            console.log('⚠️ No hay jugador para actualizar UI');
            return;
        }

        // Actualizar información del jugador
        if (this.playerInfo && this.playerInfo.setText) {
            this.playerInfo.setText(`HP: ${this.player.currentHP}/${this.player.maxHP} | Nivel: ${this.player.level}`);
        }

        // Actualizar información de puntos de capital
        if (this.capitalPointsInfo && this.capitalPointsInfo.setText) {
            this.capitalPointsInfo.setText(`💰 Puntos de capital: ${this.player.capitalPoints}`);
            this.capitalPointsInfo.setColor(this.player.capitalPoints > 0 ? '#ffff00' : '#cccccc');
        }
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
