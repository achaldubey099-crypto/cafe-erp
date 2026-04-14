const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    tableId: {
        type: Number,
        default: null
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
    },
    name: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
