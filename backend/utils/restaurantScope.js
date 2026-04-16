const Restaurant = require("../models/Restaurant");

const ensureRestaurantForUser = async (req) => {
  if (req.user?.role === "owner" && req.user.restaurantId) {
    return { restaurantId: req.user.restaurantId, restaurant: null };
  }

  if (req.user?.role === "superadmin") {
    const publicId =
      req.query.restaurant ||
      req.query.restaurantId ||
      req.body?.restaurant ||
      req.body?.restaurantId ||
      null;

    if (!publicId) {
      return { restaurantId: null, restaurant: null };
    }

    const restaurant = await Restaurant.findOne({ publicRestaurantId: String(publicId) });
    return {
      restaurantId: restaurant?._id || null,
      restaurant,
    };
  }

  return { restaurantId: null, restaurant: null };
};

module.exports = { ensureRestaurantForUser };
