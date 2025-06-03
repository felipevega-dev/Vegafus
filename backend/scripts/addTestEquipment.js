const mongoose = require('mongoose');
const Character = require('../src/models/Character');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/dofus-game', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function addTestEquipment() {
    try {
        console.log('🎒 Agregando items de equipamiento de prueba...');
        
        // Buscar todos los personajes
        const characters = await Character.find({});
        console.log(`📋 Encontrados ${characters.length} personajes`);
        
        if (characters.length === 0) {
            console.log('❌ No se encontraron personajes. Crea un personaje primero.');
            return;
        }

        // Items de equipamiento para agregar
        const testItems = [
            { itemId: 'iron_sword', quantity: 1 },
            { itemId: 'leather_armor', quantity: 1 },
            { itemId: 'iron_helmet', quantity: 1 },
            { itemId: 'leather_boots', quantity: 1 },
            { itemId: 'power_ring', quantity: 1 },
            { itemId: 'vitality_ring', quantity: 1 },
            { itemId: 'wisdom_amulet', quantity: 1 },
            { itemId: 'wooden_shield', quantity: 1 },
            { itemId: 'leather_belt', quantity: 1 },
            { itemId: 'wooden_staff', quantity: 1 },
            { itemId: 'short_bow', quantity: 1 },
            { itemId: 'mage_robe', quantity: 1 }
        ];

        // Agregar items a cada personaje
        for (const character of characters) {
            console.log(`\n👤 Procesando personaje: ${character.name} (${character.class})`);
            
            // Limpiar inventario existente de equipamiento
            character.inventory = character.inventory.filter(item => 
                !['iron_sword', 'leather_armor', 'iron_helmet', 'leather_boots', 
                  'power_ring', 'vitality_ring', 'wisdom_amulet', 'wooden_shield', 
                  'leather_belt', 'wooden_staff', 'short_bow', 'mage_robe'].includes(item.itemId)
            );
            
            // Agregar items de prueba
            testItems.forEach(item => {
                character.inventory.push({
                    itemId: item.itemId,
                    quantity: item.quantity,
                    equipped: false,
                    obtainedAt: new Date()
                });
            });
            
            // Agregar algunos kamas extra
            character.kamas += 1000;
            
            await character.save();
            console.log(`✅ Items agregados al inventario de ${character.name}`);
            console.log(`💰 Kamas actuales: ${character.kamas}`);
            console.log(`🎒 Items en inventario: ${character.inventory.length}`);
        }
        
        console.log('\n🎉 ¡Items de equipamiento agregados exitosamente a todos los personajes!');
        console.log('\n📝 Items agregados:');
        testItems.forEach(item => {
            console.log(`   - ${item.itemId} (x${item.quantity})`);
        });
        
    } catch (error) {
        console.error('❌ Error agregando items de equipamiento:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Ejecutar el script
addTestEquipment();
