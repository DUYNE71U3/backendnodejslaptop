const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorizeAdmin, authorizeDelivery, authorizeCustomerService } = require('../middlewares/authMiddleware');

// Tạo đơn hàng mới (yêu cầu đăng nhập)
router.post('/', authenticate, orderController.createOrder);

// Lấy tất cả đơn hàng (chỉ admin hoặc customer service)
router.get('/', authenticate, authorizeCustomerService, orderController.getAllOrders);

// Lấy danh sách đơn hàng của người dùng (yêu cầu đăng nhập)
router.get('/user', authenticate, orderController.getUserOrders);

// Cập nhật trạng thái đơn hàng (chỉ admin)
router.put('/:orderId', authenticate, authorizeAdmin, orderController.updateOrderStatus);

// Delivery routes
router.post('/:orderId/assign-delivery', authenticate, (req, res, next) => {
    // Allow both admin and customer service to assign delivery
    if (req.user.role === 'admin' || req.user.role === 'customer_service') {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized to assign delivery' });
    }
}, orderController.assignDelivery);

router.get('/delivery-orders', authenticate, authorizeDelivery, orderController.getDeliveryOrders);
router.put('/:orderId/delivery-status', authenticate, authorizeDelivery, orderController.updateDeliveryStatus);

// Customer service routes
router.get('/customer-service', authenticate, authorizeCustomerService, orderController.getAllOrders);
router.put('/:orderId/customer-note', authenticate, authorizeCustomerService, orderController.addCustomerNote);
router.put('/:orderId/status', authenticate, authorizeCustomerService, orderController.updateOrderStatus);

module.exports = router;