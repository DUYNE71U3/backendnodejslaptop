const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');

// All tag routes require admin authentication
router.use(authenticate, authorizeAdmin);

// Get all tags
router.get('/', tagController.getAllTags);

// Create a new tag
router.post('/', tagController.createTag);

// Update a tag
router.put('/:id', tagController.updateTag);

// Delete a tag
router.delete('/:id', tagController.deleteTag);

// Update tag status
router.patch('/:id/status', tagController.updateTagStatus);

module.exports = router;
