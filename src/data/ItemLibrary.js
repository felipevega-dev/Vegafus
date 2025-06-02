import { Item, Weapon, Armor, Consumable } from '@classes/Item.js';

/**
 * Librería de objetos predefinidos del juego
 */
export class ItemLibrary {
    
    // Armas básicas
    static getBasicWeapons() {
        return [
            new Weapon('sword_basic', 'Espada de Hierro', 'sword', 'common')
                .setStats({ attack: 15, tierra: 5 })
                .setDescription('Una espada básica de hierro. Resistente y confiable.')
                .setValue(50),
                
            new Weapon('staff_basic', 'Bastón de Madera', 'staff', 'common')
                .setStats({ attack: 10, fuego: 8, agua: 8 })
                .setDescription('Un bastón mágico básico que amplifica los hechizos elementales.')
                .setValue(60),
                
            new Weapon('bow_basic', 'Arco Corto', 'bow', 'common')
                .setStats({ attack: 12, aire: 10 })
                .setDescription('Un arco ligero perfecto para ataques a distancia.')
                .setValue(45)
        ];
    }

    // Armaduras básicas
    static getBasicArmor() {
        return [
            new Armor('helmet_leather', 'Casco de Cuero', 'helmet', 'common')
                .setStats({ defense: 5, vida: 10 })
                .setDescription('Un casco de cuero que ofrece protección básica.')
                .setValue(30),
                
            new Armor('chest_leather', 'Peto de Cuero', 'chest', 'common')
                .setStats({ defense: 8, vida: 15 })
                .setDescription('Una armadura de pecho de cuero resistente.')
                .setValue(50),
                
            new Armor('boots_leather', 'Botas de Cuero', 'boots', 'common')
                .setStats({ defense: 3, aire: 5 })
                .setDescription('Botas cómodas que mejoran la movilidad.')
                .setValue(25)
        ];
    }

    // Consumibles básicos
    static getBasicConsumables() {
        return [
            new Consumable('potion_health_small', 'Poción de Vida Pequeña', 'common')
                .setEffects([{ type: 'heal', value: 50 }])
                .setDescription('Restaura 50 puntos de vida.')
                .setValue(20)
                .setStackable(true, 10),
                
            new Consumable('potion_health_medium', 'Poción de Vida Mediana', 'uncommon')
                .setEffects([{ type: 'heal', value: 100 }])
                .setDescription('Restaura 100 puntos de vida.')
                .setValue(50)
                .setStackable(true, 5),
                
            new Consumable('bread', 'Pan', 'common')
                .setEffects([{ type: 'heal', value: 25 }])
                .setDescription('Un trozo de pan fresco. Restaura un poco de vida.')
                .setValue(5)
                .setStackable(true, 20)
        ];
    }

    // Objetos especiales
    static getSpecialItems() {
        return [
            new Item('crystal_tierra', 'Cristal de Tierra', 'misc', 'rare')
                .setStats({ tierra: 20 })
                .setDescription('Un cristal mágico que aumenta la afinidad con el elemento tierra.')
                .setValue(200),
                
            new Item('scroll_teleport', 'Pergamino de Teletransporte', 'misc', 'uncommon')
                .setDescription('Un pergamino mágico que permite teletransportarse a lugares conocidos.')
                .setValue(100)
                .setStackable(true, 3),
                
            new Weapon('sword_flame', 'Espada Flamígera', 'sword', 'rare')
                .setStats({ attack: 25, fuego: 15 })
                .setDescription('Una espada imbuida con el poder del fuego.')
                .setValue(300)
                .setRequirements({ level: 5, class: ['warrior'] })
        ];
    }

    // Obtener objetos iniciales según la clase
    static getStarterItems(playerClass) {
        const items = [];
        
        // Arma inicial según la clase
        switch (playerClass) {
            case 'warrior':
                items.push(this.getBasicWeapons()[0]); // Espada de Hierro
                break;
            case 'mage':
                items.push(this.getBasicWeapons()[1]); // Bastón de Madera
                break;
            case 'archer':
                items.push(this.getBasicWeapons()[2]); // Arco Corto
                break;
        }

        // Armadura básica
        items.push(this.getBasicArmor()[0]); // Casco de Cuero
        items.push(this.getBasicArmor()[2]); // Botas de Cuero

        // Consumibles iniciales
        items.push(this.getBasicConsumables()[0]); // Poción de Vida Pequeña
        items.push(this.getBasicConsumables()[2]); // Pan

        return items;
    }

    // Obtener objetos aleatorios para drops
    static getRandomItems(count = 1, maxRarity = 'uncommon') {
        const allItems = [
            ...this.getBasicWeapons(),
            ...this.getBasicArmor(),
            ...this.getBasicConsumables()
        ];

        if (maxRarity === 'rare' || maxRarity === 'epic' || maxRarity === 'legendary') {
            allItems.push(...this.getSpecialItems());
        }

        const items = [];
        for (let i = 0; i < count; i++) {
            const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
            items.push(randomItem.clone());
        }

        return items;
    }

    // Obtener objeto por ID
    static getItemById(id) {
        const allItems = [
            ...this.getBasicWeapons(),
            ...this.getBasicArmor(),
            ...this.getBasicConsumables(),
            ...this.getSpecialItems()
        ];

        return allItems.find(item => item.id === id)?.clone() || null;
    }

    // Obtener objetos por tipo
    static getItemsByType(type) {
        const allItems = [
            ...this.getBasicWeapons(),
            ...this.getBasicArmor(),
            ...this.getBasicConsumables(),
            ...this.getSpecialItems()
        ];

        return allItems.filter(item => item.type === type);
    }

    // Obtener objetos por rareza
    static getItemsByRarity(rarity) {
        const allItems = [
            ...this.getBasicWeapons(),
            ...this.getBasicArmor(),
            ...this.getBasicConsumables(),
            ...this.getSpecialItems()
        ];

        return allItems.filter(item => item.rarity === rarity);
    }
}
