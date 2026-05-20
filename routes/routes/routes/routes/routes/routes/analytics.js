const express = require('express');
const router = express.Router();
const { Analytics } = require('../models/Analytics');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    const analytics = await Analytics.find(query).sort({ date: -1 }).limit(30);
    res.json({ success: true, analytics });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/track', async (req, res) => {
  try {
    const { type } = req.body;
    const today = new Date().toISOString().slice(0, 10);
    const update = {};
    if (type === 'visit') update.$inc = { visits: 1 };
    if (type === 'play') update.$inc = { plays: 1 };
    if (type === 'search') update.$inc = { searches: 1 };
    await Analytics.findOneAndUpdate({ date: today }, update, { upsert: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;