/**
 * Clase base para objetos/items del juego
 */
export class Item {
    constructor(id, name, type, rarity = 'common') {
        this.id = id;
        this.name = name;
        this.type = type; // 'weapon', 'armor', 'consumable', 'misc'
        this.rarity = rarity; // 'common', 'uncommon', 'rare', 'epic', 'legendary'
        this.description = '';
        this.value = 0;
        this.stackable = false;
        this.maxStack = 1;
        this.icon = null;

        // Propiedades específicas según el tipo
        this.stats = {};
        this.effects = [];
        this.requirements = {};
    }

    // Obtener color según rareza
    getRarityColor() {
        const colors = {
            'common': '#ffffff',
            'uncommon': '#00ff00',
            'rare': '#0080ff',
            'epic': '#8000ff',
            'legendary': '#ff8000'
        };
        return colors[this.rarity] || colors.common;
    }

    // Verificar si el item puede ser usado por un personaje
    canBeUsedBy(character) {
        // Verificar requisitos de nivel
        if (this.requirements.level && character.level < this.requirements.level) {
            return false;
        }

        // Verificar requisitos de clase
        if (this.requirements.class && !this.requirements.class.includes(character.playerClass)) {
            return false;
        }

        return true;
    }

    // Usar el item (para consumibles)
    use(character) {
        if (this.type !== 'consumable') {
            return false;
        }

        // Aplicar efectos del item
        this.effects.forEach(effect => {
            this.applyEffect(effect, character);
        });

        return true;
    }

    // Aplicar efecto específico
    applyEffect(effect, character) {
        switch (effect.type) {
            case 'heal':
                character.currentHP = Math.min(character.maxHP, character.currentHP + effect.value);
                break;
            case 'mana':
                // Para futuro sistema de maná
                break;
            case 'buff':
                // Para futuro sistema de buffs
                break;
        }
    }

    // Clonar item
    clone() {
        const cloned = new Item(this.id, this.name, this.type, this.rarity);
        cloned.description = this.description;
        cloned.value = this.value;
        cloned.stackable = this.stackable;
        cloned.maxStack = this.maxStack;
        cloned.icon = this.icon;
        cloned.stats = { ...this.stats };
        cloned.effects = [...this.effects];
        cloned.requirements = { ...this.requirements };
        return cloned;
    }

    // Serializar para guardado
    serialize() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            rarity: this.rarity,
            description: this.description,
            value: this.value,
            stackable: this.stackable,
            maxStack: this.maxStack,
            icon: this.icon,
            stats: this.stats,
            effects: this.effects,
            requirements: this.requirements
        };
    }

    // Deserializar desde datos guardados
    static deserialize(data) {
        const item = new Item(data.id, data.name, data.type, data.rarity);
        item.description = data.description || '';
        item.value = data.value || 0;
        item.stackable = data.stackable || false;
        item.maxStack = data.maxStack || 1;
        item.icon = data.icon || null;
        item.stats = data.stats || {};
        item.effects = data.effects || [];
        item.requirements = data.requirements || {};
        return item;
    }
}

/**
 * Clase para armas
 */
export class Weapon extends Item {
    constructor(id, name, weaponType, rarity = 'common') {
        super(id, name, 'weapon', rarity);
        this.weaponType = weaponType; // 'sword', 'staff', 'bow', 'dagger'
        this.damage = 0;
        this.range = 1;
        this.criticalChance = 0;
        this.criticalMultiplier = 1.5;
    }

    // Calcular daño del arma
    calculateDamage(character) {
        let baseDamage = this.damage;

        // Aplicar stats del personaje
        if (this.stats.attack) {
            baseDamage += this.stats.attack;
        }

        // Aplicar características elementales si el arma tiene elemento
        if (this.stats.element && character.characteristics[this.stats.element]) {
            baseDamage *= (100 + character.characteristics[this.stats.element]) / 100;
        }

        return baseDamage;
    }
}

/**
 * Clase para armaduras
 */
export class Armor extends Item {
    constructor(id, name, armorType, rarity = 'common') {
        super(id, name, 'armor', rarity);
        this.armorType = armorType; // 'helmet', 'chest', 'legs', 'boots', 'gloves'
        this.defense = 0;
        this.resistances = {
            tierra: 0,
            fuego: 0,
            agua: 0,
            aire: 0
        };
    }
}

/**
 * Clase para consumibles
 */
export class Consumable extends Item {
    constructor(id, name, rarity = 'common') {
        super(id, name, 'consumable', rarity);
        this.stackable = true;
        this.maxStack = 99;
        this.cooldown = 0; // Cooldown en turnos
    }
}