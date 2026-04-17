const Cafe = require('../models/Cafe');

// Attach cafeId to request based on JWT payload or user fields
const attachCafe = async (req, res, next) => {
  try {
    // prefer explicit cafeId on req.user
    const user = req.user || {};
    const cafeId = user.cafeId || user.restaurantId || null;

    if (!cafeId) {
      req.cafeId = null;
      return next();
    }

    // verify cafe exists
    const cafe = await Cafe.findById(cafeId).lean();
    if (!cafe) {
      req.cafeId = null;
      return next();
    }

    req.cafe = cafe;
    req.cafeId = cafe._id;
    next();
  } catch (err) {
    next(err);
  }
};

// Helper to restrict mongoose queries to current cafe
const restrictFilter = (req, filter = {}) => {
  const cafeId = req.cafeId || (req.user && (req.user.cafeId || req.user.restaurantId));
  if (!cafeId) return filter;
  return { ...filter, cafeId };
};

// legacy Restaurant/Table helpers (kept here for tenant resolution)
const Restaurant = require("../models/Restaurant");
const Table = require("../models/Table");

const extractTenantKeys = (req) => {
  const restaurantPublicId =
    req.headers["x-restaurant-id"] ||
    req.query.restaurant ||
    req.query.restaurantId ||
    req.body?.restaurant ||
    req.body?.restaurantId ||
    null;

  const tablePublicId =
    req.headers["x-table-id"] ||
    req.query.table ||
    req.query.tableId ||
    req.body?.table ||
    req.body?.tableId ||
    null;

  return {
    restaurantPublicId: restaurantPublicId ? String(restaurantPublicId) : null,
    tablePublicId: tablePublicId ? String(tablePublicId) : null,
  };
};

const resolveTenantContext = async (req, res, next) => {
  try {
    const { restaurantPublicId, tablePublicId } = extractTenantKeys(req);

    if (!restaurantPublicId) {
      return res.status(400).json({ message: "restaurant identifier is required" });
    }

    const restaurant = await Restaurant.findOne({
      publicRestaurantId: restaurantPublicId,
      active: true,
    });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    let table = null;
    if (tablePublicId) {
      table = await Table.findOne({
        publicTableId: tablePublicId,
        restaurantId: restaurant._id,
        active: true,
      });

      if (!table) {
        return res.status(404).json({ message: "Table not found for this restaurant" });
      }
    }

    req.tenant = {
      restaurant,
      table,
      restaurantPublicId,
      tablePublicId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Export all helpers for tenant management
module.exports = {
  attachCafe,
  restrictFilter,
  extractTenantKeys,
  resolveTenantContext,
};
