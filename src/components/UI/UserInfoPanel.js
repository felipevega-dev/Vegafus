/**
 * Componente para mostrar información del usuario y botón de logout
 */
export class UserInfoPanel {
    constructor(scene, userData, onLogout) {
        this.scene = scene;
        this.userData = userData;
        this.onLogout = onLogout;
        this.elements = [];
        
        if (this.userData) {
            this.create();
        }
    }

    create() {
        // Mostrar nombre de usuario
        const userText = this.scene.add.text(1100, 20, `Usuario: ${this.userData.username}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        userText.setDepth(1001);
        this.elements.push(userText);

        // Botón de logout
        const logoutButton = this.scene.add.text(1200, 40, 'LOGOUT', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ff4444',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        logoutButton.setOrigin(0.5);
        logoutButton.setDepth(1001);
        logoutButton.setInteractive();
        logoutButton.on('pointerdown', () => {
            if (this.onLogout) {
                this.onLogout();
            }
        });
        this.elements.push(logoutButton);
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
