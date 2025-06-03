// Script para listar personajes y corregir puntos
// Ejecutar con: node list-characters.js

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function listAndFixCharacters() {
    try {
        console.log('🔍 Listando personajes para corrección de puntos...\n');

        // Solicitar credenciales al usuario
        console.log('Por favor, proporciona tus credenciales:');
        
        // Para este script, usaremos credenciales de ejemplo
        // En un entorno real, podrías usar readline para input del usuario
        const credentials = {
            username: 'tu_usuario', // Cambiar por tu usuario
            password: 'tu_password'  // Cambiar por tu contraseña
        };

        console.log('ℹ️ Usando credenciales de ejemplo. Modifica el script con tus credenciales reales.\n');

        // 1. Iniciar sesión
        console.log('1. Iniciando sesión...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
        const authToken = loginResponse.data.token;
        console.log('✅ Sesión iniciada exitosamente\n');

        // 2. Obtener personajes
        console.log('2. Obteniendo lista de personajes...');
        const charactersResponse = await axios.get(`${BASE_URL}/characters`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        const characters = charactersResponse.data.characters;
        console.log(`✅ ${characters.length} personajes encontrados:\n`);

        // 3. Mostrar información de cada personaje
        characters.forEach((char, index) => {
            console.log(`--- Personaje ${index + 1} ---`);
            console.log(`ID: ${char.id}`);
            console.log(`Nombre: ${char.name}`);
            console.log(`Clase: ${char.class}`);
            console.log(`Nivel: ${char.level}`);
            console.log(`Experiencia: ${char.experience}`);
            console.log(`Puntos de capital: ${char.capitalPoints}`);
            console.log(`Puntos de hechizo: ${char.spellPoints}`);
            
            // Calcular puntos esperados
            const expectedCapital = 10 + ((char.level - 1) * 5);
            const expectedSpell = 1 + (char.level - 1);
            
            console.log(`Puntos esperados: Capital=${expectedCapital}, Hechizo=${expectedSpell}`);
            
            if (char.capitalPoints < expectedCapital || char.spellPoints < expectedSpell) {
                console.log(`🔧 NECESITA CORRECCIÓN: Faltan ${expectedCapital - char.capitalPoints} capital, ${expectedSpell - char.spellPoints} hechizo`);
            } else {
                console.log(`✅ Puntos correctos`);
            }
            console.log('');
        });

        // 4. Ofrecer corrección automática
        console.log('4. Aplicando corrección automática a personajes que lo necesiten...\n');

        for (const char of characters) {
            const expectedCapital = 10 + ((char.level - 1) * 5);
            const expectedSpell = 1 + (char.level - 1);
            
            if (char.capitalPoints < expectedCapital || char.spellPoints < expectedSpell) {
                console.log(`🔧 Corrigiendo ${char.name}...`);
                
                try {
                    const fixResponse = await axios.post(`${BASE_URL}/characters/${char.id}/fix-points`, {}, {
                        headers: { Authorization: `Bearer ${authToken}` }
                    });
                    
                    console.log(`✅ ${fixResponse.data.message}`);
                    console.log(`   Nuevos puntos: Capital=${fixResponse.data.character.capitalPoints}, Hechizo=${fixResponse.data.character.spellPoints}`);
                } catch (error) {
                    console.log(`❌ Error corrigiendo ${char.name}:`, error.response?.data?.message || error.message);
                }
                console.log('');
            }
        }

        console.log('🎉 Proceso completado!');

    } catch (error) {
        console.error('❌ Error:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Sugerencia: Verifica tus credenciales en el script.');
        }
    }
}

// Ejecutar
listAndFixCharacters();
