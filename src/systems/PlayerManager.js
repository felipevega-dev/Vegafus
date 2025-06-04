/**
 * Sistema para gestionar la creación y carga del jugador
 */
import { Player } from '@classes/Player.js';
import { ItemLibrary } from '@data/ItemLibrary.js';

export class PlayerManager {
    constructor(scene, userData, currentCharacterId, comingFromCombat = false) {
        this.scene = scene;
        this.userData = userData;
        this.currentCharacterId = currentCharacterId;
        this.player = null;
        this.comingFromCombat = comingFromCombat || this.scene.registry.get('comingFromCombat') || false;
    }

    async createPlayer() {
        try {
            // Verificar si viene del combate (para recargar datos del backend)
            this.comingFromCombat = this.scene.registry.get('playerData') !== null;

            // Si hay usuario autenticado, SIEMPRE cargar del backend
            if (this.userData) {
                console.log('🔍 Usuario autenticado detectado, cargando desde backend...');

                // Verificar que tenemos un characterId válido
                if (!this.currentCharacterId) {
                    console.log('❌ No hay characterId válido');
                    throw new Error('No se ha seleccionado un personaje válido. Debes seleccionar un personaje desde la galería.');
                }

                await this.loadPlayerFromBackend();

                // Limpiar datos locales obsoletos si viene del combate
                if (this.comingFromCombat) {
                    this.scene.registry.remove('playerData');
                    console.log('🔄 Datos del combate limpiados, usando datos frescos del backend');
                }
            } else {
                console.log('❌ No hay usuario autenticado');
                throw new Error('Usuario no autenticado. Debes iniciar sesión primero.');
            }

            // Verificar que el jugador se creó correctamente
            if (!this.player) {
                throw new Error('No se pudo crear el jugador');
            }

            // En exploración no hay límite de movimiento
            this.player.maxMovementPoints = 999;
            this.player.currentMovementPoints = 999;

            console.log('✅ Jugador creado exitosamente:', this.player.gridX, this.player.gridY);
            return this.player;
        } catch (error) {
            console.error('❌ Error crítico creando jugador:', error);
            // Crear jugador de emergencia
            this.player = new Player(this.scene, 5, 10, 'mage');
            this.player.maxMovementPoints = 999;
            this.player.currentMovementPoints = 999;
            return this.player;
        }
    }

    async loadPlayerFromBackend() {
        const { apiClient } = await import('@utils/ApiClient.js');

        let character = null;

        if (this.currentCharacterId) {
            // Cargar personaje específico por ID
            console.log('🔍 Cargando personaje específico:', this.currentCharacterId);
            try {
                const response = await fetch(`http://localhost:3000/api/characters/${this.currentCharacterId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    character = data.character;
                    console.log('📥 Personaje específico cargado:', character.name);
                } else {
                    throw new Error('Personaje no encontrado');
                }
            } catch (error) {
                console.error('❌ Error cargando personaje específico:', error);
                // Fallback: cargar cualquier personaje disponible
                const response = await apiClient.getCharacters();
                const characters = response.characters;
                if (characters && characters.length > 0) {
                    character = characters[0];
                    this.currentCharacterId = character.id;
                }
            }
        } else {
            // No hay ID específico - esto no debería pasar si el flujo es correcto
            console.log('❌ No hay characterId específico - esto indica un problema en el flujo');
            throw new Error('No se ha proporcionado un ID de personaje válido');
        }

        if (character) {
            console.log('📥 Personaje cargado del backend:', character);

            // Crear jugador con datos del backend
            this.player = new Player(
                this.scene,
                character.position?.x || 5,
                character.position?.y || 10,
                character.class || 'mage'
            );

            // Aplicar estadísticas del personaje
            this.player.level = character.level || 1;
            this.player.experience = character.experience || 0;
            this.player.currentHP = character.stats?.hp?.current || 100;
            this.player.maxHP = character.stats?.hp?.max || 100;
            this.player.attack = character.stats?.attack || 20;
            this.player.defense = character.stats?.defense || 10;

            // Aplicar características
            this.player.characteristics = character.characteristics || {
                tierra: 0, fuego: 0, agua: 0, aire: 0, vida: 0, sabiduria: 0
            };
            console.log('🔧 Características aplicadas:', this.player.characteristics);

            // Cargar hechizos desde el backend
            if (character.spells && character.spells.length > 0) {
                const { SpellLibrary } = await import('../classes/Spell.js');
                this.player.spells = SpellLibrary.createSpellsFromBackend(character.spells);
                console.log('🔮 Hechizos cargados desde backend:', this.player.spells.length);
            }
            this.player.capitalPoints = character.capitalPoints || 0;
            this.player.spellPoints = character.spellPoints || 0;
            console.log('💰 Puntos aplicados - Capital:', this.player.capitalPoints, 'Hechizo:', this.player.spellPoints);

            // Aplicar resistencias
            this.player.resistances = character.resistances || {
                tierra: 0, fuego: 0, agua: 0, aire: 0
            };

            // Aplicar bonos de daño
            this.player.damageBonus = character.damageBonus || {
                flat: 0, spellPercent: 0, meleePercent: 0,
                tierraPercent: 0, fuegoPercent: 0, aguaPercent: 0, airePercent: 0
            };

            // Cargar dinero (kamas)
            this.player.kamas = character.kamas || 0;
            console.log(`💰 Kamas cargadas: ${this.player.kamas}`);

            // Cargar inventario enriquecido desde el endpoint específico
            try {
                const inventoryResponse = await apiClient.getInventory(character.id);
                if (inventoryResponse && inventoryResponse.success) {
                    this.player.inventory = inventoryResponse.data.inventory || [];
                    this.player.kamas = inventoryResponse.data.kamas || this.player.kamas; // Actualizar kamas también
                    console.log(`🎒 Inventario enriquecido cargado: ${this.player.inventory.length} items`);
                } else {
                    // Fallback al inventario básico del personaje
                    if (character.inventory && character.inventory.length > 0) {
                        this.player.inventory = character.inventory;
                        console.log(`🎒 Inventario básico cargado: ${this.player.inventory.length} items`);
                    } else {
                        this.loadStarterItems(character.class);
                    }
                }
            } catch (inventoryError) {
                console.error('❌ Error cargando inventario enriquecido:', inventoryError);
                // Fallback al inventario básico del personaje
                if (character.inventory && character.inventory.length > 0) {
                    this.player.inventory = character.inventory;
                    console.log(`🎒 Inventario básico cargado (fallback): ${this.player.inventory.length} items`);
                } else {
                    this.loadStarterItems(character.class);
                }
            }

            // Guardar ID del personaje para futuras actualizaciones
            this.currentCharacterId = character.id;

            console.log(`✅ Personaje sincronizado: ${character.name} - Nivel ${this.player.level}, XP: ${this.player.experience}/${this.player.level * 200}`);
            console.log(`💰 Puntos de capital: ${this.player.capitalPoints}`);

            // Mostrar mensaje temporal si viene del combate
            if (this.comingFromCombat && this.scene.notificationSystem) {
                this.scene.notificationSystem.showSyncMessage();
                this.scene.notificationSystem.checkLevelUpNotification(character);
            }
        } else {
            // No se encontró el personaje
            console.log('❌ No se encontró el personaje con ID:', this.currentCharacterId);
            throw new Error('El personaje seleccionado no existe o no tienes acceso a él');
        }
    }



    getPlayer() {
        return this.player;
    }

    getCurrentCharacterId() {
        return this.currentCharacterId;
    }

    isComingFromCombat() {
        return this.comingFromCombat;
    }

    loadStarterItems(playerClass) {
        try {
            const starterItems = ItemLibrary.getStarterItems(playerClass);

            starterItems.forEach(item => {
                this.player.addItem(item);
            });

            console.log(`✅ Objetos iniciales cargados para ${playerClass}:`, starterItems.map(item => item.name));
        } catch (error) {
            console.error('Error cargando objetos iniciales:', error);
        }
    }
}
