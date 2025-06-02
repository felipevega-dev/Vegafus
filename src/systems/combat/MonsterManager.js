/**
 * Sistema para gestionar monstruos en el mapa de exploración
 */
export class MonsterManager {
    constructor(scene, grid, player) {
        this.scene = scene;
        this.grid = grid;
        this.player = player;
        this.monsters = [];
        this.monsterTypes = ['basic', 'strong', 'fast'];
        this.interactionUI = [];
        this.interactionMode = false;
    }

    spawnRandomMonsters(count = 8) {
        this.clearExistingMonsters();
        
        for (let i = 0; i < count; i++) {
            // Encontrar posición aleatoria válida
            let x, y;
            let attempts = 0;
            
            do {
                x = Phaser.Math.Between(2, 27);
                y = Phaser.Math.Between(2, 17);
                attempts++;
            } while ((!this.grid.isWalkable(x, y) || this.grid.cells[y][x].occupied || 
                     this.grid.getDistance(x, y, this.player.gridX, this.player.gridY) < 3) && 
                     attempts < 50);
            
            if (attempts < 50) {
                const monsterType = this.monsterTypes[i % this.monsterTypes.length];
                const monster = this.createMonster(x, y, monsterType);
                this.monsters.push(monster);
            }
        }
    }

    createMonster(gridX, gridY, type) {
        const worldPos = this.grid.gridToWorld(gridX, gridY);
        
        // Crear sprite del monstruo
        const sprite = this.scene.add.sprite(worldPos.x, worldPos.y, 'enemy');
        sprite.setDepth(100);
        sprite.setInteractive();
        
        // Color según tipo
        const colors = {
            'basic': 0xff6666,
            'strong': 0xff3333,
            'fast': 0xffaa66
        };
        sprite.setTint(colors[type] || 0xff6666);
        
        // Ocupar celda
        this.grid.setOccupied(gridX, gridY, { type: 'monster' });
        
        // Evento de clic en monstruo
        sprite.on('pointerdown', () => {
            this.showMonsterInteraction(gridX, gridY, type);
        });
        
        return {
            sprite,
            gridX,
            gridY,
            type,
            isAlive: true
        };
    }

    showMonsterInteraction(gridX, gridY, monsterType) {
        // Limpiar interacciones previas
        this.clearInteractionUI();
        
        const worldPos = this.grid.gridToWorld(gridX, gridY);
        
        // Panel de interacción
        const panel = this.scene.add.rectangle(worldPos.x, worldPos.y - 60, 120, 80, 0x000000, 0.8);
        panel.setDepth(200);
        
        // Botón de atacar
        const attackButton = this.scene.add.text(worldPos.x, worldPos.y - 80, 'ATACAR', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ff0000',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        attackButton.setOrigin(0.5);
        attackButton.setDepth(201);
        attackButton.setInteractive();
        
        // Botón de huir
        const fleeButton = this.scene.add.text(worldPos.x, worldPos.y - 50, 'HUIR', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#ffff00',
            backgroundColor: '#333333',
            padding: { x: 8, y: 4 }
        });
        fleeButton.setOrigin(0.5);
        fleeButton.setDepth(201);
        fleeButton.setInteractive();
        
        // Eventos
        attackButton.on('pointerdown', () => {
            this.startCombat(monsterType);
        });
        
        fleeButton.on('pointerdown', () => {
            this.clearInteractionUI();
        });
        
        // Guardar referencias para limpiar
        this.interactionUI = [panel, attackButton, fleeButton];
        this.interactionMode = true;
    }

    clearInteractionUI() {
        if (this.interactionUI) {
            this.interactionUI.forEach(element => {
                if (element && element.destroy) {
                    element.destroy();
                }
            });
            this.interactionUI = [];
        }
        this.interactionMode = false;
    }

    startCombat(monsterType) {
        console.log(`Iniciando combate contra: ${monsterType}`);

        // Guardar estado completo del jugador
        this.scene.registry.set('playerData', {
            gridX: this.player.gridX,
            gridY: this.player.gridY,
            currentHP: this.player.currentHP,
            maxHP: this.player.maxHP,
            level: this.player.level,
            experience: this.player.experience,
            playerClass: this.player.playerClass,
            attack: this.player.attack,
            defense: this.player.defense
        });

        // Cambiar a escena de combate
        this.scene.scene.start('IsometricMap');
    }

    clearExistingMonsters() {
        // Limpiar monstruos existentes
        if (this.monsters) {
            this.monsters.forEach(monster => {
                if (monster.sprite && monster.sprite.destroy) {
                    monster.sprite.destroy();
                }
                // Liberar celda ocupada
                if (monster.gridX !== undefined && monster.gridY !== undefined) {
                    this.grid.setFree(monster.gridX, monster.gridY);
                }
            });
        }
        this.monsters = [];
    }

    isInInteractionMode() {
        return this.interactionMode;
    }

    destroy() {
        this.clearExistingMonsters();
        this.clearInteractionUI();
    }
}
