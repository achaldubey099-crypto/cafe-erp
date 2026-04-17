const Table = require("../models/Table");
const Cafe = require("../models/Cafe");
const { syncTableAccessKeys } = require("./accessKeys");
const { getTableSlug } = require("./tableSlug");

const DEFAULT_TABLE_COUNT = 8;

const buildDefaultTables = ({ restaurantId, cafeId = null, count = DEFAULT_TABLE_COUNT }) =>
  Array.from({ length: count }, (_, index) => {
    const tableNumber = index + 1;
    return {
      restaurantId,
      cafeId,
      label: `Table ${tableNumber}`,
      tableNumber,
      slug: getTableSlug({ label: `Table ${tableNumber}`, tableNumber }),
      active: true,
    };
  });

const ensureRestaurantTables = async ({ restaurantId, cafeId = null, defaultCount = DEFAULT_TABLE_COUNT }) => {
  let tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });

  if (tables.length > 0) {
    await syncTableAccessKeys(tables);
    return tables;
  }

  let resolvedCafeId = cafeId;
  if (!resolvedCafeId) {
    const linkedCafe = await Cafe.findOne({ restaurantRef: restaurantId }, "_id").lean();
    resolvedCafeId = linkedCafe?._id || null;
  }

  await Table.insertMany(
    buildDefaultTables({
      restaurantId,
      cafeId: resolvedCafeId,
      count: defaultCount,
    })
  );

  tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });
  await syncTableAccessKeys(tables);
  return tables;
};

module.exports = {
  ensureRestaurantTables,
  DEFAULT_TABLE_COUNT,
};
