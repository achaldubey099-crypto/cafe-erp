const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    tableId: {
      type: Number,
      required: true,
    },

    // 👤 USER LINK (for analytics & tracking)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // 🧾 ITEMS
    items: [
      {
        itemId: Number,
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    // 📊 ORDER STATUS
    status: {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'pending',
    },

    // ⏱️ TIME TRACKING
    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // ⏳ Estimated Time
    estimatedTime: {
      type: String,
      default: '15-20 mins',
    },

    // 📝 Special Instructions
    specialInstructions: {
      type: String,
      default: '',
    },

    // 🪑 ORDER TYPE
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway'],
      default: 'dine-in',
    },

    // 💰 PRICING
    totalAmount: {
      type: Number,
      default: 0,
    },

    platformFee: {
      type: Number,
      default: 0,
    },

    serviceTax: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    // 💳 PAYMENT
    paymentMethod: {
      type: String,
      enum: ['UPI', 'CARD', 'WALLET'],
      default: 'UPI',
    },

    // 👥 SPLIT BILL
    splitBill: {
      isSplit: {
        type: Boolean,
        default: false,
      },
      peopleCount: {
        type: Number,
        default: 1,
      },
      perPersonAmount: {
        type: Number,
        default: 0,
      },
    },

    // 🔢 ORDER NUMBER
    orderNumber: {
      type: Number,
      required: true,
      unique: true, // ✅ this already creates index
    },
  },
  { timestamps: true }
);

// ⚡ INDEXES (KEEP ONLY THESE)
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

// ❌ REMOVED: orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);