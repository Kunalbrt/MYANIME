// ============================================
//  Controller: Auth
// ============================================

const crypto = require('crypto');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');
const { Analytics } = require('../models/Analytics');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const todayStr = () => new Date().toISOString().slice(0, 10);

// ── SIGNUP ─────────────────────────────────────
exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'Email' : 'Username';
      return res.status(409).json({ success: false, message: `${field} already in use.` });
    }
    const user = await User.create({ username, email, password, isEmailVerified: true });
    const today = todayStr();
    await Analytics.findOneAndUpdate({ date: today }, { $inc: { signups: 1 } }, { upsert: true });
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    res.status(201).json({ success: true, message: 'Account created successfully!', accessToken, refreshToken, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── VERIFY EMAIL OTP ───────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId).select('+otpCode +otpExpiry +otpAttempts');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });
    if (user.otpAttempts >= 5) return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
    if (user.otpCode !== otp) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpiry = undefined;
    user.otpAttempts = 0;
    await user.save();
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    res.json({ success: true, message: 'Email verified successfully!', accessToken, refreshToken, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── RESEND OTP ─────────────────────────────────
exports.resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId).select('+otpCode +otpExpiry +otpAttempts');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });
    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpAttempts = 0;
    await user.save();
    await sendOTPEmail(user.email, otp, user.username);
    res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (err) { next(err); }
};

// ── LOGIN ──────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── DEBUG (remove after fixing) ──
    console.log('Login attempt:', email);
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', !!user);
    if (user) {
      const match = await user.matchPassword(password);
      console.log('Password match:', match);
      console.log('Password in DB:', user.password?.substring(0, 10) + '...');
    }
    // ────────────────────────────────

    if (!user || !(await user.matchPassword(password))) {
      if (user) {
        user.loginHistory.push({ ip: req.ip, userAgent: req.headers['user-agent'], success: false });
        if (user.loginHistory.length > 20) user.loginHistory.shift();
        await user.save();
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });
    }

    if (!user.isEmailVerified) {
      const otp = generateOTP();
      user.otpCode = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      user.otpAttempts = 0;
      await user.save();
      await sendOTPEmail(user.email, otp, user.username);
      return res.status(403).json({ success: false, message: 'Please verify your email first. A new OTP has been sent.', requiresVerification: true, userId: user._id });
    }

    user.lastLogin = new Date();
    user.loginHistory.push({ ip: req.ip, userAgent: req.headers['user-agent'], success: true });
    if (user.loginHistory.length > 20) user.loginHistory.shift();
    await user.save();

    const today = todayStr();
    await Analytics.findOneAndUpdate({ date: today }, { $inc: { visits: 1 } }, { upsert: true });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    res.json({ success: true, accessToken, refreshToken, user: user.toSafeObject() });
  } catch (err) { next(err); }
};

// ── REFRESH TOKEN ──────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token.' });
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Invalid token.' });
    const newAccessToken = generateAccessToken(user._id, user.role);
    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// ── FORGOT PASSWORD ────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl, user.username);
    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

// ── RESET PASSWORD ─────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpiry: { $gt: Date.now() } }).select('+resetPasswordToken +resetPasswordExpiry');
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
};

// ── GET CURRENT USER ───────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites', 'title thumbnailUrl slug type');
    res.json({ success: true, user: user.toSafeObject() });
  } catch (err) { next(err); }
};