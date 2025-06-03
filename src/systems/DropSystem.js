/**
 * Sistema de drops para items, recursos y dinero
 */

// Clase base para items
export class Item {
    constructor(id, name, type, rarity = 'common', value = 0, description = '') {
        this.id = id;
        this.name = name;
        this.type = type; // 'resource', 'equipment', 'consumable'
        this.rarity = rarity; // 'common', 'uncommon', 'rare', 'epic', 'legendary'
        this.value = value; // Valor en kamas
        this.description = description;
        this.stackable = type === 'resource' || type === 'consumable';
        this.maxStack = this.stackable ? 100 : 1;
        this.quantity = 1;
    }

    clone() {
        const cloned = new Item(this.id, this.name, this.type, this.rarity, this.value, this.description);
        cloned.stackable = this.stackable;
        cloned.maxStack = this.maxStack;
        cloned.quantity = this.quantity;
        return cloned;
    }
}

// Biblioteca de items disponibles (ahora carga desde backend)
export class ItemLibrary {
    static items = new Map(); // Cache de items
    static initialized = false;

    // Inicializar items desde el backend
    static async initialize() {
        if (this.initialized) return;

        try {
            // Cargar items desde el backend
            const { apiClient } = await import('../utils/ApiClient.js');
            const response = await apiClient.getItems();

            if (response.success) {
                // Convertir a objetos Item y guardar en cache
                response.data.forEach(itemData => {
                    const item = new Item(
                        itemData._id,
                        itemData.name,
                        itemData.type,
                        itemData.rarity,
                        itemData.value,
                        itemData.description
                    );
                    item.stackable = itemData.stackable;
                    item.maxStack = itemData.maxStack;
                    item.stats = itemData.stats;

                    this.items.set(itemData._id, item);
                });

                this.initialized = true;
                console.log(`✅ ${this.items.size} items cargados desde el backend`);
            }
        } catch (error) {
            console.error('❌ Error cargando items desde backend:', error);
            // Fallback: usar items locales
            this.initializeFallback();
        }
    }

    // Fallback: items locales si falla el backend
    static initializeFallback() {
        console.log('⚠️ Usando items locales como fallback');

        const fallbackItems = [
            new Item('wood', 'Madera', 'resource', 'common', 5, 'Madera básica para crafting'),
            new Item('stone', 'Piedra', 'resource', 'common', 3, 'Piedra común para construcción'),
            new Item('iron_ore', 'Mineral de Hierro', 'resource', 'uncommon', 15, 'Mineral valioso para forjar'),
            new Item('magic_crystal', 'Cristal Mágico', 'resource', 'rare', 50, 'Cristal imbuido de energía mágica'),
            new Item('herb', 'Hierba Medicinal', 'resource', 'common', 8, 'Hierba útil para pociones'),
            new Item('leather', 'Cuero', 'resource', 'common', 12, 'Cuero de buena calidad'),
            new Item('iron_sword', 'Espada de Hierro', 'equipment', 'uncommon', 100, 'Espada resistente de hierro'),
            new Item('leather_armor', 'Armadura de Cuero', 'equipment', 'common', 80, 'Armadura ligera de cuero'),
            new Item('magic_staff', 'Bastón Mágico', 'equipment', 'rare', 200, 'Bastón que amplifica la magia'),
            new Item('steel_helmet', 'Casco de Acero', 'equipment', 'uncommon', 120, 'Casco resistente de acero'),
            new Item('enchanted_ring', 'Anillo Encantado', 'equipment', 'epic', 500, 'Anillo con poderes mágicos'),
            new Item('bow_of_precision', 'Arco de Precisión', 'equipment', 'rare', 250, 'Arco que mejora la puntería'),
            new Item('health_potion', 'Poción de Vida', 'consumable', 'common', 25, 'Restaura 50 HP'),
            new Item('mana_potion', 'Poción de Maná', 'consumable', 'common', 30, 'Restaura 3 PA'),
            new Item('bread', 'Pan', 'consumable', 'common', 5, 'Alimento básico que restaura 20 HP')
        ];

        fallbackItems.forEach(item => {
            item.stackable = ['resource', 'consumable'].includes(item.type);
            item.maxStack = item.stackable ? 100 : 1;
            this.items.set(item.id, item);
        });

        this.initialized = true;
    }

    static async getItemById(id) {
        await this.initialize();
        return this.items.get(id)?.clone();
    }

    static async getAllItems() {
        await this.initialize();
        return Array.from(this.items.values()).map(item => item.clone());
    }

    static async getItemsByType(type) {
        await this.initialize();
        return Array.from(this.items.values())
            .filter(item => item.type === type)
            .map(item => item.clone());
    }
}

// Configuración de drops por tipo de enemigo
export class DropConfig {
    static getDropTable(enemyType = 'basic') {
        const baseDrops = {
            // Dinero (siempre tiene chance de dropear)
            kamas: {
                chance: 80, // 80% base
                minAmount: 10,
                maxAmount: 50
            },
            
            // Recursos (alta probabilidad)
            resources: {
                chance: 33, // 33% base
                items: [
                    { id: 'wood', weight: 30 },
                    { id: 'stone', weight: 30 },
                    { id: 'herb', weight: 20 },
                    { id: 'leather', weight: 15 },
                    { id: 'iron_ore', weight: 4 },
                    { id: 'magic_crystal', weight: 1 }
                ]
            },
            
            // Equipamiento (baja probabilidad)
            equipment: {
                chance: 10, // 10% base
                items: [
                    { id: 'leather_armor', weight: 40 },
                    { id: 'iron_sword', weight: 25 },
                    { id: 'steel_helmet', weight: 20 },
                    { id: 'bow_of_precision', weight: 10 },
                    { id: 'magic_staff', weight: 4 },
                    { id: 'enchanted_ring', weight: 1 }
                ]
            },
            
            // Consumibles (probabilidad media)
            consumables: {
                chance: 20, // 20% base
                items: [
                    { id: 'bread', weight: 50 },
                    { id: 'health_potion', weight: 35 },
                    { id: 'mana_potion', weight: 15 }
                ]
            }
        };

        // Modificadores por tipo de enemigo
        switch (enemyType) {
            case 'elite':
                baseDrops.kamas.chance = 95;
                baseDrops.kamas.minAmount = 25;
                baseDrops.kamas.maxAmount = 100;
                baseDrops.equipment.chance = 25;
                break;
            case 'boss':
                baseDrops.kamas.chance = 100;
                baseDrops.kamas.minAmount = 50;
                baseDrops.kamas.maxAmount = 200;
                baseDrops.equipment.chance = 50;
                baseDrops.resources.chance = 60;
                break;
        }

        return baseDrops;
    }
}

// Sistema principal de drops
export class DropSystem {
    constructor(scene) {
        this.scene = scene;
    }

    // Calcular drops al terminar combate
    async calculateCombatDrops(player, defeatedEnemies) {
        const drops = {
            kamas: 0,
            items: []
        };

        const prospection = player.getProspection();
        console.log(`🔍 Prospección del jugador: ${prospection}%`);

        for (const enemy of defeatedEnemies) {
            const enemyDrops = await this.calculateEnemyDrops(enemy, prospection);
            drops.kamas += enemyDrops.kamas;
            drops.items.push(...enemyDrops.items);
        }

        return drops;
    }

    // Calcular drops de un enemigo específico
    async calculateEnemyDrops(enemy, prospection) {
        const drops = { kamas: 0, items: [] };
        const enemyType = enemy.type || 'basic';
        const dropTable = DropConfig.getDropTable(enemyType);

        // Calcular drops de dinero
        const kamasChance = this.applyProspection(dropTable.kamas.chance, prospection);
        if (this.rollChance(kamasChance)) {
            const amount = this.randomBetween(dropTable.kamas.minAmount, dropTable.kamas.maxAmount);
            drops.kamas = amount;
            console.log(`💰 Drop: ${amount} kamas`);
        }

        // Calcular drops de cada categoría
        for (const category of ['resources', 'equipment', 'consumables']) {
            const categoryData = dropTable[category];
            const chance = this.applyProspection(categoryData.chance, prospection);

            if (this.rollChance(chance)) {
                const droppedItem = await this.selectRandomItem(categoryData.items);
                if (droppedItem) {
                    drops.items.push(droppedItem);
                    console.log(`📦 Drop: ${droppedItem.name}`);
                }
            }
        }

        return drops;
    }

    // Aplicar prospección a una probabilidad
    applyProspection(baseChance, prospection) {
        return Math.min(100, baseChance * (prospection / 100));
    }

    // Tirar dado para probabilidad
    rollChance(percentage) {
        return Math.random() * 100 < percentage;
    }

    // Número aleatorio entre min y max
    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Seleccionar item aleatorio basado en peso
    async selectRandomItem(itemsWithWeight) {
        const totalWeight = itemsWithWeight.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const itemData of itemsWithWeight) {
            random -= itemData.weight;
            if (random <= 0) {
                const item = await ItemLibrary.getItemById(itemData.id);
                return item || null;
            }
        }

        return null;
    }

    // Aplicar drops al jugador (local y backend)
    async applyDropsToPlayer(player, drops) {
        // Aplicar drops localmente primero
        if (drops.kamas > 0) {
            player.addKamas(drops.kamas);
        }

        drops.items.forEach(item => {
            if (player.addItem(item)) {
                console.log(`📦 ${item.name} agregado al inventario`);
            } else {
                console.log(`❌ Inventario lleno, no se pudo agregar ${item.name}`);
            }
        });

        // Persistir en el backend
        await this.persistDropsToBackend(player, drops);

        return drops;
    }

    // Persistir drops en el backend
    async persistDropsToBackend(player, drops) {
        try {
            // Obtener ID del personaje desde el registro de la escena
            const characterId = this.scene.registry.get('currentCharacterId');
            if (!characterId) {
                console.warn('⚠️ No se encontró ID del personaje, no se pueden persistir drops');
                return;
            }

            // Preparar datos de drops para el backend
            const backendDrops = {
                kamas: drops.kamas,
                items: drops.items.map(item => ({
                    id: item.id,
                    quantity: item.quantity || 1
                }))
            };

            // Enviar al backend
            const { apiClient } = await import('../utils/ApiClient.js');
            const result = await apiClient.applyDrops(characterId, backendDrops);

            if (result.success) {
                console.log('✅ Drops persistidos en el backend');
            } else {
                console.error('❌ Error persistiendo drops:', result.message);
            }
        } catch (error) {
            console.error('❌ Error enviando drops al backend:', error);
        }
    }
}
