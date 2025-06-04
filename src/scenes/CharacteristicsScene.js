export class CharacteristicsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacteristicsScene' });
    }

    init(data) {
        this.player = data.player;
        this.userData = data.userData;
        this.characterId = data.characterId;
        this.parentScene = data.parentScene;

        // Validar que tenemos los datos necesarios
        if (!this.userData) {
            console.error('❌ No se proporcionó userData a CharacteristicsScene');
        }

        if (!this.characterId) {
            console.error('❌ No se proporcionó characterId a CharacteristicsScene');
        }

        if (!this.player) {
            console.error('❌ No se proporcionó player a CharacteristicsScene');
        }

        console.log('🎯 CharacteristicsScene inicializada:');
        console.log('   - userData:', !!this.userData);
        console.log('   - characterId:', this.characterId);
        console.log('   - player:', !!this.player);
        if (this.player) {
            console.log('   - player.capitalPoints:', this.player.capitalPoints);
            console.log('   - player.characteristics:', this.player.characteristics);
        }
    }

    create() {
        console.log('🎯 Abriendo interfaz de características');

        // Fondo semi-transparente
        this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8);

        // Panel principal
        const panelWidth = 800;
        const panelHeight = 600;
        const panel = this.add.rectangle(640, 360, panelWidth, panelHeight, 0x2a2a2a, 0.95);
        panel.setStrokeStyle(3, 0x444444);

        // Título
        this.add.text(640, 100, 'CARACTERÍSTICAS', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Información del personaje
        this.add.text(640, 140, `${this.player.playerClass.toUpperCase()} - Nivel ${this.player.level}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Información de HP
        this.add.text(640, 160, `❤️ HP: ${this.player.currentHP}/${this.player.maxHP}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ff6666'
        }).setOrigin(0.5);

        // Puntos disponibles
        this.pointsText = this.add.text(640, 185, `Puntos disponibles: ${this.player.capitalPoints}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Crear secciones
        this.createCharacteristicsSection();
        this.createResistancesSection();

        // Botones
        this.createButtons();

        // Actualizar display
        this.updateDisplay();

        // Escuchar eventos de actualización de equipamiento
        this.events.on('equipmentStatsUpdated', (equipmentStats) => {
            console.log('📊 Características actualizadas por equipamiento:', equipmentStats);
            this.updateDisplay();
        });

        // Cargar stats de equipamiento iniciales
        this.loadEquipmentStats();
    }

    createCharacteristicsSection() {
        const startX = 300;
        const startY = 240;
        const lineHeight = 45;

        // Título de sección
        this.add.text(startX, startY - 30, 'CARACTERÍSTICAS ELEMENTALES', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        const characteristics = [
            { key: 'tierra', name: '🌍 Tierra (Fuerza)', color: '#8B4513' },
            { key: 'fuego', name: '🔥 Fuego (Inteligencia)', color: '#ff4400' },
            { key: 'agua', name: '💧 Agua (Suerte)', color: '#00ffff' },
            { key: 'aire', name: '💨 Aire (Agilidad)', color: '#cccccc' },
            { key: 'vida', name: '❤️ Vida (Vitalidad)', color: '#ff0000' },
            { key: 'sabiduria', name: '🧠 Sabiduría', color: '#9966ff' }
        ];

        this.characteristicElements = {};

        characteristics.forEach((char, index) => {
            const y = startY + (index * lineHeight);

            // Nombre de la característica
            this.add.text(startX, y, char.name, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: char.color,
                fontStyle: 'bold'
            });

            // Valor actual
            const valueText = this.add.text(startX + 250, y, '0', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff'
            });

            // Botón -
            const minusBtn = this.add.text(startX + 300, y, '[-]', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ff6666',
                backgroundColor: '#333333',
                padding: { x: 8, y: 4 }
            });
            minusBtn.setInteractive();
            minusBtn.on('pointerdown', () => this.adjustCharacteristic(char.key, -1));

            // Botón +
            const plusBtn = this.add.text(startX + 350, y, '[+]', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#66ff66',
                backgroundColor: '#333333',
                padding: { x: 8, y: 4 }
            });
            plusBtn.setInteractive();
            plusBtn.on('pointerdown', () => this.adjustCharacteristic(char.key, 1));

            // Efecto de la característica
            const effectText = this.add.text(startX + 400, y, '', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#cccccc'
            });

            this.characteristicElements[char.key] = {
                valueText,
                effectText,
                minusBtn,
                plusBtn
            };
        });
    }

    createResistancesSection() {
        const startX = 700;
        const startY = 240;
        const lineHeight = 45;

        // Título de sección
        this.add.text(startX, startY - 30, 'RESISTENCIAS', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });

        const resistances = [
            { key: 'tierra', name: 'Res. Tierra', color: '#8B4513' },
            { key: 'fuego', name: 'Res. Fuego', color: '#ff4400' },
            { key: 'agua', name: 'Res. Agua', color: '#00ffff' },
            { key: 'aire', name: 'Res. Aire', color: '#cccccc' }
        ];

        this.resistanceElements = {};

        resistances.forEach((res, index) => {
            const y = startY + (index * lineHeight);

            // Nombre de la resistencia
            this.add.text(startX, y, res.name, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: res.color,
                fontStyle: 'bold'
            });

            // Valor actual
            const valueText = this.add.text(startX + 150, y, '0%', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffffff'
            });

            this.resistanceElements[res.key] = {
                valueText
            };
        });
    }

    createButtons() {
        // Botón Cerrar
        const closeBtn = this.add.text(640, 620, 'CERRAR', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#666666',
            padding: { x: 20, y: 10 }
        });
        closeBtn.setOrigin(0.5);
        closeBtn.setInteractive();
        closeBtn.on('pointerdown', () => this.closeInterface());

        // Botón Guardar
        const saveBtn = this.add.text(500, 620, 'GUARDAR', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#006600',
            padding: { x: 20, y: 10 }
        });
        saveBtn.setOrigin(0.5);
        saveBtn.setInteractive();
        saveBtn.on('pointerdown', () => this.saveCharacteristics());

        // Botón Reset
        const resetBtn = this.add.text(780, 620, 'RESET', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#cc0000',
            padding: { x: 20, y: 10 }
        });
        resetBtn.setOrigin(0.5);
        resetBtn.setInteractive();
        resetBtn.on('pointerdown', () => this.resetChanges());

        // Información adicional
        this.add.text(640, 550, 'Los puntos de capital se obtienen automáticamente al subir de nivel', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);




    }

    adjustCharacteristic(characteristic, amount) {
        if (amount > 0 && this.player.capitalPoints <= 0) {
            console.log('No tienes puntos disponibles');
            return;
        }

        if (amount < 0 && this.player.characteristics[characteristic] <= 0) {
            console.log('No puedes reducir más esta característica');
            return;
        }

        // Aplicar cambio
        this.player.characteristics[characteristic] += amount;
        this.player.capitalPoints -= amount;

        // Actualizar display
        this.updateDisplay();

        console.log(`${characteristic}: ${this.player.characteristics[characteristic]} (Puntos: ${this.player.capitalPoints})`);
    }

    updateDisplay() {
        // Actualizar puntos disponibles
        this.pointsText.setText(`Puntos disponibles: ${this.player.capitalPoints}`);

        // Actualizar información del personaje si cambió el nivel
        const infoElements = this.children.list.filter(child =>
            child.text && (child.text.includes('Nivel') || child.text.includes('HP:'))
        );

        infoElements.forEach(element => {
            if (element.text.includes('Nivel')) {
                element.setText(`${this.player.playerClass.toUpperCase()} - Nivel ${this.player.level}`);
            } else if (element.text.includes('HP:')) {
                element.setText(`❤️ HP: ${this.player.currentHP}/${this.player.maxHP}`);
            }
        });

        // Actualizar características
        Object.keys(this.characteristicElements).forEach(key => {
            const baseValue = this.player.characteristics[key];
            const equipmentBonus = this.player.equipmentBonus?.[key] || 0;
            const totalValue = baseValue + equipmentBonus;
            const elements = this.characteristicElements[key];

            // Mostrar valor base + bono de equipamiento
            let displayText = baseValue.toString();
            if (equipmentBonus > 0) {
                displayText += ` (+${equipmentBonus})`;
                elements.valueText.setColor('#00ff00'); // Verde para mostrar bono
            } else {
                elements.valueText.setColor('#ffffff'); // Blanco normal
            }
            elements.valueText.setText(displayText);

            // Mostrar efecto (usar valor total)
            let effect = '';
            if (key === 'vida') {
                effect = `(+${totalValue} HP máximo)`;
            } else if (key === 'sabiduria') {
                effect = `(+${totalValue}% XP)`;
            } else {
                effect = `(+${totalValue}% daño ${key})`;
            }
            elements.effectText.setText(effect);

            // Habilitar/deshabilitar botones
            elements.minusBtn.setAlpha(baseValue > 0 ? 1 : 0.5);
            elements.plusBtn.setAlpha(this.player.capitalPoints > 0 ? 1 : 0.5);
        });

        // Actualizar resistencias
        Object.keys(this.resistanceElements).forEach(key => {
            const value = this.player.resistances?.[key] || 0;
            this.resistanceElements[key].valueText.setText(`${value}%`);
        });
    }

    async saveCharacteristics() {
        if (!this.userData || !this.characterId) {
            console.log('No se puede guardar: falta información de usuario');
            return;
        }

        try {
            // Mostrar mensaje de guardado
            const saveMessage = this.add.text(640, 550, 'Guardando...', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ffff00'
            }).setOrigin(0.5);

            const { apiClient } = await import('../utils/ApiClient.js');

            const gameData = {
                characteristics: this.player.characteristics,
                capitalPoints: this.player.capitalPoints,
                stats: this.player.stats // Incluir stats actualizados
            };

            console.log('📤 Guardando características:');
            console.log('   - characterId:', this.characterId);
            console.log('   - capitalPoints:', gameData.capitalPoints);
            console.log('   - characteristics:', gameData.characteristics);

            await apiClient.saveProgress(this.characterId, gameData);

            saveMessage.setText('✅ Guardado exitoso');
            saveMessage.setColor('#00ff00');

            // Eliminar mensaje después de 2 segundos
            this.time.delayedCall(2000, () => {
                saveMessage.destroy();
            });

            console.log('✅ Características guardadas en el backend');

        } catch (error) {
            console.error('❌ Error guardando características:', error);
            
            const errorMessage = this.add.text(640, 550, '❌ Error al guardar', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ff0000'
            }).setOrigin(0.5);

            this.time.delayedCall(3000, () => {
                errorMessage.destroy();
            });
        }
    }

    async forceLevelUp() {
        if (!this.userData || !this.characterId) {
            console.log('No se puede forzar level up: falta información de usuario');
            return;
        }

        try {
            // Mostrar mensaje de procesando
            const processMessage = this.add.text(640, 580, 'Obteniendo puntos...', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffff00'
            }).setOrigin(0.5);

            // Verificar token - puede estar en 'token' o 'authToken'
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay token de autenticación');
            }

            console.log('🔑 Enviando request con token:', token.substring(0, 20) + '...');

            // Llamar a la ruta de force level up
            const response = await fetch(`http://localhost:3000/api/characters/${this.characterId}/force-levelup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Response status:', response.status);

            if (response.ok) {
                const data = await response.json();

                // Actualizar datos del jugador
                this.player.level = data.character.level;
                this.player.capitalPoints = data.character.capitalPoints;
                this.player.characteristics = data.character.characteristics;
                this.player.maxHP = data.character.stats.hp.max;
                this.player.currentHP = data.character.stats.hp.current;

                // Actualizar display
                this.updateDisplay();

                processMessage.setText(`✅ ${data.message}`);
                processMessage.setColor('#00ff00');

                console.log('✅ Level up forzado exitoso:', data);
            } else {
                // Obtener detalles del error
                let errorMessage = `Error ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Si no se puede parsear el JSON, usar el status
                }

                console.error('❌ Error del servidor:', response.status, errorMessage);
                throw new Error(errorMessage);
            }

            // Eliminar mensaje después de 3 segundos
            this.time.delayedCall(3000, () => {
                processMessage.destroy();
            });

        } catch (error) {
            console.error('❌ Error forzando level up:', error);

            const errorMessage = this.add.text(640, 580, '❌ Error obteniendo puntos', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ff0000'
            }).setOrigin(0.5);

            this.time.delayedCall(3000, () => {
                errorMessage.destroy();
            });
        }
    }

    debugToken() {
        console.log('🔍 DEBUG TOKEN:');
        console.log('token:', localStorage.getItem('token'));
        console.log('authToken:', localStorage.getItem('authToken'));
        console.log('userData:', this.userData);
        console.log('characterId:', this.characterId);

        // Mostrar en pantalla también
        const debugMessage = this.add.text(640, 580,
            `Token: ${localStorage.getItem('token') ? 'SÍ' : 'NO'} | AuthToken: ${localStorage.getItem('authToken') ? 'SÍ' : 'NO'}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00'
        }).setOrigin(0.5);

        this.time.delayedCall(3000, () => {
            debugMessage.destroy();
        });
    }

    resetChanges() {
        // Aquí podrías implementar un reset a los valores originales
        console.log('Reset no implementado aún');
    }

    async loadEquipmentStats() {
        try {
            const authToken = localStorage.getItem('authToken');

            if (!this.characterId || !authToken) {
                console.warn('⚠️ No se pueden cargar stats de equipamiento: falta characterId o token');
                return;
            }

            console.log('📊 Cargando stats de equipamiento para características...');
            const response = await fetch(`http://localhost:3000/api/equipment/${this.characterId}/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    console.log('📊 Stats de equipamiento cargados:', result.data);

                    // Aplicar bonos de equipamiento al jugador
                    this.player.equipmentBonus = result.data;

                    // Actualizar display
                    this.updateDisplay();

                    console.log('✅ Stats de equipamiento aplicados en características');
                } else {
                    console.warn('⚠️ No se pudieron cargar stats de equipamiento');
                }
            } else {
                console.error('❌ Error cargando stats de equipamiento:', response.status);
            }
        } catch (error) {
            console.error('❌ Error cargando stats de equipamiento:', error);
        }
    }

    closeInterface() {
        // Volver a la escena padre
        this.scene.stop();
        this.scene.resume(this.parentScene);
    }
}
