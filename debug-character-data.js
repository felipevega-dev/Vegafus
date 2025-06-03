// Script para debuggear los datos del personaje
// Ejecutar con: node debug-character-data.js

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function debugCharacterData() {
    try {
        console.log('🔍 Iniciando debug de datos del personaje...\n');

        // 1. Iniciar sesión
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
            console.log('❌ No hay personajes');
            return;
        }

        const character = characters[0]; // Usar el primer personaje
        console.log(`📋 Datos del personaje ${character.name}:`);
        console.log('   ID:', character.id);
        console.log('   Nivel:', character.level);
        console.log('   Experiencia:', character.experience);
        console.log('   Puntos de capital:', character.capitalPoints);
        console.log('   Puntos de hechizo:', character.spellPoints);
        console.log('   Características:', JSON.stringify(character.characteristics, null, 2));
        console.log('   Resistencias:', JSON.stringify(character.resistances, null, 2));
        console.log('');

        // 3. Verificar datos directamente desde la base de datos
        console.log('3. Verificando datos desde el endpoint específico...');
        const specificCharResponse = await axios.get(`${BASE_URL}/characters/${character.id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const specificChar = specificCharResponse.data.character;
        console.log(`📋 Datos específicos del personaje:`);
        console.log('   Puntos de capital:', specificChar.capitalPoints);
        console.log('   Características:', JSON.stringify(specificChar.characteristics, null, 2));
        console.log('');

        // 4. Simular distribución de puntos si tiene puntos disponibles
        if (specificChar.capitalPoints > 0) {
            console.log('4. Distribuyendo 1 punto en tierra...');
            
            const distributeResponse = await axios.post(`${BASE_URL}/characters/${character.id}/distribute-points`, {
                characteristic: 'tierra',
                points: 1
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            console.log('✅ Punto distribuido');
            console.log('   Nuevos puntos de capital:', distributeResponse.data.character.capitalPoints);
            console.log('   Nueva tierra:', distributeResponse.data.character.characteristics.tierra);
            console.log('');

            // 5. Verificar que se guardó correctamente
            console.log('5. Verificando que se guardó correctamente...');
            const verifyResponse = await axios.get(`${BASE_URL}/characters/${character.id}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const verifiedChar = verifyResponse.data.character;
            console.log('   Puntos de capital después:', verifiedChar.capitalPoints);
            console.log('   Tierra después:', verifiedChar.characteristics.tierra);
            console.log('');

            // 6. Simular guardado de progreso (como después de combate)
            console.log('6. Simulando guardado post-combate...');
            
            const combatData = {
                level: verifiedChar.level,
                experience: verifiedChar.experience + 50,
                stats: verifiedChar.stats,
                position: verifiedChar.position,
                kamas: verifiedChar.kamas + 10,
                inventory: verifiedChar.inventory,
                characteristics: verifiedChar.characteristics, // ¡CRÍTICO!
                capitalPoints: verifiedChar.capitalPoints,    // ¡CRÍTICO!
                spellPoints: verifiedChar.spellPoints,        // ¡CRÍTICO!
                resistances: verifiedChar.resistances,
                damageBonus: verifiedChar.damageBonus,
                combatResult: 'victory',
                enemiesDefeated: 1
            };

            console.log('📤 Datos que se enviarán:');
            console.log('   capitalPoints:', combatData.capitalPoints);
            console.log('   characteristics.tierra:', combatData.characteristics.tierra);
            console.log('');

            const saveResponse = await axios.put(`${BASE_URL}/characters/${character.id}`, combatData, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            console.log('✅ Progreso guardado');
            console.log('   Puntos de capital devueltos:', saveResponse.data.character.capitalPoints);
            console.log('   Tierra devuelta:', saveResponse.data.character.characteristics.tierra);
            console.log('');

            // 7. Verificación final
            console.log('7. Verificación final...');
            const finalResponse = await axios.get(`${BASE_URL}/characters/${character.id}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            const finalChar = finalResponse.data.character;
            console.log('   Puntos de capital finales:', finalChar.capitalPoints);
            console.log('   Tierra final:', finalChar.characteristics.tierra);
            console.log('');

            // Comparar
            const capitalMatch = finalChar.capitalPoints === verifiedChar.capitalPoints;
            const tierraMatch = finalChar.characteristics.tierra === verifiedChar.characteristics.tierra;

            if (capitalMatch && tierraMatch) {
                console.log('🎉 ¡DATOS PERSISTEN CORRECTAMENTE!');
            } else {
                console.log('❌ PROBLEMA: Los datos no persisten');
                if (!capitalMatch) {
                    console.log(`   Capital: esperado ${verifiedChar.capitalPoints}, obtenido ${finalChar.capitalPoints}`);
                }
                if (!tierraMatch) {
                    console.log(`   Tierra: esperado ${verifiedChar.characteristics.tierra}, obtenido ${finalChar.characteristics.tierra}`);
                }
            }
        } else {
            console.log('4. ⚠️ No hay puntos de capital para probar distribución');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Sugerencia: Verifica tus credenciales en el script.');
        }
    }
}

// Ejecutar
debugCharacterData();
