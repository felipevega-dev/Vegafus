const mongoose = require('mongoose');
const Character = require('../src/models/Character');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/dofus-game', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function fixCharacterClasses() {
    try {
        console.log('🔧 Corrigiendo clases de personajes...');
        
        // Buscar personajes con clases inválidas
        const characters = await Character.find({});
        
        for (const character of characters) {
            let needsUpdate = false;
            
            // Mapear clases inválidas a válidas
            if (character.class === 'Arquero') {
                character.class = 'archer';
                needsUpdate = true;
                console.log(`🏹 Corrigiendo clase de ${character.name}: Arquero -> archer`);
            }
            
            if (needsUpdate) {
                await character.save();
                console.log(`✅ Personaje ${character.name} actualizado`);
            }
        }
        
        console.log('🎉 Clases de personajes corregidas');
        
    } catch (error) {
        console.error('❌ Error corrigiendo clases:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Ejecutar el script
fixCharacterClasses();
