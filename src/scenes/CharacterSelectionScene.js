export class CharacterSelectionScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectionScene' });
    }

    init(data) {
        this.userData = data.userData;
        this.characters = [];
        this.selectedCharacter = null;
    }

    create() {
        console.log('🎭 Iniciando selección de personajes');

        // Fondo
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // Título principal
        this.add.text(640, 80, 'SELECCIONAR PERSONAJE', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Información del usuario
        this.add.text(640, 120, `Bienvenido, ${this.userData.username}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);

        // Cargar personajes del usuario
        this.loadCharacters();

        // Crear UI
        this.createUI();
    }

    async loadCharacters() {
        try {
            const { apiClient } = await import('../utils/ApiClient.js');
            
            console.log('📡 Cargando personajes del usuario...');
            
            const response = await fetch('http://localhost:3000/api/characters', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.characters = data.characters || [];
                
                console.log(`✅ ${this.characters.length} personajes cargados`);
                
                // Actualizar la galería
                this.updateCharacterGallery();
            } else {
                console.error('❌ Error cargando personajes:', response.status);
                this.characters = [];
                this.updateCharacterGallery();
            }

        } catch (error) {
            console.error('❌ Error cargando personajes:', error);
            this.characters = [];
            this.updateCharacterGallery();
        }
    }

    createUI() {
        // Panel principal
        const mainPanel = this.add.rectangle(640, 400, 1000, 500, 0x2a2a2a, 0.9);
        mainPanel.setStrokeStyle(3, 0x444444);

        // Título de la galería
        this.add.text(640, 180, 'TUS PERSONAJES', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Área de personajes (se llenará dinámicamente)
        this.characterSlots = [];
        this.createCharacterSlots();

        // Botones principales
        this.createMainButtons();
    }

    createCharacterSlots() {
        const slotsPerRow = 5;
        const slotWidth = 160;
        const slotHeight = 200;
        const startX = 640 - (slotsPerRow * slotWidth) / 2 + slotWidth / 2;
        const startY = 300;

        for (let i = 0; i < 5; i++) { // Máximo 5 personajes
            const x = startX + (i * slotWidth);
            const y = startY;

            // Slot del personaje
            const slot = this.add.rectangle(x, y, slotWidth - 10, slotHeight - 10, 0x333333, 0.8);
            slot.setStrokeStyle(2, 0x555555);
            slot.setInteractive();

            // Contenedor para información del personaje
            const slotData = {
                slot: slot,
                x: x,
                y: y,
                index: i,
                character: null,
                elements: []
            };

            this.characterSlots.push(slotData);

            // Evento de clic en slot
            slot.on('pointerdown', () => this.handleSlotClick(slotData));
        }
    }

    updateCharacterGallery() {
        // Limpiar elementos anteriores
        this.characterSlots.forEach(slotData => {
            slotData.elements.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            slotData.elements = [];
            slotData.character = null;
        });

        // Llenar slots con personajes
        this.characters.forEach((character, index) => {
            if (index < 5) { // Máximo 5 personajes
                this.fillCharacterSlot(this.characterSlots[index], character);
            }
        });

        // Marcar slots vacíos
        for (let i = this.characters.length; i < 5; i++) {
            this.fillEmptySlot(this.characterSlots[i]);
        }
    }

    fillCharacterSlot(slotData, character) {
        slotData.character = character;

        // Color del borde según la clase
        const classColors = {
            'warrior': 0xff6666,
            'mage': 0x6666ff,
            'archer': 0x66ff66
        };
        slotData.slot.setStrokeStyle(3, classColors[character.class] || 0x555555);

        // Icono de la clase
        const classIcons = {
            'warrior': '⚔️',
            'mage': '🔮',
            'archer': '🏹'
        };

        const classIcon = this.add.text(slotData.x, slotData.y - 60, classIcons[character.class] || '❓', {
            fontSize: '32px',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        slotData.elements.push(classIcon);

        // Nombre del personaje
        const nameText = this.add.text(slotData.x, slotData.y - 20, character.name, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        slotData.elements.push(nameText);

        // Clase del personaje
        const classText = this.add.text(slotData.x, slotData.y, character.class.toUpperCase(), {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: classColors[character.class] ? '#ffffff' : '#cccccc'
        }).setOrigin(0.5);
        slotData.elements.push(classText);

        // Nivel
        const levelText = this.add.text(slotData.x, slotData.y + 20, `Nivel ${character.level}`, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00'
        }).setOrigin(0.5);
        slotData.elements.push(levelText);

        // Última conexión
        const lastPlayed = new Date(character.gameStats?.lastSaved || character.updatedAt);
        const timeAgo = this.getTimeAgo(lastPlayed);
        const lastPlayedText = this.add.text(slotData.x, slotData.y + 40, timeAgo, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#999999'
        }).setOrigin(0.5);
        slotData.elements.push(lastPlayedText);
    }

    fillEmptySlot(slotData) {
        slotData.character = null;
        slotData.slot.setStrokeStyle(2, 0x555555);

        // Icono de crear personaje
        const createIcon = this.add.text(slotData.x, slotData.y - 20, '➕', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#666666'
        }).setOrigin(0.5);
        slotData.elements.push(createIcon);

        // Texto de crear
        const createText = this.add.text(slotData.x, slotData.y + 20, 'CREAR\nPERSONAJE', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#666666',
            align: 'center'
        }).setOrigin(0.5);
        slotData.elements.push(createText);
    }

    handleSlotClick(slotData) {
        if (slotData.character) {
            // Seleccionar personaje existente
            this.selectCharacter(slotData);
        } else {
            // Crear nuevo personaje
            this.openCharacterCreation();
        }
    }

    selectCharacter(slotData) {
        // Deseleccionar anterior
        if (this.selectedCharacter) {
            this.selectedCharacter.slot.setStrokeStyle(3, this.getClassColor(this.selectedCharacter.character.class));
        }

        // Seleccionar nuevo
        this.selectedCharacter = slotData;
        slotData.slot.setStrokeStyle(4, 0xffff00); // Borde amarillo para selección

        console.log(`🎭 Personaje seleccionado: ${slotData.character.name}`);

        // Habilitar botón de jugar
        if (this.playButton) {
            this.playButton.setAlpha(1);
            this.playButton.setInteractive();
        }
    }

    createMainButtons() {
        // Botón JUGAR (inicialmente deshabilitado)
        this.playButton = this.add.text(540, 580, 'JUGAR', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#006600',
            padding: { x: 30, y: 15 }
        });
        this.playButton.setOrigin(0.5);
        this.playButton.setAlpha(0.5); // Deshabilitado inicialmente
        this.playButton.on('pointerdown', () => this.startGame());

        // Botón CREAR PERSONAJE
        const createButton = this.add.text(740, 580, 'CREAR PERSONAJE', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#0066cc',
            padding: { x: 30, y: 15 }
        });
        createButton.setOrigin(0.5);
        createButton.setInteractive();
        createButton.on('pointerdown', () => this.openCharacterCreation());

        // Botón LOGOUT
        const logoutButton = this.add.text(1200, 50, 'LOGOUT', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#cc0000',
            padding: { x: 15, y: 8 }
        });
        logoutButton.setOrigin(0.5);
        logoutButton.setInteractive();
        logoutButton.on('pointerdown', () => this.handleLogout());
    }

    openCharacterCreation() {
        if (this.characters.length >= 5) {
            // Mostrar mensaje de límite alcanzado
            const errorMessage = this.add.text(640, 520, '❌ Máximo 5 personajes por cuenta', {
                fontSize: '18px',
                fontFamily: 'Arial',
                color: '#ff0000',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: { x: 15, y: 8 }
            }).setOrigin(0.5);

            this.time.delayedCall(3000, () => {
                errorMessage.destroy();
            });
            return;
        }

        console.log('🎨 Abriendo creación de personaje');
        
        // Ir a la escena de creación de personajes
        this.scene.start('CharacterCreationScene', {
            userData: this.userData
        });
    }

    startGame() {
        if (!this.selectedCharacter || !this.selectedCharacter.character) {
            console.log('❌ No hay personaje seleccionado');
            return;
        }

        console.log(`🎮 Iniciando juego con: ${this.selectedCharacter.character.name}`);

        // Ir al mapa de exploración con el personaje seleccionado
        this.scene.start('ExplorationMap', {
            userData: this.userData,
            characterId: this.selectedCharacter.character.id
        });
    }

    async handleLogout() {
        try {
            const { apiClient } = await import('../utils/ApiClient.js');
            await apiClient.logout();
            
            console.log('👋 Logout exitoso');
            this.scene.start('AuthSceneHTML');
        } catch (error) {
            console.error('❌ Error en logout:', error);
            this.scene.start('AuthSceneHTML');
        }
    }

    getClassColor(characterClass) {
        const colors = {
            'warrior': 0xff6666,
            'mage': 0x6666ff,
            'archer': 0x66ff66
        };
        return colors[characterClass] || 0x555555;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `${diffDays} días`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas`;
        return `${Math.floor(diffDays / 30)} meses`;
    }
}
