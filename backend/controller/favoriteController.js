const Favorite = require('../models/Favorite');

// Add / Remove Favorite (Toggle)
exports.toggleFavorite = async (req, res) => {
    try {
        const { userId, tableId, itemId } = req.body;

        if (!userId || !itemId) {
            return res.status(401).json({ message: "Authentication required to use favorites" });
        }

        // ensure favorites are per-user
        const existing = await Favorite.findOne({ userId, itemId });

        if (existing) {
            await Favorite.deleteOne({ _id: existing._id });
            return res.json({ message: "Removed from favorites" });
        }

        const favorite = await Favorite.create({ userId, tableId: tableId || null, itemId });

        res.json({
            message: "Added to favorites",
            favorite
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Favorites
exports.getFavorites = async (req, res) => {
    try {
        const { userId, tableId } = req.query;

        let filter = {};
        if (userId) {
            filter.userId = userId;
        } else if (tableId) {
            filter.tableId = tableId;
        } else {
            return res.json([]);
        }

        const favorites = await Favorite.find(filter)
            .populate('itemId'); // fetch menu details

        res.json(favorites);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};