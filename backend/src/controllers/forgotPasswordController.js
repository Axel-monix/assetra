// src/controllers/forgotPasswordController.js
const bcrypt = require("bcrypt");
const pool = require("../config/db"); // pool pg yang sudah ada
const { generateVerificationCode, sendResetPasswordEmail } = require("../utils/mailer");
const resetCodeStore = require("../utils/resetCodeStore");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

// ============================================
// POST /api/auth/forgot-password
// { email } -> cek terdaftar, generate kode, kirim email
// ============================================
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { rows } = await pool.query(
      "SELECT id_user FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email tidak terdaftar.",
      });
    }

    const code = generateVerificationCode();
    resetCodeStore.setCode(normalizedEmail, code);

    const emailSent = await sendResetPasswordEmail(normalizedEmail, code);

    if (!emailSent) {
      resetCodeStore.deleteEntry(normalizedEmail);
      return res.status(500).json({
        success: false,
        message: "Gagal mengirim email verifikasi. Silakan coba lagi.",
      });
    }

    return res.json({
      success: true,
      message: "Kode verifikasi telah dikirim ke email kamu. Berlaku 5 menit.",
    });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

// ============================================
// POST /api/auth/forgot-password/verify
// { email, code } -> cek kode benar & belum kedaluwarsa
// ============================================
async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email dan kode verifikasi wajib diisi.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const entry = resetCodeStore.getEntry(normalizedEmail);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Kode verifikasi tidak ditemukan. Silakan minta kode baru.",
      });
    }

    if (resetCodeStore.isExpired(entry)) {
      resetCodeStore.deleteEntry(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: "Kode verifikasi sudah kedaluwarsa. Silakan minta kode baru.",
      });
    }

    if (entry.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Kode verifikasi salah. Silakan coba lagi.",
      });
    }

    resetCodeStore.markVerified(normalizedEmail);

    return res.json({
      success: true,
      message: "Kode verifikasi benar.",
    });
  } catch (err) {
    console.error("Error in verifyResetCode:", err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

// ============================================
// POST /api/auth/forgot-password/reset
// { email, code, newPassword } -> update password
// ============================================
async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, kode, dan password baru wajib diisi.",
      });
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const entry = resetCodeStore.getEntry(normalizedEmail);

    // Re-validasi kode di step terakhir ini juga (bukan cuma percaya step verify),
    // supaya endpoint ini tidak bisa dipanggil langsung tanpa verifikasi yang sah.
    if (!entry || resetCodeStore.isExpired(entry)) {
      return res.status(400).json({
        success: false,
        message: "Sesi reset password sudah kedaluwarsa. Silakan ulangi dari awal.",
      });
    }

    if (entry.code !== code || !entry.verified) {
      return res.status(400).json({
        success: false,
        message: "Kode verifikasi tidak valid.",
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
        message: "User tidak ditemukan.",
      });
    }

    resetCodeStore.deleteEntry(normalizedEmail);

    return res.json({
      success: true,
      message: "Password berhasil diganti.",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

module.exports = {
  forgotPassword,
  verifyResetCode,
  resetPassword,
};