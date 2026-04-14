const Order = require("../models/Order");

const buildAnalyticsData = async () => {
  try {
    // ================= TODAY =================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersToday = await Order.find({
      createdAt: { $gte: today },
    });

    const totalOrders = ordersToday.length;

    const todaysSales = ordersToday.reduce(
      (acc, order) => acc + (order.totalAmount || 0),
      0
    );

    // ================= ALL TIME =================
    const allOrders = await Order.find();

    const totalRevenue = allOrders.reduce(
      (acc, order) => acc + (order.totalAmount || 0),
      0
    );

    // ================= PROFIT =================
    const COST_PERCENTAGE = 0.6;
    const netProfit = totalRevenue * (1 - COST_PERCENTAGE);

    // ================= WEEKLY SALES =================
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const weeklyOrders = await Order.find({
      createdAt: { $gte: last7Days },
    });

    const salesByDay = {};

    weeklyOrders.forEach((order) => {
      const day = new Date(order.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
      });

      salesByDay[day] =
        (salesByDay[day] || 0) + (order.totalAmount || 0);
    });

    // ================= BEST SELLING PRODUCT =================
    const itemCount = {};

    allOrders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          if (!item.name) return;

          itemCount[item.name] =
            (itemCount[item.name] || 0) + (item.quantity || 0);
        });
      }
    });

    const bestSellingEntry =
      Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];

    const bestSellingProduct = {
      name: bestSellingEntry[0],
      count: bestSellingEntry[1],
    };

    // ================= CUSTOMER RETENTION =================
    const userOrders = {};

    allOrders.forEach((order) => {
      const userId = order.userId ? order.userId.toString() : "guest";
      userOrders[userId] = (userOrders[userId] || 0) + 1;
    });

    const totalUsers = Object.keys(userOrders).length;

    const repeatCustomers = Object.values(userOrders).filter(
      (count) => count > 1
    ).length;

    const retentionRate =
      totalUsers === 0
        ? 0
        : Number(((repeatCustomers / totalUsers) * 100).toFixed(1));

    // ================= TOP SELLING ITEMS =================
    const topSellingItems = Object.entries(itemCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // ================= PEAK HOURS =================
    const hourlyOrders = {};

    allOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
    });

    // ================= SMART ADVICE =================
    let advice = "Sales are steady.";

    if ((hourlyOrders[9] || 0) > 10) {
      advice = "Morning rush is high. Add extra staff around 9 AM.";
    } else if ((hourlyOrders[13] || 0) > 10) {
      advice = "Lunch hours are busy. Prepare inventory in advance.";
    } else if ((hourlyOrders[18] || 0) > 10) {
      advice = "Evening peak detected. Optimize staff shifts.";
    }

    // ================= FINAL RESPONSE =================
    return {
      todaysSales,
      totalOrders,
      totalRevenue,
      netProfit,

      weeklySales: salesByDay,

      bestSellingProduct,
      retentionRate,

      topSellingItems,

      peakHours: hourlyOrders,

      advice,
    };
  } catch (error) {
    console.error("Analytics Error:", error);
    throw error;
  }
};

module.exports = { buildAnalyticsData };