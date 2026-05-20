const sendOTPEmail = async (email, otp, username) => { console.log(`OTP for ${email}: ${otp}`); return true; };
const sendPasswordResetEmail = async (email, resetUrl, username) => { console.log(`Reset link for ${email}: ${resetUrl}`); return true; };
module.exports = { sendOTPEmail, sendPasswordResetEmail };