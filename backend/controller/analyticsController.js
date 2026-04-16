const StoreSettings = require("../models/StoreSettings");
const {
  buildAnalyticsData,
  DEFAULT_PROFIT_MARGIN,
} = require("../services/analyticsService");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");

const getAnalytics = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const data = await buildAnalyticsData(restaurantId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfitMargin = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const rawMargin = Number(req.body?.profitMargin);

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    if (!Number.isFinite(rawMargin) || rawMargin < 0 || rawMargin > 1) {
      return res.status(400).json({ message: "profitMargin must be a number between 0 and 1" });
    }

    const existing = await StoreSettings.findOne({ restaurantId });

    if (existing) {
      existing.profitMargin = rawMargin;
      await existing.save();
    } else {
      await StoreSettings.create({ restaurantId, profitMargin: rawMargin });
    }

    const data = await buildAnalyticsData(restaurantId);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics, updateProfitMargin };
