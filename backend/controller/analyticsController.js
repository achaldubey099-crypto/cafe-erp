import { buildAnalyticsData } from "../services/analyticsService.js";

export const getAnalytics = async (req, res) => {
    try {
        const data = await buildAnalyticsData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};