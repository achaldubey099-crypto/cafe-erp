const Menu = require("../models/Menu");
const Table = require("../models/Table");
const cloudinary = require("../config/cloudinary");
const csvParser = require("csv-parser");
const fs = require("fs");
const { syncRestaurantAccessKey } = require("../utils/accessKeys");
const { ensureRestaurantForUser } = require("../utils/restaurantScope");
const { getTableSlug } = require("../utils/tableSlug");
const { ensureRestaurantTables } = require("../utils/ensureRestaurantTables");

const uploadImageToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cafe-erp/menu",
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

const applyMenuFilters = (filter, { category, search }) => {
  const nextFilter = { ...filter };

  if (search) {
    nextFilter.name = { $regex: search, $options: "i" };
  }

  if (category && category !== "All") {
    nextFilter.category = { $regex: `^${category}$`, $options: "i" };
  }

  return nextFilter;
};

exports.getPublicMenu = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const restaurant = req.tenant?.restaurant;
    const table = req.tenant?.table;

    // Debug log to trace which tenant keys are being used
    console.log('Fetching public menu for restaurantPublicId:', req.query.restaurant || req.body?.restaurant || req.tenant?.restaurant?.publicRestaurantId || req.cafeId, 'tablePublicId:', req.query.table || req.body?.table || req.tenant?.table?.publicTableId);

    if (!restaurant || !table) {
      return res.status(400).json({ message: "Restaurant and table access are required" });
    }

    let filter = applyMenuFilters({ restaurantId: restaurant._id }, { category, search });
    let query = Menu.find(filter);

    if (sort === "price_asc") query = query.sort({ price: 1 });
    if (sort === "price_desc") query = query.sort({ price: -1 });

    const menu = await query.lean();
    const featuredItem = menu.find((item) => item.isFeatured) || null;

    res.json({
      restaurant: {
        brandName: restaurant.brandName,
        logoUrl: restaurant.logoUrl || "",
        slug: restaurant.slug || "",
        accessKey: restaurant.accessKey || "",
        publicRestaurantId: restaurant.publicRestaurantId,
        description: restaurant.description || "",
      },
      table: {
        label: table.label,
        tableNumber: table.tableNumber,
        accessKey: table.accessKey || "",
        slug: req.tenant?.tableSlug || "",
        publicTableId: table.publicTableId,
      },
      featuredItem,
      menu,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublicRestaurantEntry = async (req, res) => {
  try {
    const restaurant = req.tenant?.restaurant;

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    await syncRestaurantAccessKey(restaurant);
    const tables = (await ensureRestaurantTables({ restaurantId: restaurant._id }))
      .map((table) => table.toObject ? table.toObject() : table)
      .filter((table) => table.active !== false);

    const firstTable = tables[0] || null;

    res.json({
      restaurant: {
        brandName: restaurant.brandName,
        slug: restaurant.slug || "",
        accessKey: restaurant.accessKey || "",
        logoUrl: restaurant.logoUrl || "",
      },
      firstTable: firstTable
        ? {
            label: firstTable.label,
            tableNumber: firstTable.tableNumber,
            accessKey: firstTable.accessKey || "",
            slug: getTableSlug(firstTable),
            publicTableId: firstTable.publicTableId,
            url: `/access/${firstTable.accessKey}`,
          }
        : null,
      tables: tables.map((table) => ({
        label: table.label,
        tableNumber: table.tableNumber,
        accessKey: table.accessKey || "",
        slug: getTableSlug(table),
        publicTableId: table.publicTableId,
        url: `/access/${table.accessKey}`,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const { restaurantId } = await ensureRestaurantForUser(req);

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required for admin menu access" });
    }

    let filter = applyMenuFilters({ restaurantId }, { category, search });
    let query = Menu.find(filter);

    if (sort === "price_asc") query = query.sort({ price: 1 });
    if (sort === "price_desc") query = query.sort({ price: -1 });

    const menu = await query;
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFeaturedItem = async (req, res) => {
  try {
    const restaurantId = req.tenant?.restaurant?._id || (await ensureRestaurantForUser(req)).restaurantId;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    const featured = await Menu.findOne({ restaurantId, isFeatured: true });
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { name, price, category, image, isFeatured } = req.body;
    const { restaurantId } = await ensureRestaurantForUser(req);

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    if (!name || !price || !category) {
      return res.status(400).json({ message: "Name, price and category are required" });
    }

    let uploadedImage = null;
    if (req.file) {
      uploadedImage = await uploadImageToCloudinary(req.file.buffer);
    }

    const item = await Menu.create({
      restaurantId,
      name,
      price: Number(price),
      category: category.trim(),
      image:
        uploadedImage?.secure_url ||
        image ||
        `https://picsum.photos/400?random=${Math.floor(Math.random() * 10000)}`,
      imagePublicId: uploadedImage?.public_id || "",
      isFeatured: String(isFeatured) === "true",
    });

    res.status(201).json({ message: "Menu item created successfully", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, image, isFeatured } = req.body;
    const { restaurantId } = await ensureRestaurantForUser(req);

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    const item = await Menu.findOne({ _id: id, restaurantId });
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    let uploadedImage = null;
    if (req.file) {
      uploadedImage = await uploadImageToCloudinary(req.file.buffer);
    }

    item.name = name?.trim() || item.name;
    item.category = category?.trim() || item.category;
    item.price = price !== undefined && price !== "" ? Number(price) : item.price;
    item.isFeatured = isFeatured !== undefined ? String(isFeatured) === "true" : item.isFeatured;

    if (uploadedImage?.secure_url) {
      item.image = uploadedImage.secure_url;
      item.imagePublicId = uploadedImage.public_id || "";
    } else if (image) {
      item.image = image;
    }

    await item.save();
    res.json({ message: "Menu item updated successfully", item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = await ensureRestaurantForUser(req);

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    const item = await Menu.findOneAndDelete({ _id: id, restaurantId });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkUploadMenu = async (req, res) => {
  try {
    const { restaurantId } = await ensureRestaurantForUser(req);
    const cafeId = req.cafeId || null;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant context is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const results = [];

    const cleanupUploadedFile = () => {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
    };

    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on("data", (data) => {
        const imageUrl =
          data.image?.trim() ||
          data.imageUrl?.trim() ||
          data.imageURL?.trim() ||
          data.image_url?.trim() ||
          "";
        const featuredValue = String(data.isFeatured ?? data.featured ?? "").trim().toLowerCase();
        const parsedPrice = Number(data.price);
        const itemName = data.name?.trim();
        const placeholderText = encodeURIComponent(itemName || data.category?.trim() || "Menu Item");
        const cleanedItem = {
          restaurantId,
          cafeId,
          name: itemName,
          price: parsedPrice,
          category: data.category?.trim(),
          image: imageUrl || `https://placehold.co/400x400/F5F1E8/2D2418/png?text=${placeholderText}`,
          isFeatured: ["true", "1", "yes"].includes(featuredValue),
        };

        if (!cleanedItem.name || !Number.isFinite(cleanedItem.price) || !cleanedItem.category) {
          return;
        }

        results.push(cleanedItem);
      })
      .on("end", async () => {
        try {
          await Menu.insertMany(results);
          cleanupUploadedFile();
          res.json({ message: "Menu uploaded successfully", count: results.length });
        } catch (err) {
          cleanupUploadedFile();
          res.status(500).json({ message: err.message });
        }
      })
      .on("error", (err) => {
        cleanupUploadedFile();
        res.status(500).json({ message: err.message });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
