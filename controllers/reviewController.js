const Review = require('../models/review');
const User = require('../models/user');

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId })
            .populate('userId', 'username')
            .sort({ createdAt: -1 });
        
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews', error });
    }
};

// Create a new review
exports.createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user.id;
        
        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }
        
        const review = new Review({
            userId,
            productId,
            rating,
            comment
        });
        
        await review.save();
        
        // Return the new review with user information
        const populatedReview = await Review.findById(review._id).populate('userId', 'username');
        
        res.status(201).json(populatedReview);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ message: 'Error creating review', error });
    }
};

// Update a review
exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;
        
        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this review' });
        }
        
        review.rating = rating;
        review.comment = comment;
        await review.save();
        
        const updatedReview = await Review.findById(reviewId).populate('userId', 'username');
        
        res.json(updatedReview);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Error updating review', error });
    }
};

// Delete a review
exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;
        
        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        if (review.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this review' });
        }
        
        await Review.findByIdAndDelete(reviewId);
        
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Error deleting review', error });
    }
};

// Get average rating for a product
exports.getProductRating = async (req, res) => {
    try {
        const { productId } = req.params;
        
        const result = await Review.aggregate([
            { $match: { productId: mongoose.Types.ObjectId(productId) } },
            { $group: { 
                _id: "$productId", 
                averageRating: { $avg: "$rating" },
                reviewCount: { $sum: 1 }
            }}
        ]);
        
        if (result.length === 0) {
            return res.json({ averageRating: 0, reviewCount: 0 });
        }
        
        res.json({
            averageRating: result[0].averageRating,
            reviewCount: result[0].reviewCount
        });
    } catch (error) {
        console.error('Error calculating product rating:', error);
        res.status(500).json({ message: 'Error calculating product rating', error });
    }
};
