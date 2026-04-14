const Menu = require('../models/Menu');
const cloudinary = require('../config/cloudinary');
const csvParser = require('csv-parser');
const fs = require('fs');

// ================= CLOUDINARY UPLOAD =================
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

// ================= GET MENU =================
exports.getMenu = async (req, res) => {
  try {
    const { category, search, sort } = req.query;

    let filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = { $regex: `^${category}$`, $options: "i" };
    }

    let query = Menu.find(filter);

    if (sort === "price_asc") {
      query = query.sort({ price: 1 });
    } else if (sort === "price_desc") {
      query = query.sort({ price: -1 });
    }

    const menu = await query;
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

    if (!name || !price || !category) {
      return res.status(400).json({
        message: "Name, price and category are required"
      });
    }

    let uploadedImage = null;

    if (req.file) {
      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        return res.status(500).json({ message: "Cloudinary not configured" });
      }

      uploadedImage = await uploadImageToCloudinary(req.file.buffer);
    }

    const item = await Menu.create({
      name,
      price: Number(price),
      category: category.trim(),

      // 🔥 FIXED IMAGE (100% RELIABLE)
      image:
        uploadedImage?.secure_url ||
        image ||
        `https://picsum.photos/400?random=${Math.floor(Math.random() * 10000)}`,

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

// ================= 🔥 BULK UPLOAD MENU =================
exports.bulkUploadMenu = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => {
        try {
          const cleanedItem = {
            name: data.name?.trim(),
            price: Number(data.price),
            category: data.category?.trim(),

            // 🔥 FIXED AUTO IMAGE (NO UNSPLASH)
            image:
              data.image ||
              `https://picsum.photos/400?random=${Math.floor(Math.random() * 10000)}`,

            isFeatured: false
          };

          if (!cleanedItem.name || !cleanedItem.price || !cleanedItem.category) {
            return;
          }

          results.push(cleanedItem);

        } catch (err) {
          console.log("Row error:", err);
        }
      })
      .on('end', async () => {
        try {
          await Menu.insertMany(results);

          res.json({
            message: "Menu uploaded successfully",
            count: results.length
          });

        } catch (err) {
          res.status(500).json({ message: err.message });
        }
      });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};