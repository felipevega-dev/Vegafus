export class CombatSummary {
    constructor(scene) {
        this.scene = scene;
        this.isVisible = false;
        this.summaryElements = [];
    }

    // Mostrar resumen de combate
    showSummary(defeatedEnemies, experienceGained, player, drops = null) {
        if (this.isVisible) return;

        this.isVisible = true;
        this.defeatedEnemies = defeatedEnemies;
        this.experienceGained = experienceGained;
        this.player = player;
        this.drops = drops;

        this.createSummaryWindow();
    }

    createSummaryWindow() {
        // Fondo semi-transparente
        const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7);
        overlay.setDepth(2000);
        this.summaryElements.push(overlay);

        // Panel principal
        const panel = this.scene.add.rectangle(640, 360, 600, 400, 0x222222, 0.95);
        panel.setDepth(2001);
        panel.setStrokeStyle(3, 0xffffff);
        this.summaryElements.push(panel);

        // Título
        const title = this.scene.add.text(640, 200, '¡VICTORIA!', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#00ff00',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setDepth(2002);
        this.summaryElements.push(title);

        // Subtítulo
        const subtitle = this.scene.add.text(640, 240, 'Resumen del Combate', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        subtitle.setOrigin(0.5);
        subtitle.setDepth(2002);
        this.summaryElements.push(subtitle);

        // Lista de enemigos derrotados
        let yPos = 280;
        
        const enemiesTitle = this.scene.add.text(640, yPos, 'Enemigos Derrotados:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffff00',
            fontStyle: 'bold'
        });
        enemiesTitle.setOrigin(0.5);
        enemiesTitle.setDepth(2002);
        this.summaryElements.push(enemiesTitle);
        
        yPos += 30;

        this.defeatedEnemies.forEach((enemy, index) => {
            const enemyText = this.scene.add.text(640, yPos, `• ${this.getEnemyDisplayName(enemy.type)}`, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff'
            });
            enemyText.setOrigin(0.5);
            enemyText.setDepth(2002);
            this.summaryElements.push(enemyText);
            yPos += 25;
        });

        yPos += 20;

        // Experiencia ganada
        const expText = this.scene.add.text(640, yPos, `Experiencia Ganada: +${this.experienceGained} XP`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#00ffff',
            fontStyle: 'bold'
        });
        expText.setOrigin(0.5);
        expText.setDepth(2002);
        this.summaryElements.push(expText);

        yPos += 30;

        // Nivel actual
        const levelText = this.scene.add.text(640, yPos, `Nivel Actual: ${this.player.level}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        levelText.setOrigin(0.5);
        levelText.setDepth(2002);
        this.summaryElements.push(levelText);

        yPos += 25;

        // Experiencia total
        const totalExpText = this.scene.add.text(640, yPos, `Experiencia Total: ${this.player.experience} XP`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#cccccc'
        });
        totalExpText.setOrigin(0.5);
        totalExpText.setDepth(2002);
        this.summaryElements.push(totalExpText);

        yPos += 30;

        // Mostrar drops si existen
        if (this.drops) {
            this.addDropsSection(yPos);
            yPos += this.calculateDropsSectionHeight() + 20;
        } else {
            yPos += 10;
        }

        // Botón de continuar
        const continueButton = this.scene.add.rectangle(640, yPos, 200, 40, 0x006600, 1);
        continueButton.setDepth(2002);
        continueButton.setStrokeStyle(2, 0x00ff00);
        continueButton.setInteractive();
        this.summaryElements.push(continueButton);

        const continueText = this.scene.add.text(640, yPos, 'Continuar', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        continueText.setOrigin(0.5);
        continueText.setDepth(2003);
        this.summaryElements.push(continueText);

        // Eventos del botón
        continueButton.on('pointerover', () => {
            continueButton.setFillStyle(0x008800);
        });

        continueButton.on('pointerout', () => {
            continueButton.setFillStyle(0x006600);
        });

        continueButton.on('pointerdown', () => {
            this.closeSummary();
        });

        // También permitir cerrar con ESPACIO
        this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.spaceKeyHandler = () => {
            this.closeSummary();
        };
        this.spaceKey.on('down', this.spaceKeyHandler);

        // Efecto de aparición
        this.summaryElements.forEach(element => {
            element.setAlpha(0);
            this.scene.tweens.add({
                targets: element,
                alpha: element.alpha || 1,
                duration: 500,
                ease: 'Power2'
            });
        });
    }

    getEnemyDisplayName(type) {
        switch (type) {
            case 'basic':
                return 'Goblin Básico';
            case 'strong':
                return 'Orco Fuerte';
            case 'fast':
                return 'Esqueleto Rápido';
            default:
                return 'Enemigo Desconocido';
        }
    }

    // Agregar sección de drops al resumen
    addDropsSection(startY) {
        let yPos = startY;

        // Título de drops
        const dropsTitle = this.scene.add.text(640, yPos, 'Botín Obtenido:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffaa00',
            fontStyle: 'bold'
        });
        dropsTitle.setOrigin(0.5);
        dropsTitle.setDepth(2002);
        this.summaryElements.push(dropsTitle);
        yPos += 25;

        // Mostrar prospección del jugador
        const prospection = this.player.getProspection();
        const prospectionText = this.scene.add.text(640, yPos, `Prospección: ${prospection}%`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        });
        prospectionText.setOrigin(0.5);
        prospectionText.setDepth(2002);
        this.summaryElements.push(prospectionText);
        yPos += 20;

        // Mostrar dinero obtenido
        if (this.drops.kamas > 0) {
            const kamasText = this.scene.add.text(640, yPos, `💰 +${this.drops.kamas} Kamas`, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffff00'
            });
            kamasText.setOrigin(0.5);
            kamasText.setDepth(2002);
            this.summaryElements.push(kamasText);
            yPos += 20;
        }

        // Mostrar items obtenidos
        if (this.drops.items && this.drops.items.length > 0) {
            this.drops.items.forEach(item => {
                const itemColor = this.getItemRarityColor(item.rarity);
                const itemText = this.scene.add.text(640, yPos, `📦 ${item.name}`, {
                    fontSize: '14px',
                    fontFamily: 'Arial',
                    color: itemColor
                });
                itemText.setOrigin(0.5);
                itemText.setDepth(2002);
                this.summaryElements.push(itemText);
                yPos += 20;
            });
        }

        // Si no hay drops
        if (this.drops.kamas === 0 && (!this.drops.items || this.drops.items.length === 0)) {
            const noDropsText = this.scene.add.text(640, yPos, 'No se obtuvo botín', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#888888'
            });
            noDropsText.setOrigin(0.5);
            noDropsText.setDepth(2002);
            this.summaryElements.push(noDropsText);
        }
    }

    // Calcular altura de la sección de drops
    calculateDropsSectionHeight() {
        if (!this.drops) return 0;

        let height = 45; // Título + prospección

        if (this.drops.kamas > 0) height += 20;
        if (this.drops.items && this.drops.items.length > 0) {
            height += this.drops.items.length * 20;
        }
        if (this.drops.kamas === 0 && (!this.drops.items || this.drops.items.length === 0)) {
            height += 20; // "No se obtuvo botín"
        }

        return height;
    }

    // Obtener color según rareza del item
    getItemRarityColor(rarity) {
        switch (rarity) {
            case 'common': return '#ffffff';
            case 'uncommon': return '#00ff00';
            case 'rare': return '#0088ff';
            case 'epic': return '#aa00ff';
            case 'legendary': return '#ff8800';
            default: return '#ffffff';
        }
    }

    closeSummary() {
        if (!this.isVisible) return;

        // Efecto de desaparición
        this.scene.tweens.add({
            targets: this.summaryElements,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Destruir elementos
                this.summaryElements.forEach(element => {
                    if (element && element.destroy) {
                        element.destroy();
                    }
                });
                this.summaryElements = [];
                this.isVisible = false;

                // Limpiar evento de teclado
                if (this.spaceKey && this.spaceKeyHandler) {
                    this.spaceKey.off('down', this.spaceKeyHandler);
                }

                // Volver al mapa de exploración
                this.returnToExploration();
            }
        });
    }

    async returnToExploration() {
        console.log('Volviendo al mapa de exploración...');

        // Limpiar cualquier UI existente antes de cambiar de escena
        this.clearSummary();

        // Crear mensaje de guardado
        const saveMessage = this.scene.add.text(640, 360, 'Guardando progreso...', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#00ff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        });
        saveMessage.setOrigin(0.5);
        saveMessage.setDepth(3000);

        try {
            // Guardar progreso en el backend
            await this.saveProgressToBackend();

            // Actualizar mensaje
            saveMessage.setText('✅ Progreso guardado');

            console.log(`✅ Progreso guardado en backend: Nivel ${this.player.level}, XP: ${this.player.experience}`);
        } catch (error) {
            console.error('❌ Error guardando progreso:', error);

            // Intentar guardar con datos actualizados del registro
            try {
                await this.saveProgressFromRegistry();
                saveMessage.setText('✅ Progreso guardado (datos actualizados)');
            } catch (fallbackError) {
                console.error('❌ Error en fallback:', fallbackError);
                saveMessage.setText('⚠️ Error guardando (usando datos locales)');
                // Fallback: guardar localmente
                this.saveProgressLocally();
            }
        }

        // Después de 1.5 segundos, cambiar a la escena de exploración
        this.scene.time.delayedCall(1500, () => {
            // Limpiar mensaje de guardado
            saveMessage.destroy();

            // Pasar datos del usuario para mantener la sesión
            const userData = this.scene.registry.get('userData');
            const characterId = this.scene.registry.get('currentCharacterId');

            // Cambiar a la escena de exploración
            this.scene.scene.start('ExplorationMapRefactored', {
                userData: userData,
                characterId: characterId,
                comingFromCombat: true // Indicar que viene del combate
            });
        });
    }

    async saveProgressToBackend() {
        const userData = this.scene.registry.get('userData');
        const characterId = this.scene.registry.get('currentCharacterId');

        if (!userData || !characterId) {
            throw new Error('No hay datos de usuario o personaje');
        }

        // Importar API client dinámicamente
        const { apiClient } = await import('../utils/ApiClient.js');

        const gameData = {
            level: this.player.level,
            experience: this.player.experience,
            stats: {
                hp: {
                    current: this.player.currentHP,
                    max: this.player.maxHP
                },
                attack: this.player.attack,
                defense: this.player.defense
            },
            position: {
                x: this.player.gridX,
                y: this.player.gridY
            },
            // Datos de dinero e inventario
            kamas: this.player.kamas,
            inventory: this.player.inventory,
            characteristics: this.player.characteristics,
            // ¡CRÍTICO! Incluir puntos de capital y hechizo
            capitalPoints: this.player.capitalPoints,
            spellPoints: this.player.spellPoints,
            // Incluir resistencias y bonos de daño si existen
            resistances: this.player.resistances,
            damageBonus: this.player.damageBonus,
            // Marcar que viene de combate para indicar ganancia de experiencia
            combatResult: 'victory',
            enemiesDefeated: this.defeatedEnemies.length,
            dropsObtained: this.drops
        };

        await apiClient.saveProgress(characterId, gameData);
    }

    async saveProgressFromRegistry() {
        const userData = this.scene.registry.get('userData');
        const characterId = this.scene.registry.get('currentCharacterId');
        const playerData = this.scene.registry.get('playerData');

        if (!userData || !characterId || !playerData) {
            throw new Error('No hay datos actualizados en el registro');
        }

        // Importar API client dinámicamente
        const { apiClient } = await import('../utils/ApiClient.js');

        const gameData = {
            level: playerData.level,
            experience: playerData.experience,
            stats: {
                hp: {
                    current: playerData.currentHP,
                    max: playerData.maxHP
                },
                attack: playerData.attack,
                defense: playerData.defense
            },
            position: {
                x: playerData.gridX,
                y: playerData.gridY
            },
            // Datos de dinero e inventario desde el registro actualizado
            kamas: playerData.kamas,
            inventory: playerData.inventory,
            // ¡CRÍTICO! Incluir características y puntos desde el registro
            characteristics: playerData.characteristics,
            capitalPoints: playerData.capitalPoints,
            spellPoints: playerData.spellPoints,
            resistances: playerData.resistances,
            damageBonus: playerData.damageBonus,
            // Marcar que viene de combate para indicar ganancia de experiencia
            combatResult: 'victory',
            enemiesDefeated: this.defeatedEnemies.length,
            dropsObtained: this.drops
        };

        await apiClient.saveProgress(characterId, gameData);
    }

    saveProgressLocally() {
        // Fallback: guardar estado actualizado del jugador localmente
        this.scene.registry.set('playerData', {
            gridX: this.player.gridX,
            gridY: this.player.gridY,
            currentHP: this.player.currentHP,
            maxHP: this.player.maxHP,
            level: this.player.level,
            experience: this.player.experience,
            playerClass: this.player.playerClass,
            attack: this.player.attack,
            defense: this.player.defense,
            kamas: this.player.kamas,
            inventory: this.player.inventory,
            // ¡CRÍTICO! Incluir características y puntos en el fallback local
            characteristics: this.player.characteristics,
            capitalPoints: this.player.capitalPoints,
            spellPoints: this.player.spellPoints,
            resistances: this.player.resistances,
            damageBonus: this.player.damageBonus
        });
    }

    // Calcular experiencia ganada basada en enemigos derrotados
    static calculateExperience(defeatedEnemies) {
        let totalExp = 0;
        
        defeatedEnemies.forEach(enemy => {
            switch (enemy.type) {
                case 'basic':
                    totalExp += 50;
                    break;
                case 'strong':
                    totalExp += 100;
                    break;
                case 'fast':
                    totalExp += 75;
                    break;
                default:
                    totalExp += 25;
            }
        });

        return totalExp;
    }

    // Verificar si el jugador sube de nivel
    // NOTA: Esta función está deshabilitada porque el level up ahora se maneja en el backend
    // que otorga correctamente puntos de capital y hechizo
    static checkLevelUp(player, experienceGained) {
        // Solo actualizar experiencia localmente, el backend manejará el level up
        player.experience += experienceGained;

        console.log(`Experiencia ganada: +${experienceGained} (Total: ${player.experience})`);
        console.log('⚠️ Level up será procesado por el backend al guardar progreso');

        return false; // No procesar level up aquí
    }

    // Limpiar resumen de combate
    clearSummary() {
        if (!this.isVisible) return;

        console.log('🧹 Iniciando limpieza de UI de combate...');

        // Limpiar todos los elementos del resumen
        this.summaryElements.forEach(element => {
            if (element && element.destroy) {
                element.destroy();
            }
        });

        // Limpiar también cualquier elemento de UI que pueda haber quedado
        if (this.scene && this.scene.children) {
            const uiElements = this.scene.children.list.filter(child => {
                // Limpiar elementos con depth alto (UI) pero preservar elementos importantes
                const isUIElement = child.depth >= 2000;
                const isNotGraphics = child.type !== 'Graphics';
                const isNotPlayer = child !== this.scene.player;
                const isNotGrid = !child.isGridElement; // Preservar elementos del grid
                const isNotMonster = !child.isMonster; // Preservar monstruos

                return isUIElement && isNotGraphics && isNotPlayer && isNotGrid && isNotMonster;
            });

            console.log(`🧹 Limpiando ${uiElements.length} elementos de UI restantes`);

            uiElements.forEach(element => {
                if (element && element.destroy) {
                    try {
                        element.destroy();
                    } catch (error) {
                        console.warn('Error limpiando elemento:', error);
                    }
                }
            });
        }

        // Limpiar específicamente elementos de texto que puedan haber quedado
        if (this.scene && this.scene.children) {
            const textElements = this.scene.children.list.filter(child =>
                child.type === 'Text' &&
                child.depth >= 1000 &&
                child !== this.scene.player
            );

            if (textElements.length > 0) {
                console.log(`🧹 Limpiando ${textElements.length} elementos de texto adicionales`);
                textElements.forEach(element => {
                    if (element && element.destroy) {
                        try {
                            element.destroy();
                        } catch (error) {
                            console.warn('Error limpiando texto:', error);
                        }
                    }
                });
            }
        }

        this.summaryElements = [];
        this.isVisible = false;

        console.log('🧹 UI de combate limpiada completamente');
    }
}
