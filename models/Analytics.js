// ============================================
//  Model: Analytics
// ============================================
const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },  // 'YYYY-MM-DD'
  visits: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  plays: { type: Number, default: 0 },
  searches: { type: Number, default: 0 },
  signups: { type: Number, default: 0 },

  // Per-anime views { animeId: count }
  animeViews: { type: Map, of: Number, default: {} },

  // Devices
  devices: {
    mobile: { type: Number, default: 0 },
    desktop: { type: Number, default: 0 },
    tablet: { type: Number, default: 0 }
  },

  // Countries { country: count }
  countries: { type: Map, of: Number, default: {} },

  // Search terms { term: count }
  searchTerms: { type: Map, of: Number, default: {} },

  // Watch time in seconds
  totalWatchTime: { type: Number, default: 0 }
}, { timestamps: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);


// ============================================
//  Model: Comment
// ============================================
const commentSchema = new mongoose.Schema({
  anime: { type: mongoose.Schema.Types.ObjectId, ref: 'Anime', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  episodeId: { type: String, default: null },    // null = general comment
  text: { type: String, required: true, maxlength: 1000, trim: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);


// ============================================
//  Model: SiteSettings (Admin-controlled)
// ============================================
const siteSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);


module.exports = { Analytics, Comment, SiteSettings };