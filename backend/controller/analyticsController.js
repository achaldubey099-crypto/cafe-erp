const StoreSettings = require("../models/StoreSettings");
const {
  buildAnalyticsData,
  DEFAULT_PROFIT_MARGIN,
} = require("../services/analyticsService");

const getAnalytics = async (req, res) => {
  try {
    const data = await buildAnalyticsData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfitMargin = async (req, res) => {
  try {
    const rawMargin = Number(req.body?.profitMargin);

    if (!Number.isFinite(rawMargin) || rawMargin < 0 || rawMargin > 1) {
      return res.status(400).json({ message: "profitMargin must be a number between 0 and 1" });
    }

    const existing = await StoreSettings.findOne();

    if (existing) {
      existing.profitMargin = rawMargin;
      await existing.save();
    } else {
      await StoreSettings.create({ profitMargin: rawMargin });
    }

    const data = await buildAnalyticsData();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics, updateProfitMargin };
