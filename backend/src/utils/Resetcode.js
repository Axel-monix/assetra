const pool = require("../config/db");

const CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 menit

async function setCode(email, code) {
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS);
  // hanya 1 kode aktif per email
  await pool.query(`DELETE FROM password_reset_requests WHERE email = $1`, [email]);
  await pool.query(
    `INSERT INTO password_reset_requests (email, code, expires_at)
     VALUES ($1, $2, $3)`,
    [email, code, expiresAt]
  );
}

async function getEntry(email) {
  const result = await pool.query(
    `SELECT code, expires_at, verified
     FROM password_reset_requests
     WHERE email = $1
     ORDER BY created_at DESC LIMIT 1`,
    [email]
  );
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    code: row.code,
    expiresAt: new Date(row.expires_at).getTime(), 
    verified: row.verified,
  };
}

async function markVerified(email) {
  await pool.query(
    `UPDATE password_reset_requests SET verified = true WHERE email = $1`,
    [email]
  );
}

async function deleteEntry(email) {
  await pool.query(`DELETE FROM password_reset_requests WHERE email = $1`, [email]);
}
function isExpired(entry) {
  return !entry || entry.expiresAt < Date.now();
}

module.exports = {
  setCode,
  getEntry,
  markVerified,
  deleteEntry,
  isExpired,
};