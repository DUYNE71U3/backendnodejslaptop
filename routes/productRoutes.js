const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Lấy tất cả sản phẩm (công khai)
router.get('/', productController.getAllProducts);

// Lấy một sản phẩm theo ID (công khai)
router.get('/:id', productController.getProductById);

// Lấy sản phẩm theo category (công khai)
router.get('/category/:categoryId', productController.getProductsByCategory);

// Thêm sản phẩm (chỉ admin, kèm upload file)
router.post('/', authenticate, authorizeAdmin, upload.single('image'), productController.createProduct);

// Cập nhật sản phẩm (chỉ admin)
router.put('/:id', authenticate, authorizeAdmin, upload.single('image'), productController.updateProduct);

// Xóa sản phẩm (chỉ admin)
router.delete('/:id', authenticate, authorizeAdmin, productController.deleteProduct);

module.exports = router;