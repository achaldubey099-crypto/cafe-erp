const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");

const serializeRestaurant = (restaurant, tables = []) => ({
  _id: restaurant._id,
  brandName: restaurant.brandName,
  slug: restaurant.slug,
  publicRestaurantId: restaurant.publicRestaurantId,
  logoUrl: restaurant.logoUrl || "",
  description: restaurant.description || "",
  active: restaurant.active,
  tables: tables.map((table) => ({
    _id: table._id,
    label: table.label,
    tableNumber: table.tableNumber,
    publicTableId: table.publicTableId,
    active: table.active,
  })),
});

const getCurrentRestaurant = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    const [restaurant, tables] = await Promise.all([
      Restaurant.findById(restaurantId),
      Table.find({ restaurantId }).sort({ tableNumber: 1 }),
    ]);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(serializeRestaurant(restaurant, tables));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCurrentRestaurant = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const { brandName, logoUrl, description } = req.body;
    if (brandName) restaurant.brandName = brandName;
    if (logoUrl !== undefined) restaurant.logoUrl = logoUrl;
    if (description !== undefined) restaurant.description = description;

    await restaurant.save();

    const tables = await Table.find({ restaurantId }).sort({ tableNumber: 1 });
    res.json({
      message: "Restaurant branding updated successfully",
      restaurant: serializeRestaurant(restaurant, tables),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCurrentRestaurant, updateCurrentRestaurant };
