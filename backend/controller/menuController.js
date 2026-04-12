const Menu = require('../models/Menu');

// Get Menu (with filter + search)
exports.getMenu = async (req, res) => {
    try {
        const { category, search } = req.query;

        let filter = {};

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Search by name (case insensitive)
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }

        const menu = await Menu.find(filter);

        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Featured Item (for banner)
exports.getFeaturedItem = async (req, res) => {
    try {
        const featured = await Menu.findOne({ isFeatured: true });

        res.json(featured);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create Menu Item (for now via Postman)
exports.createMenuItem = async (req, res) => {
    try {
        const { name, price, category, image, isFeatured } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({
                message: "Name, price and category are required"
            });
        }

        const item = await Menu.create({
            name,
            price,
            category,
            image,
            isFeatured
        });

        res.status(201).json({
            message: "Menu item created successfully",
            item
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};