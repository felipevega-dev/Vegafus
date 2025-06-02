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
        max: 100
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
        mp: {
            current: { type: Number, default: 50 },
            max: { type: Number, default: 50 }
        },
        attack: { type: Number, default: 20 },
        defense: { type: Number, default: 10 },
        movementPoints: { type: Number, default: 3 },
        actionPoints: { type: Number, default: 6 }
    },
    position: {
        x: { type: Number, default: 5 },
        y: { type: Number, default: 10 },
        mapId: { type: String, default: 'exploration' }
    },
    inventory: [{
        itemId: String,
        quantity: { type: Number, default: 1 },
        equipped: { type: Boolean, default: false }
    }],
    spells: [{
        spellId: String,
        level: { type: Number, default: 1 },
        unlocked: { type: Boolean, default: true }
    }],
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
        this.level += 1;
        
        // Mejorar estadísticas al subir nivel
        this.stats.hp.max += 20;
        this.stats.hp.current = this.stats.hp.max; // Curación completa
        this.stats.mp.max += 10;
        this.stats.mp.current = this.stats.mp.max;
        this.stats.attack += 5;
        this.stats.defense += 3;
        
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
        position: this.position,
        spells: this.spells,
        gameStats: this.gameStats,
        lastSaved: this.gameStats.lastSaved
    };
};

module.exports = mongoose.model('Character', characterSchema);
