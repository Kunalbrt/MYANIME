const express = require('express');
const router = express.Router();
const Anime = require('../models/Anime');
const { protect, requireAdmin } = require('../middleware/Auth');

// ── Get all anime ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const anime = await Anime.find({ isPublished: true });
    res.json({ success: true, anime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get single anime ──────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) return res.status(404).json({ success: false, message: 'Anime not found' });
    res.json({ success: true, anime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Add new anime (admin only) ────────────────
router.post('/', protect, requireAdmin, async (req, res) => {
  try {
    const anime = await Anime.create(req.body);
    res.status(201).json({ success: true, anime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── Update anime (a// -- Update anime (admin only) --
router.patch('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const anime = await Anime.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!anime) return res.status(404).json({ success: false, message: 'Anime not found' });
    res.json({ success: true, anime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
