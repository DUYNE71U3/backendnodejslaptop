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
router.get('/delivery/accounts', authenticate, authorizeAdmin, authController.getAllDeliveryAccounts);

module.exports = router;