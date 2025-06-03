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

            // Si hay usuario autenticado, SIEMPRE cargar del backend (especialmente si viene del combate)
            if (this.userData) {
                try {
                    await this.loadPlayerFromBackend();

                    // Si viene del combate, limpiar datos locales ya que ahora tenemos los actualizados
                    if (this.comingFromCombat) {
                        this.scene.registry.remove('playerData');
                        console.log('🔄 Datos del combate limpiados, usando datos frescos del backend');
                    }
                } catch (error) {
                    console.error('Error cargando personaje del backend:', error);
                    // Si falla, crear personaje por defecto
                    this.createDefaultPlayer();
                }
            } else {
                // Sin usuario autenticado, usar datos locales
                this.createDefaultPlayer();
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
                        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`,
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
            // No hay ID específico, cargar el primer personaje disponible
            console.log('🔍 Buscando personajes en el backend...');
            const response = await apiClient.getCharacters();
            const characters = response.characters;

            console.log('📋 Respuesta del backend:', response);
            console.log('👥 Personajes encontrados:', characters?.length || 0);

            if (characters && characters.length > 0) {
                character = characters[0];
                this.currentCharacterId = character.id;
            }
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
            // No tiene personajes, crear uno nuevo
            await this.createNewCharacterInBackend();
        }
    }

    async createNewCharacterInBackend() {
        const { apiClient } = await import('@utils/ApiClient.js');

        try {
            // Crear personaje por defecto
            console.log('🆕 Creando nuevo personaje en el backend...');
            const response = await apiClient.createCharacter('Aventurero', 'mage');
            const character = response.character;

            console.log('✅ Nuevo personaje creado en backend:', character);

            // Crear jugador con datos del nuevo personaje
            this.player = new Player(this.scene, 5, 10, character.class);
            this.player.level = character.level;
            this.player.experience = character.experience;
            this.player.currentHP = character.stats.hp.current;
            this.player.maxHP = character.stats.hp.max;
            this.player.attack = character.stats.attack;
            this.player.defense = character.stats.defense;

            // Cargar objetos iniciales para personaje nuevo
            this.loadStarterItems(character.class);

            this.currentCharacterId = character.id;

            console.log(`Nuevo personaje creado: Nivel ${this.player.level}, XP: ${this.player.experience}`);
        } catch (error) {
            console.error('Error creando personaje:', error);
            this.createDefaultPlayer();
        }
    }

    createDefaultPlayer() {
        try {
            // Verificar si hay datos guardados localmente
            const savedPlayerData = this.scene.registry.get('playerData');

            if (savedPlayerData) {
                // Restaurar jugador con datos guardados localmente
                this.player = new Player(this.scene, savedPlayerData.gridX || 5, savedPlayerData.gridY || 10, savedPlayerData.playerClass || 'mage');
                this.player.currentHP = savedPlayerData.currentHP || this.player.maxHP;
                this.player.level = savedPlayerData.level || 1;
                this.player.experience = savedPlayerData.experience || 0;

                // Restaurar kamas e inventario si existen
                this.player.kamas = savedPlayerData.kamas || 0;
                this.player.inventory = savedPlayerData.inventory || [];

                console.log(`Jugador restaurado localmente: Nivel ${this.player.level}, XP: ${this.player.experience}, Kamas: ${this.player.kamas}`);
            } else {
                // Crear jugador completamente nuevo
                this.player = new Player(this.scene, 5, 10, 'mage');
                // Cargar objetos iniciales para jugador nuevo
                this.loadStarterItems('mage');
                console.log('Jugador nuevo creado');
            }

            // Verificar que el jugador se creó correctamente
            if (!this.player) {
                throw new Error('No se pudo crear el jugador');
            }

            console.log(`Jugador creado en posición: ${this.player.gridX}, ${this.player.gridY}`);
        } catch (error) {
            console.error('Error creando jugador por defecto:', error);
            // Crear jugador básico como último recurso
            this.player = new Player(this.scene, 5, 10, 'mage');
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
