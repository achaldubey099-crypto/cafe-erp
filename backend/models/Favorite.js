const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    tableId: {
        type: Number,
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        required: true
    }
    ,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);