const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// Lấy tất cả danh mục (công khai)
router.get('/', categoryController.getAllCategories);

// Lấy một danh mục theo ID (công khai)
router.get('/:id', categoryController.getCategoryById);

// Tạo một danh mục mới (chỉ admin)
router.post('/', authenticate, authorizeAdmin, categoryController.createCategory);

// Cập nhật một danh mục (chỉ admin)
router.put('/:id', authenticate, authorizeAdmin, categoryController.updateCategory);

// Xóa một danh mục (chỉ admin)
router.delete('/:id', authenticate, authorizeAdmin, categoryController.deleteCategory);

module.exports = router;