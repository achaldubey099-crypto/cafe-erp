const Cafe = require('../models/Cafe');
const { buildRestaurantAccessKey, buildTableAccessKey } = require("../utils/accessKeys");
const { getTableSlug } = require("../utils/tableSlug");

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
  const restaurantAccessKey =
    req.headers["x-restaurant-access-key"] ||
    req.query.restaurantAccessKey ||
    req.query.cafeAccessKey ||
    req.body?.restaurantAccessKey ||
    req.body?.cafeAccessKey ||
    req.params?.restaurantAccessKey ||
    null;

  const restaurantPublicId =
    req.headers["x-restaurant-id"] ||
    req.query.restaurant ||
    req.query.restaurantId ||
    req.body?.restaurant ||
    req.body?.restaurantId ||
    null;

  const restaurantSlug =
    req.headers["x-restaurant-slug"] ||
    req.query.restaurantSlug ||
    req.query.slug ||
    req.body?.restaurantSlug ||
    req.body?.slug ||
    req.params?.restaurantSlug ||
    null;

  const tableAccessKey =
    req.headers["x-table-access-key"] ||
    req.query.tableAccessKey ||
    req.query.accessKey ||
    req.query.key ||
    req.body?.tableAccessKey ||
    req.body?.accessKey ||
    req.params?.tableAccessKey ||
    req.params?.accessKey ||
    null;

  const tablePublicId =
    req.headers["x-table-id"] ||
    req.query.table ||
    req.query.tableId ||
    req.body?.table ||
    req.body?.tableId ||
    null;

  const tableSlug =
    req.headers["x-table-slug"] ||
    req.query.tableSlug ||
    req.body?.tableSlug ||
    req.params?.tableSlug ||
    null;

  return {
    restaurantAccessKey: restaurantAccessKey ? String(restaurantAccessKey) : null,
    restaurantPublicId: restaurantPublicId ? String(restaurantPublicId) : null,
    tablePublicId: tablePublicId ? String(tablePublicId) : null,
    restaurantSlug: restaurantSlug ? String(restaurantSlug) : null,
    tableAccessKey: tableAccessKey ? String(tableAccessKey) : null,
    tableSlug: tableSlug ? String(tableSlug) : null,
  };
};

const findRestaurantByAccessKey = async (restaurantAccessKey) => {
  let restaurant = await Restaurant.findOne({ accessKey: restaurantAccessKey, active: true });
  if (restaurant) {
    return restaurant;
  }

  const candidates = await Restaurant.find({ active: true });

  for (const candidate of candidates) {
    const candidateAccessKey = buildRestaurantAccessKey(candidate);
    if (candidate.accessKey !== candidateAccessKey) {
      candidate.accessKey = candidateAccessKey;
      await candidate.save();
    }

    if (candidateAccessKey === restaurantAccessKey) {
      restaurant = candidate;
      break;
    }
  }

  return restaurant;
};

const findTableByAccessKey = async (tableAccessKey) => {
  let table = await Table.findOne({ accessKey: tableAccessKey, active: true });
  if (table) {
    return table;
  }

  const candidates = await Table.find({ active: true });

  for (const candidate of candidates) {
    const candidateAccessKey = buildTableAccessKey(candidate);
    if (candidate.accessKey !== candidateAccessKey) {
      candidate.accessKey = candidateAccessKey;
      await candidate.save();
    }

    if (candidateAccessKey === tableAccessKey) {
      table = candidate;
      break;
    }
  }

  return table;
};

const resolveTenantContext = async (req, res, next) => {
  try {
    const {
      restaurantAccessKey,
      restaurantPublicId,
      tableAccessKey,
      tablePublicId,
      restaurantSlug,
      tableSlug,
    } = extractTenantKeys(req);

    if (!restaurantAccessKey && !restaurantPublicId && !restaurantSlug && !tableAccessKey) {
      return res.status(400).json({ message: "restaurant or table access identifier is required" });
    }

    let restaurant = null;
    let table = null;

    if (tableAccessKey) {
      table = await findTableByAccessKey(tableAccessKey);
      if (!table) {
        return res.status(404).json({ message: "Table not found for this access key" });
      }

      restaurant = await Restaurant.findOne({
        _id: table.restaurantId,
        active: true,
      });
    } else if (restaurantAccessKey) {
      restaurant = await findRestaurantByAccessKey(restaurantAccessKey);
    } else {
      restaurant = restaurantSlug
        ? await Restaurant.findOne({
            slug: restaurantSlug,
            active: true,
          })
        : await Restaurant.findOne({
            publicRestaurantId: restaurantPublicId,
            active: true,
          });
    }

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (!table && (tableSlug || tablePublicId)) {
      if (tableSlug) {
        const tables = await Table.find({
          restaurantId: restaurant._id,
          active: true,
        }).lean();
        table = tables.find((entry) => getTableSlug(entry) === String(tableSlug)) || null;
      } else {
        table = await Table.findOne({
          publicTableId: tablePublicId,
          restaurantId: restaurant._id,
          active: true,
        });
      }

      if (!table) {
        return res.status(404).json({ message: "Table not found for this restaurant" });
      }
    }

    req.tenant = {
      restaurant,
      table,
      restaurantAccessKey: restaurant.accessKey || restaurantAccessKey || null,
      restaurantPublicId,
      tableAccessKey: table?.accessKey || tableAccessKey || null,
      tablePublicId,
      restaurantSlug: restaurant.slug || restaurantSlug || null,
      tableSlug: table ? getTableSlug(table) : tableSlug || null,
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
