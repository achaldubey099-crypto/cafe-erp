const Order = require("../models/Order");
const Counter = require("../models/Counter");

const syncOrderNumberCounter = async () => {
  const latestWithOrderNumber = await Order.findOne({
    orderNumber: { $exists: true, $ne: null },
  })
    .sort({ orderNumber: -1 })
    .select("orderNumber")
    .lean();

  const latestOrderNumber = latestWithOrderNumber?.orderNumber || 0;

  await Counter.findOneAndUpdate(
    { key: "orderNumber" },
    { $max: { value: latestOrderNumber } },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

const backfillMissingOrderNumbers = async () => {
  const ordersMissingNumber = await Order.find({
    $or: [{ orderNumber: null }, { orderNumber: { $exists: false } }],
  })
    .sort({ createdAt: 1, _id: 1 })
    .select("_id orderNumber");

  for (const order of ordersMissingNumber) {
    order.orderNumber = await Order.getNextOrderNumber();
    await order.save();
  }

  return ordersMissingNumber.length;
};

const ensureOrderIndexes = async () => {
  await Order.syncIndexes();
};

const ensureOrderNumbers = async () => {
  await syncOrderNumberCounter();
  const repairedCount = await backfillMissingOrderNumbers();
  await ensureOrderIndexes();

  if (repairedCount > 0) {
    console.log(`Backfilled ${repairedCount} orderNumber value(s)`);
  }
};

module.exports = {
  ensureOrderNumbers,
};
