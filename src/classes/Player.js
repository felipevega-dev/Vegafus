export class Player {
    constructor(scene, gridX, gridY) {
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;

        // Atributos del jugador
        this.maxHP = 100;
        this.currentHP = 100;
        this.maxMP = 50;
        this.currentMP = 50;
        this.attack = 20;
        this.defense = 10;
        this.level = 1;
        this.experience = 0;

        // Puntos de acción por turno
        this.maxActionPoints = 6;
        this.currentActionPoints = 6;
        this.maxMovementPoints = 3;
        this.currentMovementPoints = 3;

        // Estado del jugador
        this.isAlive = true;
        this.isPlayerTurn = false;

        // Crear sprite del jugador
        this.createSprite();
    }

    createSprite() {
        // Convertir posición de grid a coordenadas isométricas
        const isoPos = this.scene.grid.gridToIso(this.gridX, this.gridY);

        // Crear sprite en la posición correcta (ajustado al centro del mapa)
        this.sprite = this.scene.add.sprite(
            640 + isoPos.x,
            300 + isoPos.y,
            'character'
        );

        // Configurar profundidad para renderizado correcto
        this.sprite.setDepth(300 + isoPos.y + 1);

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

    // Mover el jugador a una nueva posición
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
        const isoPos = this.scene.grid.gridToIso(this.gridX, this.gridY);
        this.sprite.setPosition(640 + isoPos.x, 300 + isoPos.y);
        this.sprite.setDepth(300 + isoPos.y + 1);

        // Mover barra de vida
        this.healthBarBg.setPosition(this.sprite.x, this.sprite.y - 40);
        this.healthBar.setPosition(this.sprite.x, this.sprite.y - 40);

        // Reducir puntos de movimiento
        this.currentMovementPoints -= distance;

        return true;
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

    // Obtener celdas de movimiento válidas
    getValidMoveCells() {
        return this.scene.grid.getCellsInRange(
            this.gridX,
            this.gridY,
            this.currentMovementPoints
        );
    }
}