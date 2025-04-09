const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1 }
    }],
    shippingAddress: {
        address: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true }
    },
    paymentMethod: { type: String, enum: ['COD', 'VNPAY'], required: true },
    totalPrice: { type: Number, required: true },
    status: { 
        type: String, 
        enum: [
            'Pending', 
            'Processing', 
            'Ready for Delivery',
            'Assigned to Delivery', 
            'Delivery Accepted',
            'Out for Delivery',
            'Delivered', 
            'Delivery Failed',
            'Cancelled'
        ], 
        default: 'Pending' 
    },
    deliveryPerson: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryStatus: {
        type: String,
        enum: ['Not Assigned', 'Assigned', 'Accepted', 'Rejected', 'In Transit', 'Delivered', 'Failed'],
        default: 'Not Assigned'
    },
    deliveryNotes: { type: String },
    deliveryAttempts: { type: Number, default: 0 },
    deliveryDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);