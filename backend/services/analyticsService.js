const Order = require("../models/Order");
const StoreSettings = require("../models/StoreSettings");

const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_PROFIT_MARGIN = 0.4;

const getOrderValue = (order) => Number(order?.grandTotal ?? order?.totalAmount ?? 0) || 0;

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const startOfMonth = (date) => {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
};

const startOfYear = (date) => {
  const next = startOfDay(date);
  next.setMonth(0, 1);
  return next;
};

const formatShortDay = (date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

const formatDayMonth = (date) =>
  date.toLocaleDateString("en-US", { day: "numeric", month: "short" });

const buildDailySeries = (orders, days) => {
  const today = startOfDay(new Date());
  const points = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const isoKey = date.toISOString().slice(0, 10);

    points.push({
      key: isoKey,
      label: days <= 7 ? formatShortDay(date) : formatDayMonth(date),
      value: 0,
    });
  }

  const pointMap = new Map(points.map((point) => [point.key, point]));

  orders.forEach((order) => {
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return;

    const key = createdAt.toISOString().slice(0, 10);
    const point = pointMap.get(key);
    if (!point) return;

    point.value += getOrderValue(order);
  });

  return points.map(({ key, ...point }) => point);
};

const buildWeeklySales = (series7d) => {
  const summary = Object.fromEntries(DAY_ORDER.map((day) => [day, 0]));

  series7d.forEach((point) => {
    if (summary[point.label] === undefined) {
      summary[point.label] = 0;
    }
    summary[point.label] += point.value;
  });

  return summary;
};

const normalizePaymentMethod = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "upi") return "upi";
  if (raw === "card") return "card";
  if (raw === "counter") return "counter";
  return "unknown";
};

const buildPeriodTotals = (orders, profitMargin) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const monthOrders = orders.filter((order) => {
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
    return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= monthStart;
  });

  const yearOrders = orders.filter((order) => {
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
    return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= yearStart;
  });

  const getRevenue = (source) => source.reduce((sum, order) => sum + getOrderValue(order), 0);

  const monthRevenue = getRevenue(monthOrders);
  const yearRevenue = getRevenue(yearOrders);
  const allTimeRevenue = getRevenue(orders);

  return {
    month: {
      revenue: monthRevenue,
      profit: monthRevenue * profitMargin,
    },
    year: {
      revenue: yearRevenue,
      profit: yearRevenue * profitMargin,
    },
    allTime: {
      revenue: allTimeRevenue,
      profit: allTimeRevenue * profitMargin,
    },
  };
};

const getStoreSettings = async () => {
  let settings = await StoreSettings.findOne().lean();

  if (!settings) {
    settings = await StoreSettings.create({ profitMargin: DEFAULT_PROFIT_MARGIN });
    return settings.toObject();
  }

  return settings;
};

const buildAnalyticsData = async () => {
  const settings = await getStoreSettings();
  const profitMargin =
    typeof settings?.profitMargin === "number" ? settings.profitMargin : DEFAULT_PROFIT_MARGIN;
  const allOrders = await Order.find().sort({ createdAt: -1 }).lean();
  const revenueOrders = allOrders.filter((order) => order.status !== "cancelled");

  const today = startOfDay(new Date());
  const ordersToday = revenueOrders.filter((order) => {
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
    return createdAt && !Number.isNaN(createdAt.getTime()) && createdAt >= today;
  });

  const todaysSales = ordersToday.reduce((sum, order) => sum + getOrderValue(order), 0);
  const totalOrders = revenueOrders.length;
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + getOrderValue(order), 0);
  const netProfit = totalRevenue * profitMargin;
  const periodTotals = buildPeriodTotals(revenueOrders, profitMargin);

  const salesSeries7d = buildDailySeries(revenueOrders, 7);
  const salesSeries30d = buildDailySeries(revenueOrders, 30);
  const weeklySales = buildWeeklySales(salesSeries7d);

  const itemCount = {};
  revenueOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const itemName = item?.name || `Item ${item?.itemId ?? ""}`.trim();
      itemCount[itemName] = (itemCount[itemName] || 0) + (Number(item?.quantity) || 0);
    });
  });

  const topSellingItems = Object.entries(itemCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  const bestSellingProduct = topSellingItems[0]
    ? { name: topSellingItems[0].name, count: topSellingItems[0].quantity }
    : { name: "N/A", count: 0 };

  const paymentBreakdown = { upi: 0, card: 0, counter: 0 };
  revenueOrders.forEach((order) => {
    const key = normalizePaymentMethod(order.paymentMethod);
    if (key in paymentBreakdown) {
      paymentBreakdown[key] += 1;
    }
  });

  const hourlyOrders = {};
  revenueOrders.forEach((order) => {
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return;
    const hourKey = `${String(createdAt.getHours()).padStart(2, "0")}:00`;
    hourlyOrders[hourKey] = (hourlyOrders[hourKey] || 0) + 1;
  });

  const customerBuckets = {};
  revenueOrders.forEach((order) => {
    const userKey =
      order.userId
        ? `user:${String(order.userId)}`
        : order.sessionId
          ? `session:${order.sessionId}`
          : `table:${order.tableId || "guest"}`;

    customerBuckets[userKey] = (customerBuckets[userKey] || 0) + 1;
  });

  const totalCustomerBuckets = Object.keys(customerBuckets).length;
  const repeatCustomers = Object.values(customerBuckets).filter((count) => count > 1).length;
  const retentionRate =
    totalCustomerBuckets === 0
      ? 0
      : Number(((repeatCustomers / totalCustomerBuckets) * 100).toFixed(1));

  const recentOrders = revenueOrders.slice(0, 5).map((order) => ({
    _id: String(order._id),
    tableId: order.tableId,
    status: order.status,
    grandTotal: getOrderValue(order),
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod || "UPI",
  }));

  const busiestHourEntry = Object.entries(hourlyOrders).sort((a, b) => b[1] - a[1])[0];
  let advice = "Orders are flowing steadily. Keep the current pace.";

  if (busiestHourEntry) {
    advice = `Peak traffic is around ${busiestHourEntry[0]}. Keep staff coverage strong during that hour.`;
  }

  if (bestSellingProduct.count > 0) {
    advice = `${bestSellingProduct.name} is leading sales. Keep it stocked and featured on the menu.`;
  }

  return {
    todaysSales,
    totalOrders,
    totalRevenue,
    netProfit,
    profitMargin,
    periodTotals,
    weeklySales,
    salesSeries7d,
    salesSeries30d,
    bestSellingProduct,
    retentionRate,
    topSellingItems,
    advice,
    paymentBreakdown,
    hourlyOrders,
    recentOrders,
  };
};

module.exports = { buildAnalyticsData, getStoreSettings, DEFAULT_PROFIT_MARGIN };
