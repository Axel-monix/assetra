const pool = require("../config/db");
const { generateVerificationCode, sendEmailChangeVerification } = require("../utils/mailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const getUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, status, created_at, updated_at
      FROM users
      ORDER BY id ASC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// PATCH /api/users/me — ganti nama sendiri, tanpa approval
const updateOwnName = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: "Nama wajib diisi." });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, status`,
      [name.trim(), userId]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memperbarui nama" });
  }
};

// POST /api/users/me/email-change/request
const requestEmailChange = async (req, res) => {
  const { newEmail } = req.body;
  const userId = req.user.id;

  if (!newEmail || !EMAIL_REGEX.test(newEmail)) {
    return res.status(400).json({ success: false, message: "Format email tidak valid." });
  }

  try {
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1 AND id != $2`,
      [newEmail, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Email sudah digunakan." });
    }

    const lastRequest = await pool.query(
      `SELECT created_at FROM email_change_requests
       WHERE id_user = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    if (lastRequest.rows.length > 0) {
      const secondsSinceLast =
        (Date.now() - new Date(lastRequest.rows[0].created_at).getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          success: false,
          message: `Tunggu ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} detik sebelum mengirim ulang.`,
        });
      }
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await pool.query(`DELETE FROM email_change_requests WHERE id_user = $1`, [userId]);
    await pool.query(
      `INSERT INTO email_change_requests (id_user, new_email, code, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, newEmail, code, expiresAt]
    );

    const sent = await sendEmailChangeVerification(newEmail, code);
    if (!sent) {
      return res.status(500).json({ success: false, message: "Gagal mengirim email verifikasi." });
    }

    res.json({ success: true, message: "Kode verifikasi telah dikirim." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memproses permintaan." });
  }
};

// POST /api/users/me/email-change/verify
const verifyEmailChange = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ success: false, message: "Kode wajib diisi." });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM email_change_requests
       WHERE id_user = $1 AND verified = false
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    const request = result.rows[0];

    if (!request || new Date(request.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Kode verifikasi salah atau sudah kedaluwarsa.",
      });
    }
    if (request.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Kode verifikasi salah atau sudah kedaluwarsa.",
      });
    }

    const updated = await pool.query(
      `UPDATE users SET email = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, status`,
      [request.new_email, userId]
    );

    await pool.query(`DELETE FROM email_change_requests WHERE id_user = $1`, [userId]);

    res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memverifikasi kode." });
  }
};

module.exports = {
  getUsers,
  updateOwnName,
  requestEmailChange,
  verifyEmailChange,
};