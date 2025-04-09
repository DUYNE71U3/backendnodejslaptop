const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/authMiddleware');

// Lấy giỏ hàng của người dùng
router.get('/', authenticate, cartController.getCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', authenticate, cartController.addToCart);

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/remove/:productId', authenticate, cartController.removeFromCart);

// Áp dụng coupon giảm giá
router.post('/apply-coupon', authenticate, cartController.applyCoupon);

module.exports = router;