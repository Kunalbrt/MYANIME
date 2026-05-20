const express = require('express');
const router = express.Router();
const { signup, verifyEmail, resendOTP, login, refreshToken, forgotPassword, resetPassword, getMe } = require('../controllers/Authcontroller');
const { protect } = require('../middleware/Auth');

router.post('/signup', signup);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

module.exports = router;

const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => res.json({ message: 'auth placeholder route works!' }));

module.exports = router;
