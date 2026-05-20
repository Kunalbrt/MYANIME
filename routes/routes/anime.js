const express = require('express');
const router = express.Router();
const Anime = require('../models/Anime');
const { protect, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const anime = await Anime.find({ isPublished: true }).limit(20);
    res.json({ success: true, anime });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) return res.status(404).json({ success: false, message: 'Anime not found' });
    res.json({ success: true, anime });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', protect, requireAdmin, async (req, res) => {
  try {
    const anime = await Anime.create(req.body);
    res.status(201).json({ success: true, anime });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const anime = await Anime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, anime });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {
    await Anime.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Anime deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;