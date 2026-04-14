const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
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
