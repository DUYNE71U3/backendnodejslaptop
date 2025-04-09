const Wishlist = require('../models/wishlist');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching wishlist for user ID:', userId);
        
        const wishlist = await Wishlist.find({ userId }).populate('productId', 'name price image brand cpu ram storage gpu screen os');

        // Map wishlist items to format for frontend
        const wishlistWithDetails = wishlist.map(item => ({
            _id: item._id,
            productId: item.productId._id,
            name: item.productId.name || 'Unknown Product',
            price: item.productId.price || 0,
            image: item.productId.image || null,
            brand: item.productId.brand || '',
            cpu: item.productId.cpu || '',
            ram: item.productId.ram || '',
            storage: item.productId.storage || '',
            addedAt: item.addedAt
        }));

        console.log('Wishlist items returned:', wishlistWithDetails.length);
        res.json(wishlistWithDetails);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ message: 'Error fetching wishlist', error: error.message });
    }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Check if product already exists in wishlist
        const existingItem = await Wishlist.findOne({ userId, productId });
        
        if (existingItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // Add new item to wishlist
        const wishlistItem = new Wishlist({ userId, productId });
        await wishlistItem.save();
        
        return res.status(201).json({ message: 'Product added to wishlist', wishlistItem });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
    }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user.id;        
        const productId = req.params.productId;
        
        console.log(`Removing product from wishlist - userId: ${userId}, productId: ${productId}`);
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        const result = await Wishlist.deleteOne({ userId, productId });
        console.log('Delete result:', result);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found in wishlist' });
        }

        res.status(200).json({ message: 'Product removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
    }
};

// Move product from wishlist to cart
exports.moveToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        // Add to cart logic (this will be handled by the cart controller)
        // Here we're just removing from wishlist after successful cart addition
        const result = await Wishlist.deleteOne({ userId, productId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found in wishlist' });
        }

        res.status(200).json({ message: 'Product moved to cart' });
    } catch (error) {
        console.error('Error moving product to cart:', error);
        res.status(500).json({ message: 'Error moving product to cart', error: error.message });
    }
};
