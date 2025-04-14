const Post = require('../models/postModel');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Get all posts (with optional filtering)
exports.getAllPosts = async (req, res) => {
  try {
    // For public view, only show published posts
    const filter = req.user && req.user.role === 'admin' ? {} : { status: 'published' };
    
    const posts = await Post.find(filter)
      .populate('author', 'username')
      .populate('tags', 'name')
      .sort({ createdAt: -1 });
      
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
};

// Get a single post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    const post = await Post.findById(id)
      .populate('author', 'username')
      .populate('tags', 'name');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment view count
    if (!req.user || req.user.role !== 'admin') {
      post.views += 1;
      await post.save();
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post', error: error.message });
  }
};

// Create a new post (admin only)
exports.createPost = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { title, content, tags, status } = req.body;
    
    // Get image path if uploaded
    let thumbnail = null;
    if (req.file) {
      thumbnail = `/uploads/${req.file.filename}`;
      console.log('Thumbnail saved at:', thumbnail);
    }
    
    // Parse tags as array if provided as comma-separated string
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').filter(tag => tag.trim());
    }
    
    const post = new Post({
      title,
      content,
      thumbnail,
      author: req.user.id,
      tags: tagsArray,
      status: status || 'published'
    });
    
    await post.save();
    
    // Return the populated post
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username')
      .populate('tags', 'name');
    
    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(400).json({ message: 'Error creating post', error: error.message });
  }
};

// Update a post (admin only)
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating post ID:', id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    const { title, content, tags, status } = req.body;
    
    // Parse tags as array if provided as comma-separated string
    let tagsArray = [];
    if (tags) {
      tagsArray = tags.split(',').filter(tag => tag.trim());
    }
    
    const updateData = {
      title,
      content,
      status,
      tags: tagsArray
    };
    
    // Update thumbnail if a new one is uploaded
    if (req.file) {
      updateData.thumbnail = `/uploads/${req.file.filename}`;
      console.log('New thumbnail saved at:', updateData.thumbnail);
      
      // Delete old thumbnail if exists
      const oldPost = await Post.findById(id);
      if (oldPost && oldPost.thumbnail) {
        const oldThumbnailPath = path.join(__dirname, '..', oldPost.thumbnail.replace('/', '\\'));
        if (fs.existsSync(oldThumbnailPath)) {
          fs.unlinkSync(oldThumbnailPath);
          console.log('Deleted old thumbnail:', oldThumbnailPath);
        }
      }
    }
    
    const post = await Post.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('author', 'username')
    .populate('tags', 'name');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(400).json({ message: 'Error updating post', error: error.message });
  }
};

// Delete a post (admin only)
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    
    const post = await Post.findById(id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Delete thumbnail if exists
    if (post.thumbnail) {
      const thumbnailPath = path.join(__dirname, '..', post.thumbnail.replace('/', '\\'));
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        console.log('Deleted thumbnail:', thumbnailPath);
      }
    }
    
    await Post.findByIdAndDelete(id);
    
    res.json({ message: 'Post deleted successfully', post });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post', error: error.message });
  }
};

// Get posts by tag
exports.getPostsByTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ message: 'Invalid tag ID' });
    }
    
    // For public view, only show published posts
    const filter = {
      tags: tagId,
      ...((!req.user || req.user.role !== 'admin') && { status: 'published' })
    };
    
    const posts = await Post.find(filter)
      .populate('author', 'username')
      .populate('tags', 'name')
      .sort({ createdAt: -1 });
      
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts by tag:', error);
    res.status(500).json({ message: 'Error fetching posts by tag', error: error.message });
  }
};
