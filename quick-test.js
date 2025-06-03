// Script rápido para probar el backend
// Ejecutar con: node quick-test.js

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function quickTest() {
    try {
        console.log('🧪 Prueba rápida del backend...\n');

        // Credenciales - CAMBIAR POR LAS TUYAS
        const credentials = {
            username: 'tu_usuario',
            password: 'tu_password'
        };

        // 1. Login
        console.log('1. Login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
        const token = loginResponse.data.token;
        console.log('✅ Login exitoso\n');

        // 2. Obtener personajes
        console.log('2. Obteniendo personajes...');
        const charactersResponse = await axios.get(`${BASE_URL}/characters`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const characters = charactersResponse.data.characters;
        if (characters.length === 0) {
            console.log('❌ No hay personajes');
            return;
        }

        const char = characters[0];
        console.log(`📋 Personaje: ${char.name}`);
        console.log(`   Capital: ${char.capitalPoints}`);
        console.log(`   Tierra: ${char.characteristics.tierra}`);
        console.log('');

        // 3. Si tiene puntos, distribuir uno
        if (char.capitalPoints > 0) {
            console.log('3. Distribuyendo 1 punto en tierra...');
            
            const distributeResponse = await axios.post(`${BASE_URL}/characters/${char.id}/distribute-points`, {
                characteristic: 'tierra',
                points: 1
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Punto distribuido');
            console.log(`   Nuevo capital: ${distributeResponse.data.character.capitalPoints}`);
            console.log(`   Nueva tierra: ${distributeResponse.data.character.characteristics.tierra}`);
            console.log('');

            // 4. Verificar inmediatamente
            console.log('4. Verificando inmediatamente...');
            const verifyResponse = await axios.get(`${BASE_URL}/characters/${char.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const verifiedChar = verifyResponse.data.character;
            console.log(`   Capital verificado: ${verifiedChar.capitalPoints}`);
            console.log(`   Tierra verificada: ${verifiedChar.characteristics.tierra}`);
            console.log('');

            // 5. Simular guardado post-combate
            console.log('5. Simulando guardado post-combate...');
            
            const saveData = {
                level: verifiedChar.level,
                experience: verifiedChar.experience + 50,
                stats: verifiedChar.stats,
                position: verifiedChar.position,
                kamas: verifiedChar.kamas,
                inventory: verifiedChar.inventory,
                characteristics: verifiedChar.characteristics,
                capitalPoints: verifiedChar.capitalPoints,
                spellPoints: verifiedChar.spellPoints,
                resistances: verifiedChar.resistances,
                damageBonus: verifiedChar.damageBonus,
                combatResult: 'victory',
                enemiesDefeated: 1
            };

            console.log(`📤 Enviando capital: ${saveData.capitalPoints}, tierra: ${saveData.characteristics.tierra}`);

            const saveResponse = await axios.put(`${BASE_URL}/characters/${char.id}`, saveData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('✅ Guardado post-combate');
            console.log(`📥 Recibido capital: ${saveResponse.data.character.capitalPoints}, tierra: ${saveResponse.data.character.characteristics.tierra}`);
            console.log('');

            // 6. Verificación final
            console.log('6. Verificación final...');
            const finalResponse = await axios.get(`${BASE_URL}/characters/${char.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const finalChar = finalResponse.data.character;
            console.log(`   Capital final: ${finalChar.capitalPoints}`);
            console.log(`   Tierra final: ${finalChar.characteristics.tierra}`);

            // Resultado
            if (finalChar.capitalPoints === verifiedChar.capitalPoints && 
                finalChar.characteristics.tierra === verifiedChar.characteristics.tierra) {
                console.log('\n🎉 ¡BACKEND FUNCIONA CORRECTAMENTE!');
                console.log('El problema debe estar en el frontend.');
            } else {
                console.log('\n❌ PROBLEMA EN EL BACKEND');
                console.log('Los datos no persisten correctamente.');
            }
        } else {
            console.log('3. ⚠️ No hay puntos de capital para probar');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
    }
}

quickTest();
