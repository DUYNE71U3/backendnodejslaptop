const Product = require('../models/product');

// Lấy tất cả sản phẩm
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

// Lấy một sản phẩm theo ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product', error });
    }
};

// Tạo một sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        console.log('Request Body:', req.body);
        console.log('Uploaded File:', req.file);

        const {
            name,
            brand,
            price,
            isNew,
            category,
            cpu,
            ram,
            storage,
            gpu,
            screen,
            ports,
            os,
            weight,
            dimensions,
            battery,
            warranty,
        } = req.body;

        const image = req.file ? `/uploads/${req.file.filename}` : null;

        const product = new Product({
            name,
            brand,
            price,
            isNew,
            category,
            cpu,
            ram,
            storage,
            gpu,
            screen,
            ports,
            os,
            weight,
            dimensions,
            battery,
            warranty,
            image,
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({ message: 'Error creating product', error });
    }
};

// Cập nhật một sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedData = { ...req.body }; // Chỉ lấy các trường được gửi từ frontend

        const product = await Product.findByIdAndUpdate(id, updatedData, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });

        res.json(product);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error });
    }
};

// Xóa một sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error });
    }
};

// Lấy sản phẩm theo category
exports.getProductsByCategory = async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const products = await Product.find({ category: categoryId }).populate('category');
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products by category', error });
    }
};