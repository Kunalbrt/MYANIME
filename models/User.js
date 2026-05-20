// ============================================
//  Model: User
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String, required: true, unique: true,
    trim: true, minlength: 3, maxlength: 30,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email']
  },
  password: {
    type: String, required: true, minlength: 6, select: false
  },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },

  // Watch history: [{ animeId, episodeId, progress (0-1), updatedAt }]
  watchHistory: [{
    anime: { type: mongoose.Schema.Types.ObjectId, ref: 'Anime' },
    episodeId: { type: String },
    progress: { type: Number, default: 0, min: 0, max: 1 },
    watchedSeconds: { type: Number, default: 0 },
    totalSeconds: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  }],

  // Favorites / My List
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Anime' }],

  // OTP for email verification
  otpCode: { type: String, select: false },
  otpExpiry: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },

  // Password reset
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpiry: { type: Date, select: false },

  // Account status
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Profile
  country: { type: String, default: '' },
  preferences: {
    theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    autoplay: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },

  // Login tracking
  lastLogin: { type: Date },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ip: String,
    userAgent: String,
    success: Boolean
  }]

}, { timestamps: true });

// ── Hash password before save ─────────────────
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare passwords ─────────────────────────
userSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// ── Safe user object (no sensitive fields) ────
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otpCode;
  delete obj.otpExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  return obj;
};

module.exports = mongoose.model('User', userSchema);