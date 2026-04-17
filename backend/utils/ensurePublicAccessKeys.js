const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");
const { syncRestaurantAccessKey, syncTableAccessKeys } = require("./accessKeys");

const ensurePublicAccessKeys = async () => {
  const restaurants = await Restaurant.find();
  const tables = await Table.find();

  await Promise.all([
    ...restaurants.map((restaurant) => syncRestaurantAccessKey(restaurant)),
    syncTableAccessKeys(tables),
  ]);
};

module.exports = {
  ensurePublicAccessKeys,
};
