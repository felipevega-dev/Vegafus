// Script para probar la persistencia de características después del combate
// Ejecutar con: node test-characteristics-persistence.js

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testCharacteristicsPersistence() {
    try {
        console.log('🧪 Iniciando prueba de persistencia de características...\n');

        // 1. Iniciar sesión (usar tus credenciales reales)
        const credentials = {
            username: 'tu_usuario', // Cambiar por tu usuario
            password: 'tu_password'  // Cambiar por tu contraseña
        };

        console.log('1. Iniciando sesión...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
        const authToken = loginResponse.data.token;
        console.log('✅ Sesión iniciada\n');

        // 2. Obtener personajes
        console.log('2. Obteniendo personajes...');
        const charactersResponse = await axios.get(`${BASE_URL}/characters`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const characters = charactersResponse.data.characters;
        if (characters.length === 0) {
            console.log('❌ No hay personajes para probar');
            return;
        }

        const character = characters[0]; // Usar el primer personaje
        console.log(`✅ Usando personaje: ${character.name} (Nivel ${character.level})`);
        console.log(`   Puntos de capital actuales: ${character.capitalPoints}`);
        console.log(`   Características actuales:`, character.characteristics);
        console.log('');

        // 3. Simular distribución de puntos (si tiene puntos disponibles)
        if (character.capitalPoints > 0) {
            console.log('3. Distribuyendo 1 punto en tierra...');
            
            const distributeResponse = await axios.post(`${BASE_URL}/characters/${character.id}/distribute-points`, {
                characteristic: 'tierra',
                points: 1
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            console.log('✅ Punto distribuido exitosamente');
            console.log(`   Nuevos puntos de capital: ${distributeResponse.data.character.capitalPoints}`);
            console.log(`   Nueva tierra: ${distributeResponse.data.character.characteristics.tierra}`);
            console.log('');
        } else {
            console.log('3. ⚠️ No hay puntos de capital para distribuir, saltando...\n');
        }

        // 4. Simular guardado de progreso (como después de un combate)
        console.log('4. Simulando guardado de progreso post-combate...');
        
        // Obtener datos actuales del personaje
        const currentCharResponse = await axios.get(`${BASE_URL}/characters/${character.id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const currentChar = currentCharResponse.data.character;

        // Simular datos que se enviarían después de un combate
        const combatData = {
            level: currentChar.level,
            experience: currentChar.experience + 50, // Simular XP ganada
            stats: currentChar.stats,
            position: currentChar.position,
            kamas: currentChar.kamas + 10, // Simular kamas ganadas
            inventory: currentChar.inventory,
            characteristics: currentChar.characteristics, // ¡CRÍTICO!
            capitalPoints: currentChar.capitalPoints,    // ¡CRÍTICO!
            spellPoints: currentChar.spellPoints,        // ¡CRÍTICO!
            resistances: currentChar.resistances,
            damageBonus: currentChar.damageBonus,
            combatResult: 'victory',
            enemiesDefeated: 1
        };

        const saveResponse = await axios.put(`${BASE_URL}/characters/${character.id}`, combatData, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Progreso guardado exitosamente');
        console.log('');

        // 5. Verificar que los datos persisten
        console.log('5. Verificando persistencia de datos...');
        
        const finalCharResponse = await axios.get(`${BASE_URL}/characters/${character.id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const finalChar = finalCharResponse.data.character;

        console.log(`✅ Verificación completada:`);
        console.log(`   Puntos de capital: ${finalChar.capitalPoints} (esperado: ${currentChar.capitalPoints})`);
        console.log(`   Tierra: ${finalChar.characteristics.tierra} (esperado: ${currentChar.characteristics.tierra})`);
        console.log(`   Experiencia: ${finalChar.experience} (esperado: ${currentChar.experience + 50})`);
        console.log('');

        // 6. Verificar si los datos coinciden
        const capitalMatch = finalChar.capitalPoints === currentChar.capitalPoints;
        const tierraMatch = finalChar.characteristics.tierra === currentChar.characteristics.tierra;
        const expMatch = finalChar.experience === (currentChar.experience + 50);

        if (capitalMatch && tierraMatch && expMatch) {
            console.log('🎉 ¡PRUEBA EXITOSA! Los datos persisten correctamente después del combate.');
        } else {
            console.log('❌ PRUEBA FALLIDA: Los datos no persisten correctamente.');
            if (!capitalMatch) console.log(`   - Puntos de capital no coinciden: ${finalChar.capitalPoints} vs ${currentChar.capitalPoints}`);
            if (!tierraMatch) console.log(`   - Tierra no coincide: ${finalChar.characteristics.tierra} vs ${currentChar.characteristics.tierra}`);
            if (!expMatch) console.log(`   - Experiencia no coincide: ${finalChar.experience} vs ${currentChar.experience + 50}`);
        }

    } catch (error) {
        console.error('❌ Error en la prueba:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Sugerencia: Verifica tus credenciales en el script.');
        }
    }
}

// Ejecutar la prueba
testCharacteristicsPersistence();
