const crypto = require("crypto");

const ACCESS_KEY_VERSION = "v1";

const getAccessSecret = () =>
  process.env.PUBLIC_ACCESS_SECRET ||
  process.env.JWT_SECRET ||
  "cafe-erp-public-access-secret";

const createAccessKey = (type, values = []) =>
  crypto
    .createHmac("sha256", getAccessSecret())
    .update([ACCESS_KEY_VERSION, type, ...values.map((value) => String(value || ""))].join(":"))
    .digest("hex");

const buildRestaurantAccessKey = (restaurant) =>
  createAccessKey("restaurant", [restaurant.publicRestaurantId || restaurant._id]);

const buildTableAccessKey = (table) =>
  createAccessKey("table", [table.restaurantId || "", table.publicTableId || table._id]);

const syncRestaurantAccessKey = async (restaurant) => {
  if (!restaurant) {
    return restaurant;
  }

  const nextAccessKey = buildRestaurantAccessKey(restaurant);

  if (restaurant.accessKey === nextAccessKey) {
    return restaurant;
  }

  restaurant.accessKey = nextAccessKey;

  if (typeof restaurant.save === "function") {
    await restaurant.save();
  }

  return restaurant;
};

const syncTableAccessKeys = async (tables = []) => {
  const syncTasks = tables.map(async (table) => {
    if (!table) {
      return table;
    }

    const nextAccessKey = buildTableAccessKey(table);
    if (table.accessKey === nextAccessKey) {
      return table;
    }

    table.accessKey = nextAccessKey;

    if (typeof table.save === "function") {
      await table.save();
    }

    return table;
  });

  return Promise.all(syncTasks);
};

module.exports = {
  buildRestaurantAccessKey,
  buildTableAccessKey,
  syncRestaurantAccessKey,
  syncTableAccessKeys,
};
