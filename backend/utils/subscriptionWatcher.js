const Cafe = require('../models/Cafe');

// Runs a daily check to move expired subscriptions to 'inactive'
const startSubscriptionWatcher = (intervalMs = 24 * 60 * 60 * 1000) => {
  const check = async () => {
    try {
      const now = new Date();
      const expired = await Cafe.find({ subscriptionExpiry: { $ne: null, $lt: now }, subscriptionStatus: 'active' });
      if (expired && expired.length) {
        for (const cafe of expired) {
          cafe.subscriptionStatus = 'inactive';
          await cafe.save();
          console.log(`Subscription expired for cafe ${cafe._id}, set to inactive`);
        }
      }
    } catch (err) {
      console.error('Subscription watcher error:', err);
    }
  };

  // initial run
  check();

  // schedule periodic checks
  const id = setInterval(check, intervalMs);

  return () => clearInterval(id);
};

module.exports = { startSubscriptionWatcher };
