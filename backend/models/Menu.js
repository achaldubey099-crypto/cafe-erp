const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
        index: true
    },
    cafeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cafe',
        default: null,
        index: true,
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: {
        type: String, // keeping simple for now
        required: true
    },
    image: {
        type: String
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Menu', menuSchema);
