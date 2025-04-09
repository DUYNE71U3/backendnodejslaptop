const Coupon = require('../models/coupon');

// Create a new coupon
exports.createCoupon = async (req, res) => {
    try {
        console.log('Creating coupon with data:', req.body);
        const { code, discount, expirationDate } = req.body;
        
        // Kiểm tra các trường bắt buộc
        if (!code) {
            return res.status(400).json({ message: 'Coupon code is required' });
        }
        
        if (!discount || isNaN(discount) || discount <= 0 || discount > 100) {
            return res.status(400).json({ message: 'Discount must be a number between 1 and 100' });
        }
        
        if (!expirationDate) {
            return res.status(400).json({ message: 'Expiration date is required' });
        }
        
        // Kiểm tra định dạng ngày
        const expDate = new Date(expirationDate);
        if (isNaN(expDate.getTime())) {
            return res.status(400).json({ message: 'Invalid expiration date format' });
        }
        
        // Tạo coupon mới
        const coupon = new Coupon({
            code,
            discount: Number(discount),
            expirationDate: expDate
        });
        
        console.log('Coupon to save:', coupon);
        
        await coupon.save();
        res.status(201).json({ message: 'Coupon created successfully', coupon });
    } catch (error) {
        console.error('Error creating coupon:', error);
        
        // Xử lý lỗi mongo
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        
        // Xử lý lỗi trùng mã coupon
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Coupon code already exists' });
        }
        
        res.status(500).json({ message: 'Error creating coupon', error: error.message });
    }
};

// Get all coupons
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Error fetching coupons', error });
    }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const coupon = await Coupon.findByIdAndUpdate(id, updatedData, { new: true });
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon updated successfully', coupon });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: 'Error updating coupon', error });
    }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ message: 'Error deleting coupon', error });
    }
};

// Update coupon status
exports.updateCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const coupon = await Coupon.findByIdAndUpdate(id, { status }, { new: true });
        if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
        res.json({ message: 'Coupon status updated successfully', coupon });
    } catch (error) {
        console.error('Error updating coupon status:', error);
        res.status(500).json({ message: 'Error updating coupon status', error });
    }
};
