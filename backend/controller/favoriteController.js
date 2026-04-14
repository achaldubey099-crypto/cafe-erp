const Favorite = require('../models/Favorite');

const serializeFavorite = (favorite) => {
    const item = favorite.itemId && typeof favorite.itemId === 'object'
        ? favorite.itemId
        : null;

    return {
        _id: favorite._id,
        userId: favorite.userId,
        tableId: favorite.tableId,
        itemId: item ? {
            _id: item._id,
            name: item.name || favorite.name,
            price: item.price ?? favorite.price,
            image: item.image || favorite.image,
            category: item.category,
        } : {
            _id: favorite.itemId,
            name: favorite.name,
            price: favorite.price,
            image: favorite.image,
        },
        createdAt: favorite.createdAt,
        updatedAt: favorite.updatedAt,
    };
};

// Add / Remove Favorite (Toggle)
exports.toggleFavorite = async (req, res) => {
    try {
        const { userId, tableId, itemId, name, price, image } = req.body;

        if (!userId || !itemId) {
            return res.status(401).json({ message: "Authentication required to use favorites" });
        }

        // ensure favorites are per-user
        const existing = await Favorite.findOne({ userId, itemId });

        if (existing) {
            await Favorite.deleteOne({ _id: existing._id });
            return res.json({ message: "Removed from favorites" });
        }

        const favorite = await Favorite.create({
            userId,
            tableId: tableId || null,
            itemId,
            name: name || '',
            price: Number(price) || 0,
            image: image || '',
        });

        const populatedFavorite = await favorite.populate('itemId', 'name price image category');

        res.json({
            message: "Added to favorites",
            favorite: serializeFavorite(populatedFavorite)
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
            .populate('itemId', 'name price image category')
            .sort({ createdAt: -1 }); // fetch menu details

        res.json(favorites.map(serializeFavorite));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
