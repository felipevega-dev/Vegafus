export class Enemy {
    constructor(scene, gridX, gridY, type = 'basic') {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = type;

        // Atributos del enemigo según el tipo
        this.setAttributesByType(type);

        // Estado del enemigo
        this.isAlive = true;
        this.isEnemyTurn = false;

        // Crear sprite del enemigo
        this.createSprite();
    }

    setAttributesByType(type) {
        switch (type) {
            case 'basic':
                this.maxHP = 60;
                this.currentHP = 60;
                this.attack = 15;
                this.defense = 5;
                this.maxActionPoints = 4;
                this.maxMovementPoints = 2;
                this.spriteKey = 'character'; // Por ahora usamos el mismo sprite
                this.tint = 0xff0000; // Rojo para diferenciarlo
                break;
            case 'strong':
                this.maxHP = 100;
                this.currentHP = 100;
                this.attack = 25;
                this.defense = 10;
                this.maxActionPoints = 5;
                this.maxMovementPoints = 1;
                this.spriteKey = 'character';
                this.tint = 0x800080; // Púrpura
                break;
            case 'fast':
                this.maxHP = 40;
                this.currentHP = 40;
                this.attack = 12;
                this.defense = 3;
                this.maxActionPoints = 6;
                this.maxMovementPoints = 4;
                this.spriteKey = 'character';
                this.tint = 0x00ff00; // Verde
                break;
        }

        this.currentActionPoints = this.maxActionPoints;
        this.currentMovementPoints = this.maxMovementPoints;
    }

    createSprite() {
        // Convertir posición de grid a coordenadas de mundo
        const worldPos = this.scene.grid.gridToWorld(this.gridX, this.gridY);

        // Crear sprite en la posición correcta
        this.sprite = this.scene.add.sprite(
            worldPos.x,
            worldPos.y,
            this.spriteKey
        );

        // Aplicar tinte para diferenciarlo del jugador
        this.sprite.setTint(this.tint);

        // Configurar profundidad para renderizado correcto
        this.sprite.setDepth(100);

        // Marcar la celda como ocupada
        this.scene.grid.setOccupied(this.gridX, this.gridY, this);

        // Hacer el sprite interactivo
        this.sprite.setInteractive();

        // Añadir barra de vida
        this.createHealthBar();
    }

    createHealthBar() {
        // Crear barra de vida sobre el enemigo
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
            0xff0000 // Roja para enemigos
        );
        this.healthBar.setDepth(this.sprite.depth + 2);
    }

    // Mover el enemigo
    moveTo(newGridX, newGridY) {
        if (!this.scene.grid.isWalkable(newGridX, newGridY)) {
            return false;
        }

        // Calcular costo de movimiento
        const distance = this.scene.grid.getDistance(this.gridX, this.gridY, newGridX, newGridY);

        if (distance > this.currentMovementPoints) {
            return false;
        }

        // Liberar celda anterior
        this.scene.grid.setFree(this.gridX, this.gridY);

        // Actualizar posición
        this.gridX = newGridX;
        this.gridY = newGridY;

        // Ocupar nueva celda
        this.scene.grid.setOccupied(this.gridX, this.gridY, this);

        // Mover sprite
        const worldPos = this.scene.grid.gridToWorld(this.gridX, this.gridY);
        this.sprite.setPosition(worldPos.x, worldPos.y);
        this.sprite.setDepth(100);

        // Mover barra de vida
        this.healthBarBg.setPosition(this.sprite.x, this.sprite.y - 40);
        this.healthBar.setPosition(this.sprite.x, this.sprite.y - 40);

        // Reducir puntos de movimiento
        this.currentMovementPoints -= distance;

        return true;
    }

    // Atacar al jugador
    attackPlayer(target) {
        if (this.currentActionPoints < 3) {
            return false;
        }

        // Calcular distancia al objetivo
        const distance = this.scene.grid.getDistance(
            this.gridX, this.gridY,
            target.gridX, target.gridY
        );

        if (distance > 1) {
            return false;
        }

        // Calcular daño
        const damage = Math.max(1, this.attack - target.defense + Phaser.Math.Between(-3, 3));

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
    }

    // Mostrar efecto de ataque
    showAttackEffect(target) {
        const line = this.scene.add.line(
            0, 0,
            this.sprite.x, this.sprite.y,
            target.sprite.x, target.sprite.y,
            0xff0000, 1
        );
        line.setDepth(1000);

        this.scene.time.delayedCall(200, () => {
            line.destroy();
        });
    }

    // Mostrar efecto de daño
    showDamageEffect(damage) {
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

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                damageText.destroy();
            }
        });

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
        this.sprite.setTint(0x333333);

        // Liberar celda
        this.scene.grid.setFree(this.gridX, this.gridY);

        // Registrar muerte en el sistema de turnos
        if (this.scene.turnManager) {
            this.scene.turnManager.registerDefeatedEnemy(this);
        }

        // Dar recompensa al jugador
        console.log(`¡${this.getDisplayName()} derrotado!`);
    }

    // Obtener nombre para mostrar
    getDisplayName() {
        switch (this.type) {
            case 'basic':
                return 'Goblin Básico';
            case 'strong':
                return 'Orco Fuerte';
            case 'fast':
                return 'Esqueleto Rápido';
            default:
                return 'Enemigo';
        }
    }

    // IA básica del enemigo
    performAI(player) {
        if (!this.isAlive) return;

        // Calcular distancia al jugador
        const distanceToPlayer = this.scene.grid.getDistance(
            this.gridX, this.gridY,
            player.gridX, player.gridY
        );

        // Si está al lado del jugador, atacar
        if (distanceToPlayer === 1 && this.currentActionPoints >= 3) {
            this.attackPlayer(player);
            return;
        }

        // Si no, intentar acercarse al jugador
        if (this.currentMovementPoints > 0) {
            const moveTarget = this.findBestMoveTowardsPlayer(player);
            if (moveTarget) {
                this.moveTo(moveTarget.x, moveTarget.y);
            }
        }

        // Si después del movimiento está al lado, atacar
        const newDistance = this.scene.grid.getDistance(
            this.gridX, this.gridY,
            player.gridX, player.gridY
        );

        if (newDistance === 1 && this.currentActionPoints >= 3) {
            this.attackPlayer(player);
        }
    }

    // Encontrar la mejor celda para moverse hacia el jugador
    findBestMoveTowardsPlayer(player) {
        const possibleMoves = this.scene.grid.getCellsInRange(
            this.gridX,
            this.gridY,
            this.currentMovementPoints
        );

        let bestMove = null;
        let bestDistance = Infinity;

        for (const move of possibleMoves) {
            const distance = this.scene.grid.getDistance(
                move.x, move.y,
                player.gridX, player.gridY
            );

            if (distance < bestDistance) {
                bestDistance = distance;
                bestMove = move;
            }
        }

        return bestMove;
    }

    // Iniciar turno
    startTurn() {
        this.isEnemyTurn = true;
        this.currentActionPoints = this.maxActionPoints;
        this.currentMovementPoints = this.maxMovementPoints;

        // Efecto visual de turno activo
        this.sprite.setTint(this.tint * 0.8); // Más oscuro
    }

    // Terminar turno
    endTurn() {
        this.isEnemyTurn = false;
        this.sprite.setTint(this.tint); // Color normal
    }
}