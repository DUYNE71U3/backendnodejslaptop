const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middlewares/authMiddleware');

// Get all reviews for a product (public)
router.get('/product/:productId', reviewController.getProductReviews);

// Get average rating for a product (public)
router.get('/product/:productId/rating', reviewController.getProductRating);

// Create a new review (authenticated)
router.post('/', authenticate, reviewController.createReview);

// Update a review (authenticated)
router.put('/:reviewId', authenticate, reviewController.updateReview);

// Delete a review (authenticated)
router.delete('/:reviewId', authenticate, reviewController.deleteReview);

module.exports = router;
