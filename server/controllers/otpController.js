const { sql } = require('../db');
const { sendOTPEmail } = require('../utils/emailService');

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email already exists and is verified
    const existingUser = await sql.query`
      SELECT Id, IsEmailVerified FROM Users WHERE Email = ${email}
    `;

    if (existingUser.recordset.length > 0 && existingUser.recordset[0].IsEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing unused OTPs for this email
    await sql.query`
      DELETE FROM OTPVerification 
      WHERE Email = ${email} AND IsUsed = 0
    `;

    // Store OTP in database
    await sql.query`
      INSERT INTO OTPVerification (Email, OTP, ExpiresAt, IsUsed)
      VALUES (${email}, ${otp}, ${expiresAt}, 0)
    `;

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.json({ 
      message: 'OTP sent successfully to your email',
      success: true 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ 
      message: 'Failed to send OTP', 
      error: error.message 
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find valid OTP
    const otpRecord = await sql.query`
      SELECT Id, OTP, ExpiresAt, IsUsed 
      FROM OTPVerification 
      WHERE Email = ${email} AND OTP = ${otp} AND IsUsed = 0
      ORDER BY CreatedAt DESC
    `;

    if (otpRecord.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const record = otpRecord.recordset[0];

    // Check if OTP is expired
    if (new Date() > new Date(record.ExpiresAt)) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Mark OTP as used
    await sql.query`
      UPDATE OTPVerification 
      SET IsUsed = 1 
      WHERE Id = ${record.Id}
    `;

    // Update user's email verification status if user exists
    await sql.query`
      UPDATE Users 
      SET IsEmailVerified = 1 
      WHERE Email = ${email}
    `;

    res.json({ 
      message: 'OTP verified successfully',
      success: true 
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      message: 'Failed to verify OTP', 
      error: error.message 
    });
  }
};

// Check if email is verified
exports.checkEmailVerification = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await sql.query`
      SELECT IsEmailVerified FROM Users WHERE Email = ${email}
    `;

    if (user.recordset.length === 0) {
      return res.json({ isVerified: false, userExists: false });
    }

    res.json({ 
      isVerified: user.recordset[0].IsEmailVerified,
      userExists: true 
    });

  } catch (error) {
    console.error('Check email verification error:', error);
    res.status(500).json({ 
      message: 'Failed to check email verification', 
      error: error.message 
    });
  }
};