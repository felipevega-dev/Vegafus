/**
 * Sistema para gestionar el guardado automático y manual del progreso
 */
export class SaveSystem {
    constructor(scene, userData, currentCharacterId, player) {
        this.scene = scene;
        this.userData = userData;
        this.currentCharacterId = currentCharacterId;
        this.player = player;
        this.autoSaveTimer = null;
    }

    async saveProgressToBackend() {
        // Solo guardar si hay usuario autenticado y personaje cargado
        if (!this.userData || !this.currentCharacterId || !this.player) {
            return;
        }

        try {
            const { apiClient } = await import('@utils/ApiClient.js');

            const gameData = {
                level: this.player.level,
                experience: this.player.experience,
                stats: {
                    hp: {
                        current: this.player.currentHP,
                        max: this.player.maxHP
                    },
                    attack: this.player.attack,
                    defense: this.player.defense
                },
                position: {
                    x: this.player.gridX,
                    y: this.player.gridY
                },
                // Incluir todos los datos del jugador en auto-guardado
                kamas: this.player.kamas,
                inventory: this.player.inventory,
                characteristics: this.player.characteristics,
                capitalPoints: this.player.capitalPoints,
                spellPoints: this.player.spellPoints,
                resistances: this.player.resistances,
                damageBonus: this.player.damageBonus
            };

            await apiClient.saveProgress(this.currentCharacterId, gameData);
            console.log('✅ Progreso guardado en el backend');
        } catch (error) {
            console.error('❌ Error guardando progreso:', error);
        }
    }

    startAutoSave() {
        // Solo iniciar auto-guardado si hay usuario autenticado
        if (!this.userData) {
            return;
        }

        // Guardar cada 30 segundos
        this.autoSaveTimer = this.scene.time.addEvent({
            delay: 30000, // 30 segundos
            callback: () => {
                this.saveProgressToBackend();
            },
            loop: true
        });

        console.log('🔄 Auto-guardado iniciado (cada 30 segundos)');
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            this.autoSaveTimer.destroy();
            this.autoSaveTimer = null;
            console.log('⏹️ Auto-guardado detenido');
        }
    }

    async saveBeforeLogout() {
        try {
            // Guardar progreso antes de hacer logout
            await this.saveProgressToBackend();

            // Importar apiClient dinámicamente
            const { apiClient } = await import('@utils/ApiClient.js');

            await apiClient.logout();
            console.log('Logout exitoso');

            return true;
        } catch (error) {
            console.error('Error en logout:', error);
            return false;
        }
    }

    destroy() {
        this.stopAutoSave();
    }
}
