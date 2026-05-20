const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Anime = require('../models/Anime');
const { Analytics, SiteSettings } = require('../models/Analytics');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAnime = await Anime.countDocuments();
    const today = new Date().toISOString().slice(0, 10);
    const todayStats = await Analytics.findOne({ date: today });
    res.json({ success: true, stats: { totalUsers, totalAnime, todayVisits: todayStats?.visits || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt').limit(50);
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.get('/settings/:key', async (req, res) => {
  try {
    const setting = await SiteSettings.findOne({ key: req.params.key });
    res.json({ success: true, value: setting?.value });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await SiteSettings.findOneAndUpdate({ key }, { value, updatedBy: req.user._id }, { upsert: true, new: true });
    res.json({ success: true, setting });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;