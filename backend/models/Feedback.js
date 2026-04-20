const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      default: null,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ orderId: 1, userId: 1 }, { unique: true });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ restaurantId: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
