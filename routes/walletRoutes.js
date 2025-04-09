const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middlewares/authMiddleware');

// Get wallet balance
router.get('/balance', authenticate, walletController.getWalletBalance);

// Create payment request
router.post('/create_payment_url', authenticate, walletController.createPaymentRequest);

// Handle VNPAY IPN
router.get('/vnpay_ipn', walletController.vnpayIpn);

// Handle VNPAY return callback
router.get('/vnpay_return', walletController.handleCallback);

// For backward compatibility (if return URL includes /api/wallet prefix)
router.get('/payment-callback', walletController.handleCallback);

module.exports = router;