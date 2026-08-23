// src/controllers/forgotPasswordController.js
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { generateVerificationCode, sendResetPasswordEmail } = require("../utils/mailer");
const Resetcode = require("../utils/Resetcode"); 

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email Format Invalid.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email is not registered.",
      });
    }

    const code = generateVerificationCode();
    Resetcode.setCode(normalizedEmail, code);

    const emailSent = await sendResetPasswordEmail(normalizedEmail, code);

    if (!emailSent) {
      Resetcode.deleteEntry(normalizedEmail);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
      });
    }

    return res.json({
      success: true,
      message: "Code for reset password has been sent to your email. Valid for 5 minutes.",
    });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred on the server.",
    });
  }
}


async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const entry = Resetcode.getEntry(normalizedEmail);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Verification code not found. Please request a new code.",
      });
    }

    if (Resetcode.isExpired(entry)) {
      Resetcode.deleteEntry(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (entry.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please try again.",
      });
    }

    Resetcode.markVerified(normalizedEmail);

    return res.json({
      success: true,
      message: "Verification code is valid.",
    });
  } catch (err) {
    console.error("Error in verifyResetCode:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred on the server.",
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, verification code, and new password are required.",
      });
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters long.`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const entry = Resetcode.getEntry(normalizedEmail);
    if (!entry || Resetcode.isExpired(entry)) {
      return res.status(400).json({
        success: false,
        message: "The password reset session has expired. Please start over.",
      });
    }

    if (entry.code !== code || !entry.verified) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { rowCount } = await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [hashedPassword, normalizedEmail]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    Resetcode.deleteEntry(normalizedEmail);

    return res.json({
      success: true,
      message: "Password successfully changed.",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return res.status(500).json({
      success: false,
      message: "An error occurred on the server.",
    });
  }
}

module.exports = {
  forgotPassword,
  verifyResetCode,
  resetPassword,
};