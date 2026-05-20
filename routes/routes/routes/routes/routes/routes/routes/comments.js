const express = require('express');
const router = express.Router();
const { Comment } = require('../models/Analytics');
const { protect } = require('../middleware/auth');

router.get('/anime/:animeId', async (req, res) => {
  try {
    const { episodeId } = req.query;
    const query = { anime: req.params.animeId, isDeleted: false };
    if (episodeId) query.episodeId = episodeId;
    const comments = await Comment.find(query).populate('user', 'username avatar').sort('-createdAt').limit(100);
    res.json({ success: true, comments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { animeId, episodeId, text } = req.body;
    const comment = await Comment.create({ anime: animeId, episodeId, text, user: req.user._id });
    await comment.populate('user', 'username avatar');
    res.status(201).json({ success: true, comment });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    comment.isDeleted = true;
    await comment.save();
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    const hasLiked = comment.likes.includes(req.user._id);
    if (hasLiked) {
      comment.likes = comment.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      comment.likes.push(req.user._id);
    }
    await comment.save();
    res.json({ success: true, likes: comment.likes.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;