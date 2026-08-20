// src/utils/mailer.js
// Konfigurasi pengiriman email (Gmail) + generator kode verifikasi.
// Diadaptasi dari source code gmail yang sudah ada, dipakai bareng-bareng
// untuk semua fitur yang butuh kirim kode (forgot password, dll).

const nodemailer = require("nodemailer");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // App Password, bukan password akun asli
  },
});

function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendResetPasswordEmail(email, code) {
  try {
    await transporter.sendMail({
      from: `"AssetFlow Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Kode Reset Password - Berlaku 5 Menit",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Reset Password AssetFlow</h2>
          <p style="color: #666; font-size: 16px;">Halo,</p>
          <p style="color: #666; font-size: 16px;">Gunakan kode di bawah ini untuk mereset password akun kamu:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #999; font-size: 14px;">Kode ini hanya berlaku selama <strong>5 menit</strong>.</p>
          <p style="color: #999; font-size: 14px;">Kalau kamu tidak meminta reset password, abaikan email ini.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2026 AssetFlow</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Error sending reset password email:", err);
    return false;
  }
}

module.exports = {
  generateVerificationCode,
  sendResetPasswordEmail,
};