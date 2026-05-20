// ============================================
//  Model: Anime
// ============================================

const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  episodeNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  videoUrl: { type: String, required: true },       // Cloudinary URL
  thumbnailUrl: { type: String, default: '' },
  duration: { type: Number, default: 0 },           // seconds
  subtitles: [{
    language: String,
    label: String,
    url: String                                      // .vtt subtitle file
  }],
  views: { type: Number, default: 0 },
  releaseDate: { type: Date }
}, { timestamps: true });

const seasonSchema = new mongoose.Schema({
  seasonNumber: { type: Number, required: true },
  title: { type: String, default: '' },
  episodes: [episodeSchema]
});

const animeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, lowercase: true },

  description: { type: String, default: '' },
  type: { type: String, enum: ['movie', 'series', 'ova', 'special'], default: 'series' },
  status: { type: String, enum: ['ongoing', 'completed', 'upcoming'], default: 'ongoing' },

  genre: [{ type: String, enum: ['action','adventure','romance','fantasy','thriller','horror','comedy','drama','sci-fi','mystery','slice-of-life','sports','mecha','psychological'] }],

  year: { type: Number },
  rating: { type: String, default: 'TV-14' },
  score: { type: Number, default: 0, min: 0, max: 10 },
  totalEpisodes: { type: Number, default: 0 },

  // Media
  thumbnailUrl: { type: String, default: '' },
  bannerUrl: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },

  // For movies — single video
  videoUrl: { type: String, default: '' },

  // For series — seasons/episodes
  seasons: [seasonSchema],

  // Flags
  isTrending: { type: Boolean, default: false },
  isTopRated: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },    // Hero banner
  isPublished: { type: Boolean, default: true },

  // Stats
  views: { type: Number, default: 0 },
  totalWatchTime: { type: Number, default: 0 },    // seconds
  favoritesCount: { type: Number, default: 0 },

  // Upload metadata
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cloudinaryPublicId: { type: String },

  // Studio info
  studio: { type: String, default: '' },
  director: { type: String, default: '' },

  // SEO
  tags: [String]

}, { timestamps: true });

// ── Auto-generate slug ────────────────────────
animeSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// ── Text search index ─────────────────────────
animeSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Anime', animeSchema);