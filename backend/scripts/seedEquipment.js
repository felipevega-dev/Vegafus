const mongoose = require('mongoose');
const Item = require('../src/models/Item');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/dofus-game', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const equipmentItems = [
    // Armas
    {
        _id: 'iron_sword',
        name: 'Espada de Hierro',
        type: 'equipment',
        subtype: 'weapon',
        rarity: 'common',
        value: 100,
        description: 'Una espada básica de hierro. Resistente y confiable.',
        stackable: false,
        maxStack: 1,
        stats: {
            tierra: 10,
            attack: 15
        },
        requirements: {
            level: 1,
            class: null
        }
    },
    {
        _id: 'wooden_staff',
        name: 'Bastón de Madera',
        type: 'equipment',
        subtype: 'weapon',
        rarity: 'common',
        value: 80,
        description: 'Un bastón mágico básico que amplifica los hechizos elementales.',
        stackable: false,
        maxStack: 1,
        stats: {
            fuego: 8,
            agua: 8,
            attack: 10
        },
        requirements: {
            level: 1,
            class: 'mage'
        }
    },
    {
        _id: 'short_bow',
        name: 'Arco Corto',
        type: 'equipment',
        subtype: 'weapon',
        rarity: 'common',
        value: 90,
        description: 'Un arco ligero perfecto para ataques a distancia.',
        stackable: false,
        maxStack: 1,
        stats: {
            aire: 12,
            attack: 12
        },
        requirements: {
            level: 1,
            class: 'archer'
        }
    },

    // Armaduras
    {
        _id: 'leather_armor',
        name: 'Armadura de Cuero',
        type: 'equipment',
        subtype: 'armor',
        rarity: 'common',
        value: 150,
        description: 'Una armadura ligera de cuero que ofrece protección básica.',
        stackable: false,
        maxStack: 1,
        stats: {
            vida: 20,
            defense: 10
        },
        requirements: {
            level: 1,
            class: null
        }
    },
    {
        _id: 'mage_robe',
        name: 'Túnica de Mago',
        type: 'equipment',
        subtype: 'armor',
        rarity: 'uncommon',
        value: 200,
        description: 'Una túnica encantada que aumenta el poder mágico.',
        stackable: false,
        maxStack: 1,
        stats: {
            fuego: 5,
            agua: 5,
            aire: 5,
            vida: 15,
            sabiduria: 10
        },
        requirements: {
            level: 3,
            class: 'mage'
        }
    },

    // Cascos
    {
        _id: 'iron_helmet',
        name: 'Casco de Hierro',
        type: 'equipment',
        subtype: 'helmet',
        rarity: 'common',
        value: 80,
        description: 'Un casco resistente que protege la cabeza.',
        stackable: false,
        maxStack: 1,
        stats: {
            vida: 15,
            defense: 5
        },
        requirements: {
            level: 2,
            class: null
        }
    },

    // Botas
    {
        _id: 'leather_boots',
        name: 'Botas de Cuero',
        type: 'equipment',
        subtype: 'boots',
        rarity: 'common',
        value: 60,
        description: 'Botas cómodas que mejoran la movilidad.',
        stackable: false,
        maxStack: 1,
        stats: {
            aire: 5,
            movementPoints: 1
        },
        requirements: {
            level: 1,
            class: null
        }
    },

    // Anillos
    {
        _id: 'power_ring',
        name: 'Anillo de Poder',
        type: 'equipment',
        subtype: 'ring',
        rarity: 'rare',
        value: 300,
        description: 'Un anillo que aumenta el poder elemental.',
        stackable: false,
        maxStack: 1,
        stats: {
            tierra: 8,
            fuego: 8,
            agua: 8,
            aire: 8
        },
        requirements: {
            level: 5,
            class: null
        }
    },
    {
        _id: 'vitality_ring',
        name: 'Anillo de Vitalidad',
        type: 'equipment',
        subtype: 'ring',
        rarity: 'uncommon',
        value: 180,
        description: 'Un anillo que aumenta la vitalidad.',
        stackable: false,
        maxStack: 1,
        stats: {
            vida: 25,
            hp: 50
        },
        requirements: {
            level: 3,
            class: null
        }
    },

    // Amuletos
    {
        _id: 'wisdom_amulet',
        name: 'Amuleto de Sabiduría',
        type: 'equipment',
        subtype: 'amulet',
        rarity: 'uncommon',
        value: 250,
        description: 'Un amuleto que aumenta la experiencia ganada.',
        stackable: false,
        maxStack: 1,
        stats: {
            sabiduria: 20,
            vida: 10
        },
        requirements: {
            level: 4,
            class: null
        }
    },

    // Escudos
    {
        _id: 'wooden_shield',
        name: 'Escudo de Madera',
        type: 'equipment',
        subtype: 'shield',
        rarity: 'common',
        value: 70,
        description: 'Un escudo básico de madera.',
        stackable: false,
        maxStack: 1,
        stats: {
            defense: 8,
            vida: 10
        },
        requirements: {
            level: 1,
            class: null
        }
    },

    // Cinturones
    {
        _id: 'leather_belt',
        name: 'Cinturón de Cuero',
        type: 'equipment',
        subtype: 'belt',
        rarity: 'common',
        value: 50,
        description: 'Un cinturón resistente que mejora la resistencia.',
        stackable: false,
        maxStack: 1,
        stats: {
            vida: 12,
            tierraRes: 5
        },
        requirements: {
            level: 2,
            class: null
        }
    }
];

async function seedEquipment() {
    try {
        console.log('🌱 Iniciando seed de equipamiento...');
        
        // Limpiar items de equipamiento existentes
        await Item.deleteMany({ type: 'equipment' });
        console.log('🗑️ Items de equipamiento existentes eliminados');
        
        // Insertar nuevos items
        await Item.insertMany(equipmentItems);
        console.log(`✅ ${equipmentItems.length} items de equipamiento insertados`);
        
        console.log('🎉 Seed de equipamiento completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error en seed de equipamiento:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Ejecutar el seed
seedEquipment();
