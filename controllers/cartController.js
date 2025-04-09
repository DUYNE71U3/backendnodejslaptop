const Cart = require('../models/cart');

// Lấy giỏ hàng của người dùng
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log('Fetching cart for user ID:', userId);
        
        const cart = await Cart.find({ userId }).populate('productId', 'name price image brand');

        // Map qua các cart item để tạo định dạng phù hợp với frontend
        const cartWithDefaults = cart.map(item => ({
            _id: item._id,
            productId: item.productId._id,
            name: item.productId.name || 'Unknown Product',
            price: item.productId.price || 0,
            image: item.productId.image || null,
            brand: item.productId.brand || '',
            quantity: item.quantity,
            addedAt: item.addedAt
        }));

        console.log('Cart items returned:', cartWithDefaults.length);
        res.json(cartWithDefaults);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
};

// Thêm sản phẩm vào giỏ hàng
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        let cartItem = await Cart.findOne({ userId, productId });

        if (cartItem) {
            // Nếu sản phẩm đã có trong giỏ hàng, tăng số lượng
            cartItem.quantity += quantity;
            await cartItem.save();
            return res.status(200).json({ message: 'Cart updated', cartItem });
        } else {
            // Nếu sản phẩm chưa có trong giỏ hàng, tạo mới
            cartItem = new Cart({ userId, productId, quantity });
            await cartItem.save();
            return res.status(201).json({ message: 'Product added to cart', cartItem });
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding to cart' });
    }
};

// Xóa sản phẩm khỏi giỏ hàng
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.id;        
        const productId = req.params.productId;
        
        console.log(`Removing product from cart - userId: ${userId}, productId: ${productId}`);
        
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        const result = await Cart.deleteOne({ userId, productId });
        console.log('Delete result:', result);

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found in cart' });
        }

        res.status(200).json({ message: 'Product removed from cart' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Error removing from cart', error: error.message });
    }
};