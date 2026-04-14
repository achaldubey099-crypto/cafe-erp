const Menu = require('../models/Menu');
const cloudinary = require('../config/cloudinary');

const uploadImageToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'cafe-erp/menu',
        resource_type: 'image',
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
};

// ================= GET MENU (Search + Filter) =================
exports.getMenu = async (req, res) => {
  try {
    const { category, search, sort } = req.query;

    let filter = {};

    // 🔍 Search by name (case-insensitive)
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    // 📂 Filter by category (case-insensitive)
    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    let query = Menu.find(filter);

    // 🔃 Optional sorting
    if (sort === "price_asc") {
      query = query.sort({ price: 1 });
    } else if (sort === "price_desc") {
      query = query.sort({ price: -1 });
    }

    const menu = await query;

    // ✅ Keep response simple (better for frontend)
    res.json(menu);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= FEATURED ITEM =================
exports.getFeaturedItem = async (req, res) => {
  try {
    const featured = await Menu.findOne({ isFeatured: true });

    res.json(featured);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CREATE MENU ITEM =================
exports.createMenuItem = async (req, res) => {
  try {
    const { name, price, category, image, isFeatured } = req.body;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Name, price and category are required"
      });
    }

    let uploadedImage = null;

    if (req.file) {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ message: "Cloudinary is not configured" });
      }

      uploadedImage = await uploadImageToCloudinary(req.file.buffer);
    }

    const item = await Menu.create({
      name,
      price: Number(price),
      category,
      image: uploadedImage?.secure_url || image || "",
      imagePublicId: uploadedImage?.public_id || "",
      isFeatured: isFeatured || false
    });

    res.status(201).json({
      message: "Menu item created successfully",
      item
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
