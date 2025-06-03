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

        // Información de dinero y prospección
        this.kamasInfo = this.scene.add.text(this.x, this.y - 5, '', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#ffff00',
            align: 'center'
        });
        this.kamasInfo.setOrigin(0.5);
        this.kamasInfo.setDepth(1001);
        this.elements.push(this.kamasInfo);

        // Información de prospección
        this.prospectionInfo = this.scene.add.text(this.x, this.y + 10, '', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            align: 'center'
        });
        this.prospectionInfo.setOrigin(0.5);
        this.prospectionInfo.setDepth(1001);
        this.elements.push(this.prospectionInfo);
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

        // Actualizar información de dinero
        if (this.kamasInfo && this.kamasInfo.setText) {
            this.kamasInfo.setText(`💰 ${this.player.kamas || 0} Kamas`);
        }

        // Actualizar información de prospección
        if (this.prospectionInfo && this.prospectionInfo.setText) {
            const prospection = this.player.getProspection ? this.player.getProspection() : 100;
            this.prospectionInfo.setText(`🔍 Prospección: ${prospection}%`);
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
