const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware'); // Import auth middleware

// Đăng ký tài khoản
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Get user info
router.get('/user', authenticate, authController.getUser);

// Delivery account routes (admin only)
router.post('/delivery/create', authenticate, authorizeAdmin, authController.createDeliveryAccount);
router.get('/delivery/accounts', authenticate, (req, res, next) => {
    // Allow both admin and customer service to access this endpoint
    if (req.user.role === 'admin' || req.user.role === 'customer_service') {
        next();
    } else {
        return res.status(403).json({ message: 'Not authorized to access delivery accounts' });
    }
}, authController.getAllDeliveryAccounts);

// Customer service account routes (admin only)
router.post('/customer-service/create', authenticate, authorizeAdmin, authController.createCustomerServiceAccount);
router.get('/customer-service/accounts', authenticate, authorizeAdmin, authController.getAllCustomerServiceAccounts);

module.exports = router;