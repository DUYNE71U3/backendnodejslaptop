const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorizeAdmin, authorizeDelivery } = require('../middlewares/authMiddleware');

// Tạo đơn hàng mới (yêu cầu đăng nhập)
router.post('/', authenticate, orderController.createOrder);

// Lấy tất cả đơn hàng (chỉ admin)
router.get('/', authenticate, authorizeAdmin, orderController.getAllOrders);

// Lấy danh sách đơn hàng của người dùng (yêu cầu đăng nhập)
router.get('/user', authenticate, orderController.getUserOrders);

// Cập nhật trạng thái đơn hàng (chỉ admin)
router.put('/:orderId', authenticate, authorizeAdmin, orderController.updateOrderStatus);

// Delivery routes
router.post('/:orderId/assign-delivery', authenticate, authorizeAdmin, orderController.assignDelivery);
router.get('/delivery-orders', authenticate, authorizeDelivery, orderController.getDeliveryOrders);
router.put('/:orderId/delivery-status', authenticate, authorizeDelivery, orderController.updateDeliveryStatus);

module.exports = router;