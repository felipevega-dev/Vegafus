/**
 * Sistema para mostrar notificaciones en el juego
 */
export class NotificationSystem {
    constructor(scene) {
        this.scene = scene;
    }

    showSyncMessage() {
        // Mostrar mensaje de sincronización
        const syncMessage = this.scene.add.text(640, 100, '🔄 Datos sincronizados desde el servidor', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#00ff00',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: { x: 15, y: 8 }
        });
        syncMessage.setOrigin(0.5);
        syncMessage.setDepth(2000);

        // Hacer que desaparezca después de 3 segundos
        this.scene.time.delayedCall(3000, () => {
            syncMessage.destroy();
        });
    }

    checkLevelUpNotification(character) {
        // Verificar si hay puntos de capital disponibles (indica level up)
        if (character.capitalPoints > 0) {
            const levelUpMessage = this.scene.add.text(640, 130, 
                `🎉 ¡SUBISTE DE NIVEL! +${character.capitalPoints} puntos de capital disponibles`, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: '#ffff00',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                padding: { x: 15, y: 8 },
                fontStyle: 'bold'
            });
            levelUpMessage.setOrigin(0.5);
            levelUpMessage.setDepth(2001);

            // Efecto de parpadeo
            this.scene.tweens.add({
                targets: levelUpMessage,
                alpha: { from: 1, to: 0.3 },
                duration: 500,
                yoyo: true,
                repeat: 3
            });

            // Eliminar mensaje después de 5 segundos
            this.scene.time.delayedCall(5000, () => {
                levelUpMessage.destroy();
            });

            console.log(`🎉 ¡Level up detectado! Puntos de capital disponibles: ${character.capitalPoints}`);
        }
    }

    showMessage(text, x = 640, y = 200, duration = 3000, color = '#ffffff') {
        const message = this.scene.add.text(x, y, text, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: color,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: { x: 15, y: 8 }
        });
        message.setOrigin(0.5);
        message.setDepth(2000);

        // Hacer que desaparezca después del tiempo especificado
        this.scene.time.delayedCall(duration, () => {
            message.destroy();
        });

        return message;
    }

    showError(text, x = 640, y = 200, duration = 4000) {
        return this.showMessage(text, x, y, duration, '#ff4444');
    }

    showSuccess(text, x = 640, y = 200, duration = 3000) {
        return this.showMessage(text, x, y, duration, '#00ff00');
    }

    showWarning(text, x = 640, y = 200, duration = 3500) {
        return this.showMessage(text, x, y, duration, '#ffff00');
    }
}
