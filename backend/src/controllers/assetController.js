const pool = require("../config/db");
const { success, error } = require("../../constants/response");
const { generateQrPng } = require("../utils/qrGenerator"); // 🔄 CHANGED: generateQrCode -> generateQrPng
const { logHistory } = require("../utils/historyLogger");

function generateCodePrefix(name) {
  const cleaned = (name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (cleaned.slice(0, 3) || "AST").padEnd(3, "X");
}

function assetIdentifierClause(parameterIndex = 1) {
  return `(code = $${parameterIndex} OR id::text = $${parameterIndex})`;
}
function buildQrCodeUrl(code) {
  return `/api/assets/${code}/qr`;
}

async function listAssets(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT asset.id, asset.id_category, category.category_name,
              asset.name, asset.code, asset.status,
              asset.image_url, asset.created_at, asset.updated_at
             FROM asset
             LEFT JOIN category ON category.id = asset.id_category
      ORDER BY asset.created_at DESC NULLS LAST, asset.id DESC`,
    );

    const assets = rows.map((asset) => ({
      id: asset.code,
      databaseId: asset.id,
      name: asset.name,
      category: asset.category_name || String(asset.id_category),
      status: asset.status || "Unknown",
      imageUrl: asset.image_url,
      qrCodeUrl: buildQrCodeUrl(asset.code),
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

  const { name, id_category, status, image_url } = req.body;

  console.log("🔍 Parsed:", { name, id_category, status, image_url });

  if (!name || !name.trim()) {
    console.log("❌ Missing name");
    return error(res, { message: "Nama item wajib diisi.", statusCode: 400 });
  }
  if (!id_category) {
    console.log("❌ Missing id_category");
    return error(res, { message: "Kategori wajib dipilih.", statusCode: 400 });
  }
  let client;
  try {
    client = await pool.connect();
    const actorId = req.user?.id_user || req.user?.id || null;

    await client.query("BEGIN");
    const tempCode = `TMP-${Date.now()}`;

    const insertResult = await client.query(
      `INSERT INTO asset (id_category, name, code, status, image_url, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING id`,
      [
        id_category,
        name.trim(),
        tempCode,
        status || "functional",
        image_url || null,
        actorId,
      ],
    );

    const newId = insertResult.rows[0].id;

    const prefix = generateCodePrefix(name);
    const finalCode = `${prefix}-${String(newId).padStart(4, "0")}`;
    const { rows } = await client.query(
  
      `UPDATE asset
       SET code = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, id_category, name, code, status, image_url, created_at, updated_at`,
      [finalCode, newId],
    );

    await logHistory(client, {
      type: "add_item",
      idAsset: newId,
      performedBy: actorId,
      subjectName: rows[0].name,
      subjectCode: rows[0].code,
      description: "Penambahan item baru",
    });

    await client.query("COMMIT");

    return success(res, {
      message: "Item berhasil ditambahkan.",
      data: {
        ...rows[0],
        qrCodeUrl: buildQrCodeUrl(rows[0].code), 
      },
      statusCode: 201,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");
    console.error("Error in createAsset:", err);
    if (err.code === "23503") {
      return error(res, { message: "Kategori tidak valid.", statusCode: 400 });
    }
    return error(res, { message: "Gagal menambahkan item." });
  } finally {
    if (client) client.release();
  }
}

async function updateAsset(req, res) {
  const { id } = req.params;
  const {
    name,
    id_category,
    status,
    location,
    description,
    image_url,
    specs,
  } = req.body;

  if (!name || !name.trim()) {
    return error(res, { message: "Nama item wajib diisi.", statusCode: 400 });
  }
  if (!id_category) {
    return error(res, { message: "Kategori wajib dipilih.", statusCode: 400 });
  }

  try {
    const actorId = req.user?.id_user || req.user?.id || null;
    const { rows } = await pool.query(
      `UPDATE asset
       SET id_category = $1, name = $2, status = $3, image_url = $4,
           updated_by = $5, updated_at = CURRENT_TIMESTAMP
       WHERE ${assetIdentifierClause(6)}
       RETURNING id, id_category, name, code, status, image_url,
                 created_at, updated_at`,
      [
        id_category,
        name.trim(),
        status || "functional",
        image_url || null,
        actorId,
        id,
      ],
    );

    if (rows.length === 0) {
      return error(res, { message: "Item tidak ditemukan.", statusCode: 404 });
    }

    await logHistory(pool, {
      type: "edit_item",
      idAsset: rows[0].id,
      performedBy: actorId,
      subjectName: rows[0].name,
      subjectCode: rows[0].code,
      description: "Perubahan data item",
    });
    void location;
    void description;
    void specs;

    return success(res, {
      message: "Item berhasil diperbarui.",
      data: {
        ...rows[0],
        qrCodeUrl: buildQrCodeUrl(rows[0].code),
      },
    });
  } catch (err) {
    console.error("Error in updateAsset:", err);
    if (err.code === "23503") {
      return error(res, { message: "Kategori tidak valid.", statusCode: 400 });
    }
    return error(res, { message: "Gagal memperbarui item." });
  }
}

async function deactivateAssets(req, res) {
  const { ids, reason } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return error(res, { message: "Pilih minimal satu item.", statusCode: 400 });
  }
  if (!reason || reason.trim().length < 5) {
    return error(res, { message: "Alasan minimal 5 karakter.", statusCode: 400 });
  }

  try {
    const actorId = req.user?.id_user || req.user?.id || null;
    const { rows } = await pool.query(
      `UPDATE asset
       SET status = 'unavailable', updated_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE code = ANY($2::text[]) OR id::text = ANY($2::text[])
       RETURNING id, code, name`,
      [actorId, ids.map(String)],
    );

    if (rows.length !== ids.length) {
      return error(res, {
        message: "Satu atau beberapa item tidak ditemukan.",
        statusCode: 404,
      });
    }

    for (const row of rows) {
      await logHistory(pool, {
        type: "deactivate_item",
        idAsset: row.id,
        performedBy: actorId,
        subjectName: row.name,
        subjectCode: row.code,
        description: `Dinonaktifkan: ${reason.trim()}`,
      });
    }

    return success(res, {
      message: "Item berhasil ditandai tidak tersedia.",
      data: rows,
    });
  } catch (err) {
    console.error("Error in deactivateAssets:", err);
    return error(res, { message: "Gagal mengubah status item." });
  }
}
async function getAssetQrCode(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT code FROM asset WHERE ${assetIdentifierClause(1)}`,
      [id],
    );

    if (rows.length === 0) {
      return error(res, { message: "Item tidak ditemukan.", statusCode: 404 });
    }

    const pngBuffer = await generateQrPng(rows[0].code);

    res.set({
      "Content-Type": "image/png",
      
      "Cache-Control": "public, max-age=31536000, immutable",
    });

    return res.send(pngBuffer);
  } catch (err) {
    console.error("Error in getAssetQrCode:", err);
    return error(res, { message: "Gagal membuat QR code." });
  }
}

module.exports = {
  listAssets,
  createAsset,
  updateAsset,
  deactivateAssets,
  getAssetQrCode,
};