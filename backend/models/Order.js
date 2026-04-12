const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    tableId: {
        type: Number,
        required: true
    },
    items: [
        {
            itemId: Number,
            name: String,
            price: Number,
            quantity: Number
        }
    ],
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready'],
        default: 'pending'
    },
    estimatedTime: {
        type: String,
        default: "15-20 mins"
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);