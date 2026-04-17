const Cafe = require('../models/Cafe');

const checkSubscription = async (req, res, next) => {
  try {
    const cafeId = req.cafeId || (req.user && (req.user.cafeId || req.user.restaurantId));
    if (!cafeId) return res.status(403).json({ message: 'Subscription expired. Please renew to continue.' });

    const cafe = req.cafe || await Cafe.findById(cafeId).lean();
    if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

    if (cafe.subscriptionStatus !== 'active') {
      return res.status(403).json({ message: 'Subscription expired. Please renew to continue.' });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkSubscription };
