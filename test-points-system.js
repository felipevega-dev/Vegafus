// Script de prueba para verificar el sistema de puntos
// Ejecutar con: node test-points-system.js

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Datos de prueba
const testUser = {
    username: 'testuser_points',
    email: 'testpoints@example.com',
    password: 'password123'
};

let authToken = '';
let characterId = '';

async function testPointsSystem() {
    try {
        console.log('🧪 Iniciando pruebas del sistema de puntos...\n');

        // 1. Registrar usuario de prueba
        console.log('1. Registrando usuario de prueba...');
        try {
            await axios.post(`${BASE_URL}/auth/register`, testUser);
            console.log('✅ Usuario registrado exitosamente');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('ℹ️ Usuario ya existe, continuando...');
            } else {
                throw error;
            }
        }

        // 2. Iniciar sesión
        console.log('\n2. Iniciando sesión...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: testUser.username,
            password: testUser.password
        });
        authToken = loginResponse.data.token;
        console.log('✅ Sesión iniciada exitosamente');

        // 3. Crear personaje
        console.log('\n3. Creando personaje de prueba...');
        const characterResponse = await axios.post(`${BASE_URL}/characters`, {
            name: 'TestPointsChar',
            class: 'mage'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        const character = characterResponse.data.character;
        characterId = character.id;
        
        console.log('✅ Personaje creado:');
        console.log(`   - Nombre: ${character.name}`);
        console.log(`   - Clase: ${character.class}`);
        console.log(`   - Nivel: ${character.level}`);
        console.log(`   - Puntos de capital: ${character.capitalPoints}`);
        console.log(`   - Puntos de hechizo: ${character.spellPoints}`);

        // Verificar valores iniciales
        if (character.level === 1 && character.capitalPoints === 10 && character.spellPoints === 1) {
            console.log('✅ Valores iniciales correctos');
        } else {
            console.log('❌ Valores iniciales incorrectos');
            console.log(`   Esperado: nivel=1, capital=10, hechizo=1`);
            console.log(`   Actual: nivel=${character.level}, capital=${character.capitalPoints}, hechizo=${character.spellPoints}`);
        }

        // 4. Forzar subida de nivel
        console.log('\n4. Probando subida de nivel...');
        const levelUpResponse = await axios.post(`${BASE_URL}/characters/${characterId}/force-levelup`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const leveledCharacter = levelUpResponse.data.character;
        console.log('✅ Personaje subió de nivel:');
        console.log(`   - Nivel: ${leveledCharacter.level}`);
        console.log(`   - Puntos de capital: ${leveledCharacter.capitalPoints}`);
        console.log(`   - Puntos de hechizo: ${leveledCharacter.spellPoints}`);

        // Verificar que los puntos se otorgaron correctamente
        const expectedCapital = 10 + ((leveledCharacter.level - 1) * 5);
        const expectedSpell = 1 + (leveledCharacter.level - 1);
        
        if (leveledCharacter.capitalPoints === expectedCapital && leveledCharacter.spellPoints === expectedSpell) {
            console.log('✅ Puntos otorgados correctamente al subir de nivel');
        } else {
            console.log('❌ Puntos incorrectos al subir de nivel');
            console.log(`   Esperado: capital=${expectedCapital}, hechizo=${expectedSpell}`);
            console.log(`   Actual: capital=${leveledCharacter.capitalPoints}, hechizo=${leveledCharacter.spellPoints}`);
        }

        // 5. Probar corrección de puntos
        console.log('\n5. Probando corrección de puntos...');
        const fixResponse = await axios.post(`${BASE_URL}/characters/${characterId}/fix-points`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log('✅ Respuesta de corrección:', fixResponse.data.message);
        console.log('   Correcciones aplicadas:', fixResponse.data.corrections);

        console.log('\n🎉 Todas las pruebas completadas exitosamente!');

    } catch (error) {
        console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    }
}

// Ejecutar pruebas
testPointsSystem();
