const express = require('express');
const { createCoupon, getCoupons, updateCoupon, deleteCoupon, updateCouponStatus } = require('../controllers/couponController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Admin-only routes
router.post('/', authenticate, authorizeAdmin, createCoupon);
router.get('/', authenticate, authorizeAdmin, getCoupons);
router.put('/:id', authenticate, authorizeAdmin, updateCoupon);
router.delete('/:id', authenticate, authorizeAdmin, deleteCoupon);
router.patch('/:id/status', authenticate, authorizeAdmin, updateCouponStatus);

module.exports = router;
