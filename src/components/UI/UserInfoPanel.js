/**
 * Componente para mostrar información del usuario
 * El logout se maneja ahora a través del botón de configuración en RightSidePanel
 */
export class UserInfoPanel {
    constructor(scene, userData) {
        this.scene = scene;
        this.userData = userData;
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

        // El botón de logout ahora se maneja a través del engranaje de configuración
        // en el RightSidePanel, por lo que no necesitamos crear uno aquí
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
