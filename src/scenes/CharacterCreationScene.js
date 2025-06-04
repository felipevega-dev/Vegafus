import { APP_CONFIG, UI_MESSAGES } from '../config/constants.js';

export class CharacterCreationScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterCreationScene' });
    }

    init(data) {
        this.userData = data.userData;
        this.selectedClass = null;
        this.characterName = '';
    }

    create() {
        console.log('🎨 Iniciando creación de personaje');

        // Fondo
        this.add.rectangle(640, 360, 1280, 720, 0x1a1a2e);

        // Título
        this.add.text(640, 80, 'CREAR PERSONAJE', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Crear formulario
        this.createForm();
    }

    createForm() {
        // Panel principal
        const panel = this.add.rectangle(640, 360, 800, 500, 0x2a2a2a, 0.9);
        panel.setStrokeStyle(3, 0x444444);

        // Sección de nombre
        this.createNameSection();

        // Sección de clases
        this.createClassSelection();

        // Botones
        this.createButtons();
    }

    createNameSection() {
        // Título de sección
        this.add.text(640, 180, 'NOMBRE DEL PERSONAJE', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Campo de texto (simulado)
        this.nameInputBg = this.add.rectangle(640, 220, 300, 40, 0x333333);
        this.nameInputBg.setStrokeStyle(2, 0x555555);
        this.nameInputBg.setInteractive();

        this.nameText = this.add.text(640, 220, 'Haz clic para escribir...', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#999999'
        }).setOrigin(0.5);

        // Evento de clic para activar input
        this.nameInputBg.on('pointerdown', () => this.activateNameInput());

        // Instrucciones
        this.add.text(640, 250, 'Mínimo 3 caracteres, máximo 15', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#cccccc'
        }).setOrigin(0.5);
    }

    createClassSelection() {
        // Título de sección
        this.add.text(640, 300, 'SELECCIONA TU CLASE', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Definir clases
        const classes = [
            {
                key: 'warrior',
                name: 'GUERRERO',
                icon: '⚔️',
                color: 0xff6666,
                description: 'Combatiente cuerpo a cuerpo\nAlto daño físico y resistencia',
                spells: ['Golpe Telúrico', 'Llama Ardiente', 'Tormenta Helada', 'Viento Cortante']
            },
            {
                key: 'mage',
                name: 'MAGO',
                icon: '🔮',
                color: 0x6666ff,
                description: 'Maestro de la magia elemental\nHechizos de área y curación',
                spells: ['Terremoto', 'Bola de Fuego', 'Rayo de Hielo', 'Tormenta Eléctrica']
            },
            {
                key: 'archer',
                name: 'ARQUERO',
                icon: '🏹',
                color: 0x66ff66,
                description: 'Combatiente a distancia\nAtaques precisos y movilidad',
                spells: ['Flecha Rocosa', 'Flecha Explosiva', 'Flecha de Hielo', 'Flecha del Viento']
            }
        ];

        this.classSlots = [];

        classes.forEach((classData, index) => {
            const x = 400 + (index * 160);
            const y = 400;

            // Slot de la clase
            const slot = this.add.rectangle(x, y, 140, 180, 0x333333, 0.8);
            slot.setStrokeStyle(2, 0x555555);
            slot.setInteractive();

            // Icono de la clase
            const icon = this.add.text(x, y - 60, classData.icon, {
                fontSize: '32px',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Nombre de la clase
            const name = this.add.text(x, y - 20, classData.name, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Descripción
            const description = this.add.text(x, y + 20, classData.description, {
                fontSize: '10px',
                fontFamily: 'Arial',
                color: '#cccccc',
                align: 'center',
                wordWrap: { width: 130 }
            }).setOrigin(0.5);

            // Evento de clic
            slot.on('pointerdown', () => this.selectClass(classData, slot));

            // Hover effects
            slot.on('pointerover', () => {
                if (this.selectedClass !== classData.key) {
                    slot.setStrokeStyle(3, classData.color);
                }
                this.showClassDetails(classData);
            });

            slot.on('pointerout', () => {
                if (this.selectedClass !== classData.key) {
                    slot.setStrokeStyle(2, 0x555555);
                }
                this.hideClassDetails();
            });

            this.classSlots.push({
                classData,
                slot,
                elements: [icon, name, description]
            });
        });
    }

    selectClass(classData, slot) {
        // Deseleccionar anterior
        this.classSlots.forEach(slotData => {
            if (slotData.classData.key !== classData.key) {
                slotData.slot.setStrokeStyle(2, 0x555555);
            }
        });

        // Seleccionar nueva clase
        this.selectedClass = classData.key;
        slot.setStrokeStyle(4, classData.color);

        console.log(`🎭 Clase seleccionada: ${classData.name}`);

        // Habilitar botón de crear si también hay nombre
        this.updateCreateButton();
    }

    showClassDetails(classData) {
        // Mostrar detalles de la clase en un panel lateral
        if (this.detailsPanel) {
            this.detailsPanel.destroy();
            this.detailsText.destroy();
        }

        this.detailsPanel = this.add.rectangle(900, 400, 200, 150, 0x1a1a1a, 0.9);
        this.detailsPanel.setStrokeStyle(2, classData.color);

        let detailsContent = `${classData.name}\n\n${classData.description}\n\nHechizos:\n`;
        classData.spells.forEach(spell => {
            detailsContent += `• ${spell}\n`;
        });

        this.detailsText = this.add.text(900, 400, detailsContent, {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 180 }
        }).setOrigin(0.5);
    }

    hideClassDetails() {
        if (this.detailsPanel) {
            this.detailsPanel.destroy();
            this.detailsText.destroy();
            this.detailsPanel = null;
            this.detailsText = null;
        }
    }

    activateNameInput() {
        // Simular input de texto usando prompt (temporal)
        const name = prompt('Ingresa el nombre de tu personaje (3-15 caracteres):');
        
        if (name && name.length >= 3 && name.length <= 15) {
            this.characterName = name;
            this.nameText.setText(name);
            this.nameText.setColor('#ffffff');
            this.nameInputBg.setStrokeStyle(2, 0x00ff00);
            
            console.log(`📝 Nombre ingresado: ${name}`);
            this.updateCreateButton();
        } else if (name !== null) {
            // Mostrar error
            const errorMsg = this.add.text(640, 280, '❌ Nombre inválido (3-15 caracteres)', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ff0000'
            }).setOrigin(0.5);

            this.time.delayedCall(3000, () => {
                errorMsg.destroy();
            });
        }
    }

    createButtons() {
        // Botón CREAR (inicialmente deshabilitado)
        this.createButton = this.add.text(540, 580, 'CREAR PERSONAJE', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#006600',
            padding: { x: 20, y: 12 }
        });
        this.createButton.setOrigin(0.5);
        this.createButton.setAlpha(0.5);
        this.createButton.on('pointerdown', () => this.createCharacter());

        // Botón VOLVER
        const backButton = this.add.text(740, 580, 'VOLVER', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#666666',
            padding: { x: 20, y: 12 }
        });
        backButton.setOrigin(0.5);
        backButton.setInteractive();
        backButton.on('pointerdown', () => this.goBack());
    }

    updateCreateButton() {
        if (this.characterName && this.selectedClass) {
            this.createButton.setAlpha(1);
            this.createButton.setInteractive();
        } else {
            this.createButton.setAlpha(0.5);
            this.createButton.removeInteractive();
        }
    }

    async createCharacter() {
        if (!this.characterName || !this.selectedClass) {
            console.log('❌ Faltan datos para crear personaje');
            return;
        }

        try {
            // Mostrar mensaje de creación
            const creatingMsg = this.add.text(640, 520, 'Creando personaje...', {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ffff00'
            }).setOrigin(0.5);

            console.log(`🎨 Creando personaje: ${this.characterName} (${this.selectedClass})`);

            // Usar ApiClient para crear el personaje
            const { apiClient } = await import('../utils/ApiClient.js');
            const response = await apiClient.createCharacter(this.characterName, this.selectedClass);

            creatingMsg.setText('✅ ¡Personaje creado exitosamente!');
            creatingMsg.setColor('#00ff00');

            console.log('✅ Personaje creado:', response.character || response);

            // Volver a la selección de personajes después de 2 segundos
            this.time.delayedCall(2000, () => {
                this.scene.start('CharacterSelectionScene', {
                    userData: this.userData
                });
            });

        } catch (error) {
            console.error('❌ Error creando personaje:', error);
            
            const errorMsg = this.add.text(640, 520, `❌ Error: ${error.message}`, {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ff0000'
            }).setOrigin(0.5);

            this.time.delayedCall(3000, () => {
                errorMsg.destroy();
            });
        }
    }

    goBack() {
        console.log('🔙 Volviendo a selección de personajes');
        this.scene.start('CharacterSelectionScene', {
            userData: this.userData
        });
    }
}
