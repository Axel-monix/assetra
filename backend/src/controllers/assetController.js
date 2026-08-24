const pool = require("../config/db");

async function listAssets(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, id_category, asset_name, asset_code, status,
              image_url, qr_code_url, created_at, updated_at
       FROM asset
       ORDER BY created_at DESC NULLS LAST, id DESC`,
    );

    const assets = rows.map((asset) => ({
      id: asset.asset_code,
      databaseId: asset.id,
      name: asset.asset_name,
      category: String(asset.id_category),
      status: asset.status || "Unknown",
      imageUrl: asset.image_url,
      qrCodeUrl: asset.qr_code_url,
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
      specs: {},
      treatmentHistory: [],
    }));

    return res.json({ success: true, message: "OK", data: assets });
  } catch (error) {
    console.error("Error in listAssets:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data asset.",
      data: null,
    });
  }
}

module.exports = { listAssets };
