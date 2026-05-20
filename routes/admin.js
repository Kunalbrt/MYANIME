const express = require('express');
const router = express.Router();
const Anime = require('../models/Anime');
const { protect, requireAdmin } = require('../middleware/Auth');

router.get('/test', (req, res) => res.json({ message: 'admin placeholder route works!' }));

// Update anime
router.put('/anime/:id', protect, requireAdmin, async (req, res) => {
  try {
    const anime = await Anime.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    if (!anime) return res.status(404).json({ success: false, message: 'Anime not found' });
    res.json({ success: true, anime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete anime
router.delete('/anime/:id', protect, requireAdmin, async (req, res) => {
  try {
    await Anime.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Anime deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;