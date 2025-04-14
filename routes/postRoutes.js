const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.get('/tag/:tagId', postController.getPostsByTag);

// Admin routes - require authentication and admin role
router.post('/', authenticate, authorizeAdmin, upload.single('thumbnail'), postController.createPost);
router.put('/:id', authenticate, authorizeAdmin, upload.single('thumbnail'), postController.updatePost);
router.delete('/:id', authenticate, authorizeAdmin, postController.deletePost);

module.exports = router;
