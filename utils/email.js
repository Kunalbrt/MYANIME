// ============================================
//  Utils: Email (Nodemailer)
// ============================================

const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send OTP verification email
 */
const sendOTPEmail = async (email, otp, username) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🔐 MyAnime — Your Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: 'Inter', Arial, sans-serif; background: #0d0d0d; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #181818; border-radius: 12px; overflow: hidden; }
        .header { background: #e50914; padding: 32px; text-align: center; }
        .header h1 { color: white; font-size: 28px; margin: 0; letter-spacing: 2px; }
        .body { padding: 40px 32px; color: #e5e5e5; }
        .body h2 { color: white; margin-top: 0; }
        .otp-box { background: #222; border: 2px solid #e50914; border-radius: 10px;
          text-align: center; padding: 24px; margin: 24px 0; }
        .otp-code { font-size: 42px; font-weight: 900; color: white; letter-spacing: 12px; }
        .otp-expire { color: #999; font-size: 13px; margin-top: 10px; }
        .footer { background: #111; padding: 16px 32px; color: #555; font-size: 12px; text-align: center; }
      </style></head>
      <body>
        <div class="container">
          <div class="header"><h1>⚔️ MYANIME</h1></div>
          <div class="body">
            <h2>Hi ${username || 'there'}!</h2>
            <p>Here's your one-time verification code:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
              <div class="otp-expire">Expires in 10 minutes</div>
            </div>
            <p style="color:#999;font-size:13px">If you didn't request this, ignore this email. Never share this code with anyone.</p>
          </div>
          <div class="footer">© ${new Date().getFullYear()} MyAnime. All rights reserved.</div>
        </div>
      </body>
      </html>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent to ${email}`);
  } catch (err) {
    logger.error('Email send failed:', err.message);
    throw new Error('Failed to send email. Please try again.');
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetUrl, username) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🔑 MyAnime — Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head><style>
        body { font-family: Arial, sans-serif; background: #0d0d0d; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #181818; border-radius: 12px; overflow: hidden; }
        .header { background: #e50914; padding: 32px; text-align: center; }
        .header h1 { color: white; font-size: 28px; margin: 0; letter-spacing: 2px; }
        .body { padding: 40px 32px; color: #e5e5e5; }
        .btn { display: inline-block; background: #e50914; color: white; text-decoration: none;
          padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 15px; margin: 20px 0; }
        .footer { background: #111; padding: 16px; color: #555; font-size: 12px; text-align: center; }
      </style></head>
      <body>
        <div class="container">
          <div class="header"><h1>⚔️ MYANIME</h1></div>
          <div class="body">
            <h2 style="color:white">Hi ${username || 'there'}!</h2>
            <p>We received a request to reset your password. Click below to set a new password:</p>
            <div style="text-align:center">
              <a href="${resetUrl}" class="btn">Reset Password</a>
            </div>
            <p style="color:#999;font-size:13px">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
          </div>
          <div class="footer">© ${new Date().getFullYear()} MyAnime. All rights reserved.</div>
        </div>
      </body>
      </html>
    `
  };
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  } catch (err) {
    logger.error('Password reset email failed:', err.message);
    throw new Error('Failed to send reset email. Please try again.');
  }
};

module.exports = { sendOTPEmail, sendPasswordResetEmail };