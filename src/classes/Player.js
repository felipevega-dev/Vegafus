import { SpellLibrary } from './Spell.js';

export class Player {
    constructor(scene, gridX, gridY, playerClass = 'warrior') {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.playerClass = playerClass;

        // Atributos del jugador
        this.maxHP = 100;
        this.currentHP = 100;
        this.attack = 20;
        this.defense = 10;
        this.level = 1;
        this.experience = 0;

        // Sistema de características
        this.characteristics = {
            tierra: 0,
            fuego: 0,
            agua: 0,
            aire: 0,
            vida: 0,
            sabiduria: 0
        };
        this.capitalPoints = 10; // Valor por defecto, se sobrescribirá desde el backend

        // Sistema de dinero e inventario
        this.kamas = 0; // Dinero del juego
        this.inventory = []; // Items del inventario
        this.maxInventorySize = 60; // Tamaño máximo del inventario

        // Sistema de puntos de hechizo (como Dofus)
        this.spellPoints = 0; // Puntos disponibles para subir hechizos (se carga desde backend)

        // Resistencias elementales
        this.resistances = {
            tierra: 0,
            fuego: 0,
            agua: 0,
            aire: 0
        };

        // Bonos de daño (para futuro)
        this.damageBonus = {
            flat: 0,
            spellPercent: 0,
            meleePercent: 0,
            tierraPercent: 0,
            fuegoPercent: 0,
            aguaPercent: 0,
            airePercent: 0
        };

        // Puntos de acción por turno
        this.maxActionPoints = 6;
        this.currentActionPoints = 6;
        this.maxMovementPoints = 3;
        this.currentMovementPoints = 3;

        // Estado del jugador
        this.isAlive = true;
        this.isPlayerTurn = false;

        // Sistema de hechizos
        // Solo cargar hechizos por defecto si no se han cargado desde el backend
        if (!this.spells || this.spells.length === 0) {
            this.spells = this.getSpellsByClass(playerClass);
            console.log('🔮 Hechizos cargados por defecto:', this.spells.length);
        } else {
            console.log('🔮 Hechizos ya cargados desde backend:', this.spells.length);
        }
        this.selectedSpell = null;

        // El inventario ya se inicializó arriba, no duplicar

        // Crear sprite del jugador
        this.createSprite();
    }

    // Obtener hechizos según la clase
    getSpellsByClass(playerClass) {
        switch (playerClass) {
            case 'warrior':
                return SpellLibrary.getWarriorSpells();
            case 'mage':
                return SpellLibrary.getMageSpells();
            case 'archer':
                return SpellLibrary.getArcherSpells();
            default:
                return SpellLibrary.getWarriorSpells();
        }
    }

    createSprite() {
        // Convertir posición de grid a coordenadas de mundo
        const worldPos = this.scene.grid.gridToWorld(this.gridX, this.gridY);

        // Crear sprite en la posición correcta
        this.sprite = this.scene.add.sprite(
            worldPos.x,
            worldPos.y,
            'character'
        );

        // Configurar profundidad para renderizado correcto
        this.sprite.setDepth(100);

        // Marcar la celda como ocupada
        this.scene.grid.setOccupied(this.gridX, this.gridY, this);

        // Hacer el sprite interactivo
        this.sprite.setInteractive();

        // Añadir indicador visual del jugador
        this.createHealthBar();
    }

    createHealthBar() {
        // Crear barra de vida sobre el personaje
        const barWidth = 50;
        const barHeight = 6;

        // Fondo de la barra
        this.healthBarBg = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y - 40,
            barWidth,
            barHeight,
            0x000000
        );
        this.healthBarBg.setDepth(this.sprite.depth + 1);

        // Barra de vida
        this.healthBar = this.scene.add.rectangle(
            this.sprite.x,
            this.sprite.y - 40,
            barWidth,
            barHeight,
            0x00ff00
        );
        this.healthBar.setDepth(this.sprite.depth + 2);
    }

    // Mover el jugador a una nueva posición usando pathfinding
    moveTo(newGridX, newGridY) {
        // Encontrar camino hacia el destino
        const path = this.scene.grid.findPath(
            this.gridX, this.gridY,
            newGridX, newGridY,
            this.currentMovementPoints
        );

        if (!path || path.length === 0) {
            return false;
        }

        // Calcular costo real del movimiento
        const movementCost = path.length - 1; // -1 porque el primer punto es la posición actual

        if (movementCost > this.currentMovementPoints) {
            return false;
        }

        // Ejecutar movimiento animado
        this.executeMovementPath(path, movementCost);

        return true;
    }

    // Ejecutar movimiento a lo largo del camino
    executeMovementPath(path, movementCost) {
        if (path.length <= 1) return;

        // Liberar celda actual
        this.scene.grid.setFree(this.gridX, this.gridY);

        // Actualizar posición lógica al destino final
        const finalPos = path[path.length - 1];
        this.gridX = finalPos.x;
        this.gridY = finalPos.y;

        // Ocupar nueva celda
        this.scene.grid.setOccupied(this.gridX, this.gridY, this);

        // Animar movimiento visual
        this.animateMovement(path, () => {
            // Callback cuando termina la animación
            this.updateHealthBarPosition();
        });

        // Reducir puntos de movimiento
        this.currentMovementPoints -= movementCost;
    }

    // Animar movimiento del sprite a lo largo del camino
    animateMovement(path, onComplete) {
        if (path.length <= 1) {
            if (onComplete) onComplete();
            return;
        }

        let currentIndex = 1; // Empezar desde el segundo punto (el primero es la posición actual)

        const moveToNextPoint = () => {
            if (currentIndex >= path.length) {
                if (onComplete) onComplete();
                return;
            }

            const targetPos = this.scene.grid.gridToWorld(path[currentIndex].x, path[currentIndex].y);

            this.scene.tweens.add({
                targets: this.sprite,
                x: targetPos.x,
                y: targetPos.y,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    currentIndex++;
                    moveToNextPoint();
                }
            });
        };

        moveToNextPoint();
    }

    // Actualizar posición de la barra de vida
    updateHealthBarPosition() {
        this.healthBarBg.setPosition(this.sprite.x, this.sprite.y - 40);
        this.healthBar.setPosition(this.sprite.x, this.sprite.y - 40);
    }

    // Atacar a un enemigo
    attackEnemy(target) {
        if (this.currentActionPoints < 3) {
            return false; // No hay suficientes puntos de acción
        }

        // Calcular distancia al objetivo
        const distance = this.scene.grid.getDistance(
            this.gridX, this.gridY,
            target.gridX, target.gridY
        );

        if (distance > 1) {
            return false; // Objetivo fuera de rango
        }

        // Calcular daño
        const damage = Math.max(1, this.attack - target.defense + Phaser.Math.Between(-5, 5));

        // Aplicar daño
        target.takeDamage(damage);

        // Reducir puntos de acción
        this.currentActionPoints -= 3;

        // Mostrar efecto visual de ataque
        this.showAttackEffect(target);

        return true;
    }

    // Recibir daño
    takeDamage(damage) {
        this.currentHP = Math.max(0, this.currentHP - damage);

        // Actualizar barra de vida
        this.updateHealthBar();

        // Mostrar efecto de daño
        this.showDamageEffect(damage);

        if (this.currentHP <= 0) {
            this.die();
        }
    }

    // Actualizar barra de vida
    updateHealthBar() {
        const healthPercentage = this.currentHP / this.maxHP;
        const barWidth = 50 * healthPercentage;

        this.healthBar.setSize(barWidth, 6);

        // Cambiar color según la vida
        if (healthPercentage > 0.6) {
            this.healthBar.setFillStyle(0x00ff00); // Verde
        } else if (healthPercentage > 0.3) {
            this.healthBar.setFillStyle(0xffff00); // Amarillo
        } else {
            this.healthBar.setFillStyle(0xff0000); // Rojo
        }
    }

    // Mostrar efecto de ataque
    showAttackEffect(target) {
        // Crear línea de ataque temporal
        const line = this.scene.add.line(
            0, 0,
            this.sprite.x, this.sprite.y,
            target.sprite.x, target.sprite.y,
            0xff0000, 1
        );
        line.setDepth(1000);

        // Eliminar después de un momento
        this.scene.time.delayedCall(200, () => {
            line.destroy();
        });
    }

    // Mostrar efecto de daño
    showDamageEffect(damage) {
        // Crear texto de daño
        const damageText = this.scene.add.text(
            this.sprite.x,
            this.sprite.y - 20,
            `-${damage}`,
            {
                fontSize: '16px',
                fontFamily: 'Arial',
                color: '#ff0000',
                fontStyle: 'bold'
            }
        );
        damageText.setOrigin(0.5);
        damageText.setDepth(1000);

        // Animar el texto
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                damageText.destroy();
            }
        });

        // Efecto de parpadeo en el sprite
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 2
        });
    }

    // Morir
    die() {
        this.isAlive = false;
        this.sprite.setTint(0x666666);

        // Liberar celda
        this.scene.grid.setFree(this.gridX, this.gridY);

        console.log('¡El jugador ha muerto!');
    }

    // Iniciar turno
    startTurn() {
        this.isPlayerTurn = true;
        this.currentActionPoints = this.maxActionPoints;
        this.currentMovementPoints = this.maxMovementPoints;

        // Efecto visual de turno activo
        this.sprite.setTint(0xffff00);
    }

    // Terminar turno
    endTurn() {
        this.isPlayerTurn = false;
        this.sprite.clearTint();
    }

    // Lanzar hechizo
    castSpell(spellIndex, targetX, targetY) {
        if (spellIndex < 0 || spellIndex >= this.spells.length) {
            return false;
        }

        const spell = this.spells[spellIndex];
        const success = spell.cast(this, targetX, targetY);

        if (success) {
            // Actualizar barra de maná
            this.updateHealthBar();
        }

        return success;
    }

    // Iniciar turno (actualizado para incluir hechizos)
    startTurn() {
        this.isPlayerTurn = true;
        this.currentActionPoints = this.maxActionPoints;
        this.currentMovementPoints = this.maxMovementPoints;

        // Reducir enfriamiento de hechizos
        this.spells.forEach(spell => spell.reduceCooldown());

        // Efecto visual de turno activo
        this.sprite.setTint(0xffff00);
    }

    // Métodos de inventario
    addItem(item) {
        if (this.inventory.length >= this.maxInventorySize) {
            console.log('Inventario lleno');
            return false;
        }

        // Si el item es stackeable, intentar combinarlo con uno existente
        if (item.stackable) {
            const existingItem = this.inventory.find(invItem =>
                invItem.id === item.id && invItem.quantity < invItem.maxStack
            );

            if (existingItem) {
                existingItem.quantity = Math.min(existingItem.maxStack, existingItem.quantity + 1);
                return true;
            }
        }

        // Agregar como nuevo item
        const newItem = item.clone();
        newItem.quantity = 1;
        this.inventory.push(newItem);
        return true;
    }

    removeItem(itemId, quantity = 1) {
        const itemIndex = this.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return false;

        const item = this.inventory[itemIndex];

        if (item.stackable && item.quantity > quantity) {
            item.quantity -= quantity;
        } else {
            this.inventory.splice(itemIndex, 1);
        }

        return true;
    }

    hasItem(itemId, quantity = 1) {
        const item = this.inventory.find(item => item.id === itemId);
        return item && (!item.stackable || item.quantity >= quantity);
    }

    getItemCount(itemId) {
        const item = this.inventory.find(item => item.id === itemId);
        return item ? (item.stackable ? item.quantity : 1) : 0;
    }

    useItem(itemId) {
        const item = this.inventory.find(item => item.id === itemId);
        if (!item || item.type !== 'consumable') return false;

        const success = item.use(this);
        if (success) {
            this.removeItem(itemId, 1);
        }

        return success;
    }

    // Obtener celdas de movimiento válidas
    getValidMoveCells() {
        return this.scene.grid.getCellsInRange(
            this.gridX,
            this.gridY,
            this.currentMovementPoints
        );
    }

    // Obtener información de hechizos para la UI
    getSpellsInfo() {
        return this.spells.map((spell, index) => ({
            index,
            name: spell.name,
            actionPointCost: spell.actionPointCost,
            range: spell.range,
            description: spell.description,
            element: spell.element,
            baseDamage: spell.baseDamage,
            scaledDamage: spell.getScaledDamage(),
            level: spell.level,
            maxLevel: spell.maxLevel,
            canLevelUp: spell.canLevelUp(),
            canLevelDown: spell.canLevelDown(),
            cooldown: spell.currentCooldown,
            canCast: this.currentActionPoints >= spell.actionPointCost && spell.currentCooldown === 0
        }));
    }

    // Subir nivel de un hechizo
    upgradeSpell(spellIndex) {
        if (spellIndex < 0 || spellIndex >= this.spells.length) {
            return { success: false, message: 'Hechizo no válido' };
        }

        if (this.spellPoints <= 0) {
            return { success: false, message: 'No tienes puntos de hechizo disponibles' };
        }

        const spell = this.spells[spellIndex];
        if (!spell.canLevelUp()) {
            return { success: false, message: 'El hechizo ya está al nivel máximo' };
        }

        spell.levelUp();
        this.spellPoints--;

        console.log(`🔮 ${spell.name} subió a nivel ${spell.level}!`);
        return { success: true, message: `${spell.name} subió a nivel ${spell.level}` };
    }

    // Bajar nivel de un hechizo (recuperar punto)
    downgradeSpell(spellIndex) {
        if (spellIndex < 0 || spellIndex >= this.spells.length) {
            return { success: false, message: 'Hechizo no válido' };
        }

        const spell = this.spells[spellIndex];
        if (!spell.canLevelDown()) {
            return { success: false, message: 'El hechizo ya está al nivel mínimo' };
        }

        spell.levelDown();
        this.spellPoints++;

        console.log(`🔮 ${spell.name} bajó a nivel ${spell.level}. Punto de hechizo recuperado.`);
        return { success: true, message: `${spell.name} bajó a nivel ${spell.level}` };
    }

    // Calcular prospección total
    getProspection() {
        const baseProspection = 100; // Prospección base
        const aguaBonus = Math.floor(this.characteristics.agua / 10); // 1 prospección por cada 10 de agua
        // TODO: Agregar bonus de equipamiento cuando se implemente
        return baseProspection + aguaBonus;
    }

    // Agregar dinero
    addKamas(amount) {
        this.kamas += amount;
        console.log(`💰 +${amount} kamas (Total: ${this.kamas})`);
    }

    // Gastar dinero
    spendKamas(amount) {
        if (this.kamas >= amount) {
            this.kamas -= amount;
            console.log(`💰 -${amount} kamas (Total: ${this.kamas})`);
            return true;
        }
        return false;
    }
}