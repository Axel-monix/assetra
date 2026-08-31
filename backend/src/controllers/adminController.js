// src/controllers/adminController.js

const bcrypt = require("bcrypt");

const pool = require("../config/db");

const { logHistory } = require("../utils/historyLogger");

const PASSWORD_MIN_LENGTH = 8;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function listAdmins(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, email, status, created_at, updated_at
      FROM users
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `);

    return res.json({
      success: true,
      message: "OK",
      data: rows,
    });
  } catch (err) {
    console.error("Error in listAdmins:", err);

    return res.status(500).json({
      success: false,
      message: "internalError",
    });
  }
}

async function createAdmin(req, res) {
  try {
    const { name, email, password } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "requiredFields",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: "invalidEmail",
      });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "passwordMinLength",
        params: {
          min: PASSWORD_MIN_LENGTH,
        },
      });
    }

    // =========================
    // HASH PASSWORD
    // =========================

    const hashedPassword = await bcrypt.hash(password, 10);

    // =========================
    // INSERT ADMIN
    // =========================

    const { rows } = await pool.query(
      `
        INSERT INTO users (
          name,
          email,
          password,
          role,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          'admin',
          'active'
        )
        RETURNING id, name, email, status, created_at
      `,
      [name.trim(), email.trim().toLowerCase(), hashedPassword],
    );

    const actorId = req.user?.id_user || req.user?.id || null;

    // =========================
    // HISTORY
    // =========================

    await logHistory(pool, {
      type: "add_admin",
      idUser: rows[0].id,
      performedBy: actorId,
      subjectName: rows[0].name,
      description: "Penambahan admin baru",
    });

    // =========================
    // SUCCESS
    // =========================

    return res.status(201).json({
      success: true,
      message: "adminCreated",
      data: rows[0],
    });
  } catch (err) {
    console.error("Error in createAdmin:", err);

    // Email duplicate
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "emailAlreadyUsed",
      });
    }

    return res.status(500).json({
      success: false,
      message: "internalError",
    });
  }
}

async function toggleAdminStatus(req, res) {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { action, reason, type } = req.body;

    const actorId = req.user?.id_user || req.user?.id || null;

    // =========================
    // FIND ADMIN
    // =========================

    const { rows: targetRows } = await client.query(
      `
        SELECT id, name, role, status
        FROM users
        WHERE id = $1
      `,
      [id],
    );

    if (targetRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "adminNotFound",
      });
    }

    // =========================
    // CHECK ROLE
    // =========================

    if (targetRows[0].role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "invalidAdminRole",
      });
    }

    await client.query("BEGIN");

    // =========================
    // DEACTIVATE
    // =========================

    if (action === "deactivate") {
      if (!reason || !reason.trim()) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "deactivationReasonRequired",
        });
      }

      const deactivationType = type === "permanent" ? "permanent" : "temporary";

      await client.query(
        `
          UPDATE users
          SET
            status = 'inactive',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [id],
      );

      await client.query(
        `
          INSERT INTO admin_deactivation (
            id_user,
            deactivation_type,
            reason,
            deactivated_by
          )
          VALUES ($1, $2, $3, $4)
        `,
        [id, deactivationType, reason.trim(), actorId],
      );

      await logHistory(client, {
        type: "deactivate_admin",
        idUser: targetRows[0].id,
        performedBy: actorId,
        subjectName: targetRows[0].name,
        description: `Dinonaktifkan: ${reason.trim()}`,
      });
    }

    // =========================
    // REACTIVATE
    // =========================
    else if (action === "reactivate") {
      await client.query(
        `
          UPDATE users
          SET
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
        [id],
      );

      await client.query(
        `
          UPDATE admin_deactivation
          SET
            reactivated_at = CURRENT_TIMESTAMP,
            reactivated_by = $2
          WHERE id = (
            SELECT id
            FROM admin_deactivation
            WHERE id_user = $1
              AND reactivated_at IS NULL
            ORDER BY deactivated_at DESC
            LIMIT 1
          )
        `,
        [id, actorId],
      );
    }

    // =========================
    // INVALID ACTION
    // =========================
    else {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "invalidAction",
      });
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "statusUpdated",
    });
  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Error in toggleAdminStatus:", err);

    return res.status(500).json({
      success: false,
      message: "internalError",
    });
  } finally {
    client.release();
  }
}

module.exports = {
  listAdmins,
  createAdmin,
  toggleAdminStatus,
};
