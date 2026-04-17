const Cafe = require('../models/Cafe');

const checkFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const cafeId = req.cafeId || (req.user && (req.user.cafeId || req.user.restaurantId));
      if (!cafeId) return res.status(403).json({ message: 'Feature not available in your plan' });

      const cafe = req.cafe || await Cafe.findById(cafeId).lean();
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });

      const features = cafe.features || [];
      if (!features.includes(featureName)) {
        return res.status(403).json({ message: 'Feature not available in your plan' });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = { checkFeature };
