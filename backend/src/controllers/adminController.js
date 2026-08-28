// src/controllers/adminController.js
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { logHistory } = require("../utils/historyLogger");

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function listAdmins(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, status, created_at, updated_at
       FROM users
       WHERE role = 'admin'
       ORDER BY created_at DESC`
    );

    return res.json({ success: true, message: "OK", data: rows });
  } catch (err) {
    console.error("Error in listAdmins:", err);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
}

async function createAdmin(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Nama, email, dan password wajib diisi." });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Format email tidak valid." });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ success: false, message: `Password minimal ${PASSWORD_MIN_LENGTH} karakter.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       RETURNING id, name, email, status, created_at`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const actorId = req.user?.id_user || req.user?.id || null;

    // HOOK: catat history penambahan admin
    await logHistory(pool, {
      type: "add_admin",
      idUser: rows[0].id,
      performedBy: actorId,
      subjectName: rows[0].name,
      description: "Penambahan admin baru",
    });

    return res.status(201).json({
      success: true,
      message: "Admin berhasil ditambahkan.",
      data: rows[0],
    });
  } catch (err) {
    console.error("Error in createAdmin:", err);
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Email sudah digunakan." });
    }
    return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  }
}

async function toggleAdminStatus(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { action, reason, type } = req.body;
    const actorId = req.user?.id_user || null;

    const { rows: targetRows } = await client.query(
      "SELECT id, name, role, status FROM users WHERE id = $1",
      [id]
    );
    if (targetRows.length === 0) {
      return res.status(404).json({ success: false, message: "Admin tidak ditemukan." });
    }
    if (targetRows[0].role !== "admin") {
      return res.status(403).json({ success: false, message: "Cuma akun dengan role admin yang bisa dikelola di sini." });
    }

    await client.query("BEGIN");

    if (action === "deactivate") {
      if (!reason || !reason.trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({ success: false, message: "Alasan menonaktifkan wajib diisi." });
      }
      const deactivationType = type === "permanent" ? "permanent" : "temporary";

      await client.query("UPDATE users SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

      await client.query(
        `INSERT INTO admin_deactivation (id_user, deactivation_type, reason, deactivated_by)
         VALUES ($1, $2, $3, $4)`,
        [id, deactivationType, reason.trim(), actorId]
      );

      // HOOK: catat history nonaktif admin, masih di dalam transaksi yang sama
      await logHistory(client, {
        type: "deactivate_admin",
        idUser: targetRows[0].id,
        performedBy: actorId,
        subjectName: targetRows[0].name,
        description: `Dinonaktifkan: ${reason.trim()}`,
      });
    } else if (action === "reactivate") {
      await client.query("UPDATE users SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
      await client.query(
        `UPDATE admin_deactivation
         SET reactivated_at = CURRENT_TIMESTAMP, reactivated_by = $2
         WHERE id = (
           SELECT id FROM admin_deactivation
           WHERE id_user = $1 AND reactivated_at IS NULL
           ORDER BY deactivated_at DESC
           LIMIT 1
         )`,
        [id, actorId]
      );
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "action harus 'deactivate' atau 'reactivate'." });
    }

    await client.query("COMMIT");

    return res.json({ success: true, message: "Status admin berhasil diperbarui." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in toggleAdminStatus:", err);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan pada server." });
  } finally {
    client.release();
  }
}

module.exports = { listAdmins, createAdmin, toggleAdminStatus };