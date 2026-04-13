const Favorite = require('../models/Favorite');

// Add / Remove Favorite (Toggle)
exports.toggleFavorite = async (req, res) => {
    try {
        const { tableId, itemId } = req.body;

        if (!tableId || !itemId) {
            return res.status(400).json({ message: "tableId and itemId required" });
        }

        const existing = await Favorite.findOne({ tableId, itemId });

        if (existing) {
            await Favorite.deleteOne({ _id: existing._id });
            return res.json({ message: "Removed from favorites" });
        }

        const favorite = await Favorite.create({ tableId, itemId });

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
        const { tableId } = req.query;

        const favorites = await Favorite.find({ tableId })
            .populate('itemId'); // fetch menu details

        res.json(favorites);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};