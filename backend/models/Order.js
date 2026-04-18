const mongoose = require('mongoose');
const Counter = require('./Counter');

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },

    tableRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },

    tableId: {
      type: Number,
      required: true,
    },

    // ✅ SESSION (VERY IMPORTANT for table-based system)
    sessionId: {
      type: String,
      default: null,
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
      enum: ['UPI', 'Card', 'Counter'],
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
      default: null, // ✅ FIX: prevent crash if not provided
    },
    cafeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cafe',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// ⚡ INDEXES
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });
orderSchema.index(
  { orderNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      orderNumber: { $type: "number" },
    },
  }
);

orderSchema.statics.getNextOrderNumber = async function getNextOrderNumber() {
  const counter = await Counter.findOneAndUpdate(
    { key: "orderNumber" },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return counter.value;
};

orderSchema.pre("validate", async function assignOrderNumber() {
  if (!this.isNew || this.orderNumber) {
    return;
  }

  this.orderNumber = await this.constructor.getNextOrderNumber();
});

module.exports = mongoose.model('Order', orderSchema);
