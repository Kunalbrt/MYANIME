const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { username, avatar, country, preferences } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { username, avatar, country, preferences }, { new: true });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/favorites/:animeId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.favorites.includes(req.params.animeId)) {
      user.favorites.push(req.params.animeId);
      await user.save();
    }
    res.json({ success: true, favorites: user.favorites });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/favorites/:animeId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.favorites = user.favorites.filter(id => id.toString() !== req.params.animeId);
    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/watch-history', protect, async (req, res) => {
  try {
    const { animeId, episodeId, progress, watchedSeconds } = req.body;
    const user = await User.findById(req.user._id);
    const existingIndex = user.watchHistory.findIndex(w => w.anime.toString() === animeId && w.episodeId === episodeId);
    if (existingIndex >= 0) {
      user.watchHistory[existingIndex] = { anime: animeId, episodeId, progress, watchedSeconds, updatedAt: new Date() };
    } else {
      user.watchHistory.unshift({ anime: animeId, episodeId, progress, watchedSeconds });
      if (user.watchHistory.length > 50) user.watchHistory.pop();
    }
    await user.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;