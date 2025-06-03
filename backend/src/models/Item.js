const mongoose = require('mongoose');

// Esquema para items estáticos del juego
const itemSchema = new mongoose.Schema({
    _id: {
        type: String, // Usamos string como ID para facilidad (ej: "wood", "iron_sword")
        required: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['resource', 'equipment', 'consumable']
    },
    rarity: {
        type: String,
        required: true,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    value: {
        type: Number,
        required: true,
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    stackable: {
        type: Boolean,
        default: false
    },
    maxStack: {
        type: Number,
        default: 1
    },
    stats: {
        type: mongoose.Schema.Types.Mixed, // Para equipamiento
        default: null
    },
    requirements: {
        level: { type: Number, default: 1 },
        class: { type: String, default: null } // null = cualquier clase
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false // Deshabilitamos auto-generación de _id
});

module.exports = mongoose.model('Item', itemSchema);
