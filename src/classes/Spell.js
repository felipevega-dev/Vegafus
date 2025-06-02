export class Spell {
    constructor(name, actionPointCost, range, description, effect, cooldown = 0) {
        this.name = name;
        this.actionPointCost = actionPointCost;
        this.range = range;
        this.description = description;
        this.effect = effect; // Función que define el efecto del hechizo
        this.cooldown = cooldown; // Turnos de enfriamiento
        this.currentCooldown = 0;
    }

    // Verificar si el hechizo puede ser usado
    canCast(caster, targetX, targetY) {
        // Verificar puntos de acción
        if (caster.currentActionPoints < this.actionPointCost) {
            return { canCast: false, reason: 'No tienes suficientes puntos de acción' };
        }

        // Verificar enfriamiento
        if (this.currentCooldown > 0) {
            return { canCast: false, reason: `Enfriamiento: ${this.currentCooldown} turnos` };
        }

        // Verificar rango
        const distance = caster.scene.grid.getDistance(caster.gridX, caster.gridY, targetX, targetY);
        if (distance > this.range) {
            return { canCast: false, reason: 'Objetivo fuera de rango' };
        }

        return { canCast: true };
    }

    // Lanzar el hechizo
    cast(caster, targetX, targetY) {
        const canCastResult = this.canCast(caster, targetX, targetY);

        if (!canCastResult.canCast) {
            console.log(canCastResult.reason);
            return false;
        }

        // Consumir puntos de acción
        caster.currentActionPoints -= this.actionPointCost;

        // Activar enfriamiento
        this.currentCooldown = this.cooldown;

        // Ejecutar efecto
        this.effect(caster, targetX, targetY);

        return true;
    }

    // Reducir enfriamiento al final del turno
    reduceCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
}

// Hechizos específicos por raza
export class SpellLibrary {
    static getWarriorSpells() {
        return [
            new Spell(
                'Golpe Poderoso',
                4,
                1,
                'Un ataque devastador que causa daño extra',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const damage = Math.floor(caster.attack * 1.5) + Phaser.Math.Between(-3, 3);
                        target.takeDamage(damage);

                        // Efecto visual especial
                        const effect = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 30, 0xff0000, 0.5
                        );
                        effect.setDepth(1000);

                        caster.scene.time.delayedCall(500, () => {
                            effect.destroy();
                        });
                    }
                },
                1 // 1 turno de cooldown
            ),
            new Spell(
                'Carga',
                15,
                3,
                3,
                'Se mueve hacia el enemigo y lo ataca',
                (caster, targetX, targetY) => {
                    // Mover al jugador hacia el objetivo
                    const path = SpellLibrary.getLinePath(caster.gridX, caster.gridY, targetX, targetY);
                    
                    // Encontrar la posición más cercana al objetivo
                    let moveToX = caster.gridX;
                    let moveToY = caster.gridY;
                    
                    for (let i = 1; i < path.length; i++) {
                        if (caster.scene.grid.isWalkable(path[i].x, path[i].y)) {
                            moveToX = path[i].x;
                            moveToY = path[i].y;
                        } else {
                            break;
                        }
                    }
                    
                    // Mover y atacar
                    caster.scene.grid.setFree(caster.gridX, caster.gridY);
                    caster.gridX = moveToX;
                    caster.gridY = moveToY;
                    caster.scene.grid.setOccupied(caster.gridX, caster.gridY, caster);
                    
                    // Actualizar posición visual
                    const isoPos = caster.scene.grid.gridToIso(caster.gridX, caster.gridY);
                    caster.sprite.setPosition(640 + isoPos.x, 300 + isoPos.y);
                    
                    // Atacar si está en rango
                    const distance = caster.scene.grid.getDistance(caster.gridX, caster.gridY, targetX, targetY);
                    if (distance === 1) {
                        const target = caster.scene.grid.cells[targetY][targetX].object;
                        if (target && target.constructor.name === 'Enemy') {
                            const damage = caster.attack + Phaser.Math.Between(-2, 2);
                            target.takeDamage(damage);
                        }
                    }
                }
            ),
            new Spell(
                'Grito de Guerra',
                20,
                2,
                0,
                'Aumenta el ataque temporalmente',
                (caster, targetX, targetY) => {
                    caster.attack += 10;
                    caster.sprite.setTint(0xff8800); // Efecto visual
                    
                    // Efecto temporal (3 turnos)
                    caster.warCryTurns = 3;
                    
                    console.log('¡Ataque aumentado por 3 turnos!');
                }
            )
        ];
    }

    static getMageSpells() {
        return [
            new Spell(
                'Bola de Fuego',
                3,
                4,
                4,
                'Lanza una bola de fuego que causa daño en área',
                (caster, targetX, targetY) => {
                    // Daño en área 3x3
                    for (let x = targetX - 1; x <= targetX + 1; x++) {
                        for (let y = targetY - 1; y <= targetY + 1; y++) {
                            if (x >= 0 && y >= 0 && x < caster.scene.grid.width && y < caster.scene.grid.height) {
                                const target = caster.scene.grid.cells[y][x].object;
                                if (target && target.constructor.name === 'Enemy') {
                                    const distance = Math.abs(x - targetX) + Math.abs(y - targetY);
                                    const damage = Math.floor((30 - distance * 5)) + Phaser.Math.Between(-3, 3);
                                    if (damage > 0) {
                                        target.takeDamage(damage);
                                    }
                                }
                                
                                // Efecto visual de fuego
                                const isoPos = caster.scene.grid.gridToIso(x, y);
                                const fireEffect = caster.scene.add.circle(
                                    640 + isoPos.x, 300 + isoPos.y, 20, 0xff4400, 0.7
                                );
                                fireEffect.setDepth(1000);
                                
                                caster.scene.time.delayedCall(1000, () => {
                                    fireEffect.destroy();
                                });
                            }
                        }
                    }
                }
            ),
            new Spell(
                'Rayo',
                4,
                3,
                5,
                'Ataca en línea recta atravesando enemigos',
                (caster, targetX, targetY) => {
                    const path = SpellLibrary.getLinePath(caster.gridX, caster.gridY, targetX, targetY);
                    
                    for (let i = 1; i < path.length; i++) {
                        const x = path[i].x;
                        const y = path[i].y;
                        
                        if (x >= 0 && y >= 0 && x < caster.scene.grid.width && y < caster.scene.grid.height) {
                            const target = caster.scene.grid.cells[y][x].object;
                            if (target && target.constructor.name === 'Enemy') {
                                const damage = 25 + Phaser.Math.Between(-5, 5);
                                target.takeDamage(damage);
                            }
                            
                            // Efecto visual de rayo
                            const isoPos = caster.scene.grid.gridToIso(x, y);
                            const lightningEffect = caster.scene.add.circle(
                                640 + isoPos.x, 300 + isoPos.y, 15, 0x00ffff, 0.8
                            );
                            lightningEffect.setDepth(1000);
                            
                            caster.scene.time.delayedCall(300, () => {
                                lightningEffect.destroy();
                            });
                        }
                    }
                }
            ),
            new Spell(
                'Curación',
                6,
                3,
                0,
                'Restaura puntos de vida',
                (caster, targetX, targetY) => {
                    const healAmount = 40 + Phaser.Math.Between(-5, 5);
                    caster.currentHP = Math.min(caster.maxHP, caster.currentHP + healAmount);
                    caster.updateHealthBar();
                    
                    // Efecto visual de curación
                    const healEffect = caster.scene.add.circle(
                        caster.sprite.x, caster.sprite.y, 40, 0x00ff00, 0.5
                    );
                    healEffect.setDepth(1000);
                    
                    caster.scene.time.delayedCall(800, () => {
                        healEffect.destroy();
                    });
                    
                    console.log(`¡Curado ${healAmount} puntos de vida!`);
                }
            )
        ];
    }

    static getArcherSpells() {
        return [
            new Spell(
                'Disparo Certero',
                15,
                3,
                6,
                'Un disparo preciso de largo alcance',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const damage = caster.attack + 15 + Phaser.Math.Between(-2, 2);
                        target.takeDamage(damage);
                        
                        // Efecto visual de flecha
                        const line = caster.scene.add.line(
                            0, 0,
                            caster.sprite.x, caster.sprite.y,
                            target.sprite.x, target.sprite.y,
                            0x8B4513, 3
                        );
                        line.setDepth(1000);
                        
                        caster.scene.time.delayedCall(400, () => {
                            line.destroy();
                        });
                    }
                }
            ),
            new Spell(
                'Lluvia de Flechas',
                35,
                5,
                4,
                'Múltiples flechas caen en un área',
                (caster, targetX, targetY) => {
                    // Área de 2x2
                    for (let x = targetX; x <= targetX + 1; x++) {
                        for (let y = targetY; y <= targetY + 1; y++) {
                            if (x >= 0 && y >= 0 && x < caster.scene.grid.width && y < caster.scene.grid.height) {
                                const target = caster.scene.grid.cells[y][x].object;
                                if (target && target.constructor.name === 'Enemy') {
                                    const damage = 20 + Phaser.Math.Between(-3, 3);
                                    target.takeDamage(damage);
                                }
                                
                                // Efecto visual de flechas
                                const isoPos = caster.scene.grid.gridToIso(x, y);
                                const arrowEffect = caster.scene.add.rectangle(
                                    640 + isoPos.x, 300 + isoPos.y, 10, 30, 0x8B4513
                                );
                                arrowEffect.setDepth(1000);
                                
                                caster.scene.time.delayedCall(600, () => {
                                    arrowEffect.destroy();
                                });
                            }
                        }
                    }
                }
            ),
            new Spell(
                'Paso Sombra',
                25,
                4,
                3,
                'Teletransportarse a una posición vacía',
                (caster, targetX, targetY) => {
                    if (caster.scene.grid.isWalkable(targetX, targetY)) {
                        // Liberar posición actual
                        caster.scene.grid.setFree(caster.gridX, caster.gridY);
                        
                        // Mover a nueva posición
                        caster.gridX = targetX;
                        caster.gridY = targetY;
                        caster.scene.grid.setOccupied(caster.gridX, caster.gridY, caster);
                        
                        // Actualizar posición visual
                        const isoPos = caster.scene.grid.gridToIso(caster.gridX, caster.gridY);
                        caster.sprite.setPosition(640 + isoPos.x, 300 + isoPos.y);
                        caster.healthBarBg.setPosition(caster.sprite.x, caster.sprite.y - 40);
                        caster.healthBar.setPosition(caster.sprite.x, caster.sprite.y - 40);
                        
                        // Efecto visual de teletransporte
                        const teleportEffect = caster.scene.add.circle(
                            caster.sprite.x, caster.sprite.y, 50, 0x800080, 0.6
                        );
                        teleportEffect.setDepth(1000);
                        
                        caster.scene.time.delayedCall(500, () => {
                            teleportEffect.destroy();
                        });
                    }
                }
            )
        ];
    }

    // Función auxiliar para calcular camino en línea recta
    static getLinePath(x1, y1, x2, y2) {
        const path = [];
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            path.push({ x, y });
            
            if (x === x2 && y === y2) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return path;
    }
}
