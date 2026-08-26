const pool = require("../config/db");
const { success, error } = require("../../constants/response");
const { generateQrCode } = require("../utils/qrGenerator");

function generateCodePrefix(name) {
  const cleaned = (name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (cleaned.slice(0, 3) || "AST").padEnd(3, "X");
}

async function listAssets(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT asset.id, asset.id_category, category.category_name,
              asset.asset_name, asset.asset_code, asset.status,
              asset.image_url, asset.qr_code_url, asset.created_at, asset.updated_at
             FROM asset
             LEFT JOIN category ON category.id = asset.id_category
      ORDER BY asset.created_at DESC NULLS LAST, asset.id DESC`,
    );

    const assets = rows.map((asset) => ({
      id: asset.asset_code,
      databaseId: asset.id,
      name: asset.asset_name,
      category: asset.category_name || String(asset.id_category),
      status: asset.status || "Unknown",
      imageUrl: asset.image_url, // ← Ini udah bener
      qrCodeUrl: asset.qr_code_url,
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
      specs: {},
      treatmentHistory: [],
    }));

    return success(res, { data: assets });
  } catch (err) {
    console.error("Error in listAssets:", err);
    return error(res, { message: "Gagal mengambil data asset." });
  }
}

async function createAsset(req, res) {
  console.log("📥 Received createAsset request");
  console.log("📦 Body:", req.body);
  console.log("👤 User:", req.user);

  const { asset_name, id_category, status, image_url } = req.body;

  console.log("🔍 Parsed:", { asset_name, id_category, status, image_url });

  if (!asset_name || !asset_name.trim()) {
    console.log("❌ Missing asset_name");
    return error(res, { message: "Nama item wajib diisi.", statusCode: 400 });
  }
  if (!id_category) {
    console.log("❌ Missing id_category");
    return error(res, { message: "Kategori wajib dipilih.", statusCode: 400 });
  }
  const client = await pool.connect();
  try {
    const actorId = req.user?.id_user || req.user?.id || null;

    await client.query("BEGIN");
    const tempCode = `TMP-${Date.now()}`;

    const insertResult = await client.query(
      `INSERT INTO asset (id_category, asset_name, asset_code, status, image_url, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING id`,
      [
        id_category,
        asset_name.trim(),
        tempCode,
        status || "functional",
        image_url || null,
        actorId,
      ],
    );

    const newId = insertResult.rows[0].id;

    const prefix = generateCodePrefix(asset_name);
    const finalCode = `${prefix}-${String(newId).padStart(4, "0")}`;

    const qrCodeUrl = await generateQrCode(finalCode);

    const { rows } = await client.query(
      `UPDATE asset
       SET asset_code = $1, qr_code_url = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, id_category, asset_name, asset_code, status, image_url, qr_code_url, created_at, updated_at`,
      [finalCode, qrCodeUrl, newId],
    );

    await client.query("COMMIT");

    return success(res, {
      message: "Item berhasil ditambahkan.",
      data: rows[0],
      statusCode: 201,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in createAsset:", err);
    if (err.code === "23503") {
      return error(res, { message: "Kategori tidak valid.", statusCode: 400 });
    }
    return error(res, { message: "Gagal menambahkan item." });
  } finally {
    client.release();
  }
}

module.exports = { listAssets, createAsset };
