const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'El nombre del personaje es requerido'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [15, 'El nombre no puede tener más de 15 caracteres']
    },
    class: {
        type: String,
        required: true,
        enum: ['mage', 'warrior', 'archer'],
        default: 'mage'
    },
    level: {
        type: Number,
        default: 1,
        min: 1,
        max: 200
    },
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    stats: {
        hp: {
            current: { type: Number, default: 100 },
            max: { type: Number, default: 100 }
        },
        movementPoints: { type: Number, default: 3 },
        actionPoints: { type: Number, default: 6 }
    },
    // Características base (como en Dofus)
    characteristics: {
        // Características elementales (1 punto = 1% más daño del elemento)
        tierra: { type: Number, default: 0 },      // Fuerza
        fuego: { type: Number, default: 0 },       // Inteligencia
        agua: { type: Number, default: 0 },        // Suerte/Chance
        aire: { type: Number, default: 0 },        // Agilidad
        vida: { type: Number, default: 0 },        // Vitalidad (1 punto = +1 HP máximo)
        sabiduria: { type: Number, default: 0 }    // Sabiduría (1 punto = +1% XP)
    },
    // Resistencias elementales (porcentuales)
    resistances: {
        tierra: { type: Number, default: 0 },      // % resistencia a tierra
        fuego: { type: Number, default: 0 },       // % resistencia a fuego
        agua: { type: Number, default: 0 },        // % resistencia a agua
        aire: { type: Number, default: 0 }         // % resistencia a aire
    },
    // Bonos de daño (para futuro)
    damageBonus: {
        flat: { type: Number, default: 0 },        // +X daños planos
        spellPercent: { type: Number, default: 0 }, // +X% daños de hechizo
        meleePercent: { type: Number, default: 0 }, // +X% daños cuerpo a cuerpo
        // Bonos por elemento
        tierraPercent: { type: Number, default: 0 },
        fuegoPercent: { type: Number, default: 0 },
        aguaPercent: { type: Number, default: 0 },
        airePercent: { type: Number, default: 0 }
    },
    capitalPoints: { type: Number, default: 10 }, // Puntos disponibles para distribuir

    // Sistema de dinero
    kamas: { type: Number, default: 0 }, // Dinero del juego

    position: {
        x: { type: Number, default: 5 },
        y: { type: Number, default: 10 },
        mapId: { type: String, default: 'exploration' }
    },

    // Inventario mejorado
    inventory: [{
        itemId: { type: String, required: true }, // Referencia al item estático
        quantity: { type: Number, default: 1, min: 1 },
        equipped: { type: Boolean, default: false },
        obtainedAt: { type: Date, default: Date.now }
    }],

    // Sistema de equipamiento
    equipment: {
        helmet: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        amulet: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        ring1: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        ring2: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        weapon: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        armor: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        shield: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        belt: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        },
        boots: {
            itemId: { type: String, default: null },
            quantity: { type: Number, default: 1 },
            equippedAt: { type: Date, default: null }
        }
    },
    spells: [{
        spellId: String,
        level: { type: Number, default: 1 },
        unlocked: { type: Boolean, default: true }
    }],
    spellPoints: { type: Number, default: 1 }, // Puntos para subir hechizos
    achievements: [{
        achievementId: String,
        unlockedAt: { type: Date, default: Date.now }
    }],
    gameStats: {
        combatsWon: { type: Number, default: 0 },
        combatsLost: { type: Number, default: 0 },
        enemiesDefeated: { type: Number, default: 0 },
        totalPlayTime: { type: Number, default: 0 }, // en minutos
        lastSaved: { type: Date, default: Date.now }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índices para mejorar rendimiento
characterSchema.index({ userId: 1 });
characterSchema.index({ name: 1 });
characterSchema.index({ level: -1 });

// Método para calcular experiencia necesaria para siguiente nivel
characterSchema.methods.getExpForNextLevel = function() {
    return this.level * 200;
};

// Método para verificar si puede subir de nivel
characterSchema.methods.canLevelUp = function() {
    return this.experience >= this.getExpForNextLevel();
};

// Método para subir de nivel
characterSchema.methods.levelUp = function() {
    if (this.canLevelUp()) {
        const oldLevel = this.level;
        this.level += 1;

        // Otorgar 5 puntos de capital por nivel
        this.capitalPoints += 5;

        // Otorgar 1 punto de hechizo por nivel
        this.spellPoints += 1;

        // Mejorar estadísticas básicas al subir nivel
        this.stats.hp.max += 20;
        this.stats.hp.current = this.stats.hp.max; // Curación completa
        // No hay MP en este juego, solo Action Points que se resetean cada turno

        console.log(`Personaje subió de nivel ${oldLevel} → ${this.level}. Puntos de capital: +5 (Total: ${this.capitalPoints}), Puntos de hechizo: +1 (Total: ${this.spellPoints})`);

        return true;
    }
    return false;
};

// Método para obtener datos públicos del personaje
characterSchema.methods.toGameJSON = function() {
    return {
        id: this._id,
        name: this.name,
        class: this.class,
        level: this.level,
        experience: this.experience,
        stats: this.stats,
        characteristics: this.characteristics,
        resistances: this.resistances,
        damageBonus: this.damageBonus,
        capitalPoints: this.capitalPoints,
        kamas: this.kamas, // Incluir dinero
        position: this.position,
        inventory: this.inventory, // Incluir inventario
        equipment: this.equipment, // Incluir equipamiento
        spells: this.spells,
        spellPoints: this.spellPoints,
        gameStats: this.gameStats,
        lastSaved: this.gameStats.lastSaved
    };
};

module.exports = mongoose.model('Character', characterSchema);
