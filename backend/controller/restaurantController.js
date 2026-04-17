const Restaurant = require("../models/Restaurant");
const cloudinary = require("../config/cloudinary");
const { syncRestaurantAccessKey } = require("../utils/accessKeys");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");
const { getTableSlug } = require("../utils/tableSlug");
const { ensureRestaurantTables } = require("../utils/ensureRestaurantTables");

const uploadRestaurantImage = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cafe-erp/restaurants",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });

const serializeRestaurant = (restaurant, tables = []) => ({
  _id: restaurant._id,
  brandName: restaurant.brandName,
  slug: restaurant.slug,
  publicRestaurantId: restaurant.publicRestaurantId,
  accessKey: restaurant.accessKey || "",
  logoUrl: restaurant.logoUrl || "",
  description: restaurant.description || "",
  active: restaurant.active,
  tables: tables.map((table) => ({
    _id: table._id,
    label: table.label,
    tableNumber: table.tableNumber,
    slug: getTableSlug(table),
    publicTableId: table.publicTableId,
    accessKey: table.accessKey || "",
    active: table.active,
  })),
});

const getCurrentRestaurant = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    await syncRestaurantAccessKey(restaurant);
    const tables = await ensureRestaurantTables({ restaurantId: restaurant._id });

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
    let uploadedImage = null;

    if (req.file) {
      uploadedImage = await uploadRestaurantImage(req.file.buffer);
    }

    if (brandName) restaurant.brandName = brandName;
    if (uploadedImage?.secure_url) {
      restaurant.logoUrl = uploadedImage.secure_url;
    } else if (logoUrl !== undefined) {
      restaurant.logoUrl = logoUrl;
    }
    if (description !== undefined) restaurant.description = description;

    await restaurant.save();
    await syncRestaurantAccessKey(restaurant);

    const tables = await ensureRestaurantTables({ restaurantId: restaurant._id });
    res.json({
      message: "Restaurant branding updated successfully",
      restaurant: serializeRestaurant(restaurant, tables),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCurrentRestaurant, updateCurrentRestaurant };
