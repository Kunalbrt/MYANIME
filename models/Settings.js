const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  theme: { type: Object, default: null },
  branding: { type: Object, default: null },
  hero: { type: String, default: null },
  siteedits: { type: Object, default: {} },
  effects: { type: Object, default: null },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Settings', SettingsSchema);