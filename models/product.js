const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    isNew: { type: Boolean, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    cpu: { type: String, required: true },
    ram: { type: String, required: true },
    storage: { type: String, required: true },
    gpu: { type: String, required: false },
    screen: { type: String, required: true },
    ports: { type: String, required: false },
    os: { type: String, required: true },
    weight: { type: String, required: false },
    dimensions: { type: String, required: false },
    battery: { type: String, required: false },
    warranty: { type: String, required: false },
    image: { type: String }, // Thêm trường image
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);