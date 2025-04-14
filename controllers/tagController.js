const Tag = require('../models/tagModel');
const mongoose = require('mongoose');

// Get all tags
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ message: 'Error fetching tags', error });
  }
};

// Create a new tag
exports.createTag = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Check if tag already exists
    const existingTag = await Tag.findOne({ name });
    if (existingTag) {
      return res.status(400).json({ message: 'Tag with this name already exists' });
    }

    const tag = new Tag({
      name,
      description
    });

    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ message: 'Error creating tag', error });
  }
};

// Update a tag
exports.updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tag ID' });
    }
    
    // Check if name already exists (excluding the current tag)
    if (name) {
      const existingTag = await Tag.findOne({ name, _id: { $ne: id } });
      if (existingTag) {
        return res.status(400).json({ message: 'Tag with this name already exists' });
      }
    }

    const tag = await Tag.findByIdAndUpdate(
      id, 
      { name, description, status }, 
      { new: true }
    );

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ message: 'Error updating tag', error });
  }
};

// Delete a tag
exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tag ID' });
    }
    
    const tag = await Tag.findByIdAndDelete(id);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully', tag });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ message: 'Error deleting tag', error });
  }
};

// Update tag status
exports.updateTagStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid tag ID' });
    }
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const tag = await Tag.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('Error updating tag status:', error);
    res.status(500).json({ message: 'Error updating tag status', error });
  }
};
