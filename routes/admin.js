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

// Add season
router.post('/anime/:id/seasons', protect, requireAdmin, async (req, res) => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) return res.status(404).json({ success: false, message: 'Anime not found' });
    anime.seasons.push(req.body);
    await anime.save();
    res.json({ success: true, anime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add episode to season
router.post('/anime/:id/seasons/:seasonNumber/episodes', protect, requireAdmin, async (req, res) => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) return res.status(404).json({ success: false, message: 'Anime not found' });
    const season = anime.seasons.find(s => s.seasonNumber === parseInt(req.params.seasonNumber));
    if (!season) return res.status(404).json({ success: false, message: 'Season not found' });
    season.episodes.push(req.body);
    await anime.save();
    res.json({ success: true, anime });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



const Settings = require('../models/Settings');

router.get('/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: 'global' });
    if (!settings) settings = await Settings.create({ key: 'global' });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/settings', protect, requireAdmin, async (req, res) => {
  try {
    const { theme, branding, hero, siteedits, effects } = req.body;
    const update = { updatedAt: new Date() };
    if (theme !== undefined) update.theme = theme;
    if (branding !== undefined) update.branding = branding;
    if (hero !== undefined) update.hero = hero;
    if (siteedits !== undefined) update.siteedits = siteedits;
    if (effects !== undefined) update.effects = effects;
    await Settings.findOneAndUpdate(
      { key: 'global' },
      { theme: update.theme, branding: update.branding, hero: update.hero, siteedits: update.siteedits, effects: update.effects, updatedAt: update.updatedAt },
      { upsert: true, new: true }
    );
    const settings = await Settings.findOne({ key: 'global' });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
