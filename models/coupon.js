const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true, min: 1, max: 100 },
    status: { type: String, enum: ['active', 'expired'], default: 'active' },
    expirationDate: { type: Date, required: true },
}, { 
    timestamps: true,
    suppressReservedKeysWarning: true // Thêm để tránh cảnh báo
});

module.exports = mongoose.model('Coupon', couponSchema);
