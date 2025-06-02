export class Spell {
    constructor(name, actionPointCost, range, description, effect, cooldown = 0, element = null) {
        this.name = name;
        this.actionPointCost = actionPointCost;
        this.range = range;
        this.description = description;
        this.effect = effect; // Función que define el efecto del hechizo
        this.cooldown = cooldown; // Turnos de enfriamiento
        this.currentCooldown = 0;
        this.element = element; // Elemento del hechizo: 'tierra', 'fuego', 'agua', 'aire'
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

    // Calcular daño con el sistema completo de Dofus
    calculateDamage(baseDamage, caster, target = null) {
        if (!this.element || !caster.characteristics) {
            return baseDamage;
        }

        let finalDamage = baseDamage;

        // 1. Aplicar característica elemental (1 punto = 1% más daño)
        const elementBonus = caster.characteristics[this.element] || 0;
        if (elementBonus > 0) {
            finalDamage = Math.floor(finalDamage * (1 + elementBonus / 100));
            console.log(`🔥 Característica ${this.element}: +${elementBonus}% (${baseDamage} → ${finalDamage})`);
        }

        // 2. Aplicar daños planos (para futuro)
        if (caster.damageBonus?.flat > 0) {
            finalDamage += caster.damageBonus.flat;
            console.log(`⚔️ Daño plano: +${caster.damageBonus.flat}`);
        }

        // 3. Aplicar bonos porcentuales de hechizo (para futuro)
        if (caster.damageBonus?.spellPercent > 0) {
            finalDamage = Math.floor(finalDamage * (1 + caster.damageBonus.spellPercent / 100));
            console.log(`✨ Bono hechizo: +${caster.damageBonus.spellPercent}%`);
        }

        // 4. Aplicar bonos por elemento específico (para futuro)
        const elementPercentKey = `${this.element}Percent`;
        if (caster.damageBonus?.[elementPercentKey] > 0) {
            finalDamage = Math.floor(finalDamage * (1 + caster.damageBonus[elementPercentKey] / 100));
            console.log(`🌟 Bono ${this.element}: +${caster.damageBonus[elementPercentKey]}%`);
        }

        // 5. Aplicar resistencias del objetivo (si existe)
        if (target && target.resistances && target.resistances[this.element] > 0) {
            const resistance = target.resistances[this.element];
            finalDamage = Math.floor(finalDamage * (1 - resistance / 100));
            console.log(`🛡️ Resistencia ${this.element}: -${resistance}% (${finalDamage})`);
        }

        return Math.max(1, finalDamage); // Mínimo 1 de daño
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

// Hechizos específicos por raza con elementos
export class SpellLibrary {
    static getWarriorSpells() {
        return [
            new Spell(
                'Golpe Telúrico',
                4,
                1,
                'Ataque de tierra que causa daño devastador',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = Math.floor(caster.attack * 1.5) + Phaser.Math.Between(-3, 3);
                        const spell = caster.spells.find(s => s.name === 'Golpe Telúrico');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de tierra
                        const effect = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 30, 0x8B4513, 0.7
                        );
                        effect.setDepth(1000);

                        caster.scene.time.delayedCall(500, () => {
                            effect.destroy();
                        });
                    }
                },
                1, // 1 turno de cooldown
                'tierra' // Elemento tierra
            ),
            new Spell(
                'Llama Ardiente',
                4,
                1,
                'Espada envuelta en fuego que quema al enemigo',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = caster.attack + 10 + Phaser.Math.Between(-2, 2);
                        const spell = caster.spells.find(s => s.name === 'Llama Ardiente');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de fuego
                        const effect = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 25, 0xff4400, 0.8
                        );
                        effect.setDepth(1000);

                        caster.scene.time.delayedCall(400, () => {
                            effect.destroy();
                        });
                    }
                },
                0, // Sin cooldown
                'fuego' // Elemento fuego
            ),
            new Spell(
                'Tormenta Helada',
                3,
                1,
                'Ataque de hielo que congela al enemigo',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = caster.attack + 8 + Phaser.Math.Between(-2, 2);
                        const spell = caster.spells.find(s => s.name === 'Tormenta Helada');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de hielo
                        const effect = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 25, 0x00ffff, 0.8
                        );
                        effect.setDepth(1000);

                        caster.scene.time.delayedCall(400, () => {
                            effect.destroy();
                        });
                    }
                },
                1, // 1 turno de cooldown
                'agua' // Elemento agua
            ),
            new Spell(
                'Viento Cortante',
                3,
                2,
                'Ataque rápido de aire que atraviesa distancias',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = caster.attack + 6 + Phaser.Math.Between(-2, 2);
                        const spell = caster.spells.find(s => s.name === 'Viento Cortante');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de aire
                        const effect = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 25, 0xcccccc, 0.6
                        );
                        effect.setDepth(1000);

                        caster.scene.time.delayedCall(300, () => {
                            effect.destroy();
                        });
                    }
                },
                0, // Sin cooldown
                'aire' // Elemento aire
            )
        ];
    }

    static getMageSpells() {
        return [
            new Spell(
                'Terremoto',
                5,
                2,
                'Invoca la fuerza de la tierra en área',
                (caster, targetX, targetY) => {
                    // Daño en área 3x3
                    for (let x = targetX - 1; x <= targetX + 1; x++) {
                        for (let y = targetY - 1; y <= targetY + 1; y++) {
                            if (x >= 0 && y >= 0 && x < caster.scene.grid.width && y < caster.scene.grid.height) {
                                const target = caster.scene.grid.cells[y][x].object;
                                if (target && target.constructor.name === 'Enemy') {
                                    const distance = Math.abs(x - targetX) + Math.abs(y - targetY);
                                    const baseDamage = Math.floor((35 - distance * 5)) + Phaser.Math.Between(-3, 3);
                                    const spell = caster.spells.find(s => s.name === 'Terremoto');
                                    const finalDamage = spell.calculateDamage(baseDamage, caster);
                                    if (finalDamage > 0) {
                                        target.takeDamage(finalDamage);
                                    }
                                }

                                // Efecto visual de tierra
                                const worldPos = caster.scene.grid.gridToWorld(x, y);
                                const earthEffect = caster.scene.add.circle(
                                    worldPos.x, worldPos.y, 20, 0x8B4513, 0.8
                                );
                                earthEffect.setDepth(1000);

                                caster.scene.time.delayedCall(1000, () => {
                                    earthEffect.destroy();
                                });
                            }
                        }
                    }
                },
                2, // 2 turnos de cooldown
                'tierra' // Elemento tierra
            ),
            new Spell(
                'Bola de Fuego',
                4,
                3,
                'Proyectil mágico de fuego explosivo',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = 30 + Phaser.Math.Between(-5, 5);
                        const spell = caster.spells.find(s => s.name === 'Bola de Fuego');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de fuego
                        const fireEffect = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 30, 0xff4400, 0.8
                        );
                        fireEffect.setDepth(1000);

                        caster.scene.time.delayedCall(600, () => {
                            fireEffect.destroy();
                        });
                    }
                },
                1, // 1 turno de cooldown
                'fuego' // Elemento fuego
            ),
            new Spell(
                'Rayo de Hielo',
                3,
                2,
                'Proyectil de hielo que congela al enemigo',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = 25 + Phaser.Math.Between(-3, 3);
                        const spell = caster.spells.find(s => s.name === 'Rayo de Hielo');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de hielo
                        const iceEffect = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 25, 0x00ffff, 0.8
                        );
                        iceEffect.setDepth(1000);

                        caster.scene.time.delayedCall(500, () => {
                            iceEffect.destroy();
                        });
                    }
                },
                0, // Sin cooldown
                'agua' // Elemento agua
            ),
            new Spell(
                'Tormenta Eléctrica',
                4,
                3,
                'Rayos del cielo que atacan en área',
                (caster, targetX, targetY) => {
                    // Área de 2x2
                    for (let x = targetX; x <= targetX + 1; x++) {
                        for (let y = targetY; y <= targetY + 1; y++) {
                            if (x >= 0 && y >= 0 && x < caster.scene.grid.width && y < caster.scene.grid.height) {
                                const target = caster.scene.grid.cells[y][x].object;
                                if (target && target.constructor.name === 'Enemy') {
                                    const baseDamage = 20 + Phaser.Math.Between(-3, 3);
                                    const spell = caster.spells.find(s => s.name === 'Tormenta Eléctrica');
                                    const finalDamage = spell.calculateDamage(baseDamage, caster);
                                    target.takeDamage(finalDamage);
                                }

                                // Efecto visual de aire/electricidad
                                const worldPos = caster.scene.grid.gridToWorld(x, y);
                                const lightningEffect = caster.scene.add.circle(
                                    worldPos.x, worldPos.y, 15, 0xffff00, 0.9
                                );
                                lightningEffect.setDepth(1000);

                                caster.scene.time.delayedCall(400, () => {
                                    lightningEffect.destroy();
                                });
                            }
                        }
                    }
                },
                1, // 1 turno de cooldown
                'aire' // Elemento aire
            )
        ];
    }

    static getArcherSpells() {
        return [
            new Spell(
                'Flecha Rocosa',
                3,
                4,
                'Flecha imbuida con el poder de la tierra',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = caster.attack + 12 + Phaser.Math.Between(-2, 2);
                        const spell = caster.spells.find(s => s.name === 'Flecha Rocosa');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de flecha de tierra
                        const line = caster.scene.add.line(
                            0, 0,
                            caster.sprite.x, caster.sprite.y,
                            target.sprite.x, target.sprite.y,
                            0x8B4513, 4
                        );
                        line.setDepth(1000);

                        caster.scene.time.delayedCall(400, () => {
                            line.destroy();
                        });
                    }
                },
                0, // Sin cooldown
                'tierra' // Elemento tierra
            ),
            new Spell(
                'Flecha Explosiva',
                4,
                4,
                'Flecha de fuego que explota al impactar',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = caster.attack + 15 + Phaser.Math.Between(-3, 3);
                        const spell = caster.spells.find(s => s.name === 'Flecha Explosiva');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de flecha de fuego
                        const line = caster.scene.add.line(
                            0, 0,
                            caster.sprite.x, caster.sprite.y,
                            target.sprite.x, target.sprite.y,
                            0xff4400, 4
                        );
                        line.setDepth(1000);

                        // Explosión
                        const explosion = caster.scene.add.circle(
                            target.sprite.x, target.sprite.y, 35, 0xff4400, 0.7
                        );
                        explosion.setDepth(1001);

                        caster.scene.time.delayedCall(400, () => {
                            line.destroy();
                            explosion.destroy();
                        });
                    }
                },
                1, // 1 turno de cooldown
                'fuego' // Elemento fuego
            ),
            new Spell(
                'Flecha de Hielo',
                3,
                3,
                'Flecha congelante que ralentiza al enemigo',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = caster.attack + 10 + Phaser.Math.Between(-2, 2);
                        const spell = caster.spells.find(s => s.name === 'Flecha de Hielo');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de flecha de hielo
                        const line = caster.scene.add.line(
                            0, 0,
                            caster.sprite.x, caster.sprite.y,
                            target.sprite.x, target.sprite.y,
                            0x00ffff, 4
                        );
                        line.setDepth(1000);

                        caster.scene.time.delayedCall(400, () => {
                            line.destroy();
                        });
                    }
                },
                0, // Sin cooldown
                'agua' // Elemento agua
            ),
            new Spell(
                'Flecha del Viento',
                2,
                5,
                'Flecha rápida de aire con largo alcance',
                (caster, targetX, targetY) => {
                    const target = caster.scene.grid.cells[targetY][targetX].object;
                    if (target && target.constructor.name === 'Enemy') {
                        const baseDamage = caster.attack + 8 + Phaser.Math.Between(-2, 2);
                        const spell = caster.spells.find(s => s.name === 'Flecha del Viento');
                        const finalDamage = spell.calculateDamage(baseDamage, caster);
                        target.takeDamage(finalDamage);

                        // Efecto visual de flecha de aire
                        const line = caster.scene.add.line(
                            0, 0,
                            caster.sprite.x, caster.sprite.y,
                            target.sprite.x, target.sprite.y,
                            0xcccccc, 3
                        );
                        line.setDepth(1000);

                        caster.scene.time.delayedCall(300, () => {
                            line.destroy();
                        });
                    }
                },
                0, // Sin cooldown
                'aire' // Elemento aire
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
