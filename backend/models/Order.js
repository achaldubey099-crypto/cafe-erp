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
    },

    // 💰 Pricing Details
    totalAmount: {
        type: Number,
        default: 0
    },

    platformFee: {
        type: Number,
        default: 0
    },

    serviceTax: {
        type: Number,
        default: 0
    },

    grandTotal: {
        type: Number,
        default: 0
    },

    // 💳 Payment Method
    paymentMethod: {
        type: String,
        enum: ['UPI', 'CARD', 'WALLET'],
        default: 'UPI'
    },

    // 👥 Split Bill
    splitBill: {
        isSplit: {
            type: Boolean,
            default: false
        },
        peopleCount: {
            type: Number,
            default: 1
        },
        perPersonAmount: {
            type: Number,
            default: 0
        }
    }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);