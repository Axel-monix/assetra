const pool = require("../config/db");
const { randomInt } = require("node:crypto");
const { success, error } = require("../../constants/response");
const { generateQrPng } = require("../utils/qrGenerator");
const { logHistory } = require("../utils/historyLogger");

function generateCodePrefix(name) {
  const cleaned = (name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  return (cleaned.slice(0, 3) || "AST").padEnd(3, "X");
}

function generateAssetCode(name) {
  const prefix = generateCodePrefix(name);
  const random = String(randomInt(1000, 10000));

  return `${prefix}-${random}`;
}

function assetIdentifierClause(parameterIndex = 1) {
  return `(code = $${parameterIndex} OR id::text = $${parameterIndex})`;
}
function buildQrCodeUrl(code) {
  const apiUrl = process.env.API_URL || "http://localhost:5000";

  return `${apiUrl}/api/assets/${encodeURIComponent(code)}/qr`;
}

/**
 * specs yang diterima dari frontend berbentuk:
 *   [{ id_specification: number, value: string }, ...]
 * (lihat lib/itemHelper.js -> buildSpecsPayload)
 *
 * Sebelum disimpan, tiap id_specification divalidasi harus benar-benar
 * milik category dari asset yang bersangkutan (NFR-03 referential
 * integrity) dan diambil `name`-nya untuk cache spec_key.
 */
async function replaceAssetSpecifications(
  client,
  { idAsset, idCategory, specs },
) {
  await client.query(`DELETE FROM asset_specification WHERE id_asset = $1`, [
    idAsset,
  ]);

  if (!Array.isArray(specs) || specs.length === 0) return;

  const idSpecifications = specs
    .map((spec) => Number(spec.id_specification))
    .filter((id) => Number.isInteger(id));

  if (idSpecifications.length === 0) return;

  const { rows: validSpecs } = await client.query(
    `SELECT id, name
     FROM category_specification
     WHERE id_category = $1 AND id = ANY($2::int[])`,
    [idCategory, idSpecifications],
  );

  const validSpecMap = new Map(validSpecs.map((row) => [row.id, row.name]));

  for (const spec of specs) {
    const idSpecification = Number(spec.id_specification);
    const specName = validSpecMap.get(idSpecification);

    // Lewati spec yang bukan milik category ini (mis. sisa dari
    // category lama sebelum item dipindah kategori).
    if (!specName) continue;

    const value = spec.value == null ? "" : String(spec.value).trim();

    if (!value) continue;

    await client.query(
      `INSERT INTO asset_specification (id_asset, id_specification, spec_key, spec_value)
       VALUES ($1, $2, $3, $4)`,
      [idAsset, idSpecification, specName, value],
    );
  }
}

/**
 * Menyimpan hasil Need Repair modal: satu row di `reason`
 * (action='need_repair') + banyak row di `reason_specification`
 * untuk tiap specification yang dicentang (FR-REP-01..FR-REP-10).
 *
 * repair: { details: string, specIds: number[] }
 */
async function saveRepairDetails(
  client,
  { idAsset, idCategory, actorId, repair },
) {
  const specIds = Array.isArray(repair?.specIds)
    ? repair.specIds.map(Number).filter((n) => Number.isInteger(n))
    : [];

  const details = (repair?.details || "").trim();

  if (specIds.length === 0 && !details) {
    const err = new Error(
      "Detail masalah wajib diisi jika tidak ada bagian yang dipilih.",
    );
    err.code = "NEED_REPAIR_VALIDATION";
    throw err;
  }

  const { rows: reasonRows } = await client.query(
    `INSERT INTO reason (id_asset, id_user, action, reason)
     VALUES ($1, $2, 'need_repair', $3)
     RETURNING id`,
    [idAsset, actorId, details || null],
  );

  const idReason = reasonRows[0].id;

  if (specIds.length === 0) return;

  const { rows: validSpecs } = await client.query(
    `SELECT id, name
     FROM category_specification
     WHERE id_category = $1 AND repairable = true AND id = ANY($2::int[])`,
    [idCategory, specIds],
  );

  for (const spec of validSpecs) {
    await client.query(
      `INSERT INTO reason_specification (id_reason, id_specification, specification_name)
       VALUES ($1, $2, $3)`,
      [idReason, spec.id, spec.name],
    );
  }
}

function specsToMap(specs) {
  return new Map(
    (Array.isArray(specs) ? specs : []).map((spec) => [
      Number(spec.id_specification),
      String(spec.value ?? "").trim(),
    ]),
  );
}

function buildAssetEditDescription({
  previousAsset,
  nextAsset,
  previousSpecs,
  nextSpecs,
  repair,
  damagedSpecifications,
}) {
  const changedFields = [];

  if (previousAsset.name !== nextAsset.name) changedFields.push("name");
  if (Number(previousAsset.id_category) !== Number(nextAsset.id_category)) {
    changedFields.push("category");
  }
  if (previousAsset.location !== nextAsset.location)
    changedFields.push("location");
  if (previousAsset.image_url !== nextAsset.image_url)
    changedFields.push("image");
  if (
    JSON.stringify([...specsToMap(previousSpecs)]) !==
    JSON.stringify([...specsToMap(nextSpecs)])
  ) {
    changedFields.push("specifications");
  }

  const statusChanged = previousAsset.status !== nextAsset.status;
  if (statusChanged) changedFields.push("status");

  return JSON.stringify({
    changedFields,
    status: statusChanged
      ? { from: previousAsset.status, to: nextAsset.status }
      : null,
    damagedSpecifications: damagedSpecifications || [],
    repairDetails: repair?.details?.trim() || "",
  });
}

async function getSpecificationNames(client, idCategory, specIds) {
  const ids = Array.isArray(specIds)
    ? specIds.map(Number).filter((id) => Number.isInteger(id))
    : [];

  if (ids.length === 0) return [];

  const { rows } = await client.query(
    `SELECT name
       FROM category_specification
       WHERE id_category = $1 AND repairable = true AND id = ANY($2::int[])
       ORDER BY id ASC`,
    [idCategory, ids],
  );

  return rows.map((row) => row.name);
}

async function attachSpecsToAssets(assets) {
  if (assets.length === 0) return assets;

  const ids = assets.map((asset) => asset.databaseId);

  const { rows: specRows } = await pool.query(
    `SELECT id_asset, id_specification, spec_key, spec_value
     FROM asset_specification
     WHERE id_asset = ANY($1::int[])
     ORDER BY id_specification ASC`,
    [ids],
  );

  const specsByAsset = new Map();

  for (const row of specRows) {
    if (!specsByAsset.has(row.id_asset)) {
      specsByAsset.set(row.id_asset, []);
    }

    // spec_key adalah cache nama specification (diisi saat value
    // disimpan) — dipakai sebagai label tampilan supaya frontend
    // tidak perlu join balik ke category_specification.
    specsByAsset.get(row.id_asset).push({
      id_specification: row.id_specification,
      name: row.spec_key,
      value: row.spec_value,
    });
  }

  return assets.map((asset) => ({
    ...asset,
    specs: specsByAsset.get(asset.databaseId) || [],
  }));
}

async function attachRepairDetails(assets) {
  if (assets.length === 0) return assets;

  const ids = assets.map((asset) => asset.databaseId);
  const { rows } = await pool.query(
    `SELECT
            r.id_asset,
            r.reason,
            rs.id_specification,
            rs.specification_name
     FROM reason r
     LEFT JOIN reason_specification rs ON rs.id_reason = r.id
     WHERE r.id_asset = ANY($1::int[])
       AND r.action = 'need_repair'
       AND r.id = (
         SELECT MAX(latest.id)
         FROM reason latest
         WHERE latest.id_asset = r.id_asset
           AND latest.action = 'need_repair'
       )
     ORDER BY r.id_asset, rs.id_specification ASC`,
    [ids],
  );

  const repairByAsset = new Map();

  for (const row of rows) {
    if (!repairByAsset.has(row.id_asset)) {
      repairByAsset.set(row.id_asset, {
        details: row.reason || "",
        specifications: [],
      });
    }

    if (row.id_specification) {
      repairByAsset.get(row.id_asset).specifications.push({
        id_specification: row.id_specification,
        name: row.specification_name,
      });
    }
  }

  return assets.map((asset) => ({
    ...asset,
    repair:
      asset.status === "needs_repair"
        ? repairByAsset.get(asset.databaseId) || null
        : null,
  }));
}

async function listAssets(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT asset.id,
              asset.id_category,
              category.category_name,
              asset.name,
              asset.code,
              asset.status,
              asset.image_url,
              asset.location,
              asset.created_at,
              asset.updated_at
       FROM asset
       LEFT JOIN category
         ON category.id = asset.id_category
       ORDER BY asset.created_at DESC NULLS LAST,
                asset.id DESC`,
    );

    const assets = rows.map((asset) => ({
      id: asset.code,
      databaseId: asset.id,

      name: asset.name,
      id_category: asset.id_category,
      category: asset.category_name || String(asset.id_category),

      status: asset.status || "Unknown",

      imageUrl: asset.image_url,
      location: asset.location || null,
      qrCodeUrl: buildQrCodeUrl(asset.code),

      createdAt: asset.created_at,
      updatedAt: asset.updated_at,

      treatmentHistory: [],
    }));

    const assetsWithSpecs = await attachSpecsToAssets(assets);
    const assetsWithRepairDetails = await attachRepairDetails(assetsWithSpecs);

    return success(res, {
      data: assetsWithRepairDetails,
    });
  } catch (err) {
    console.error("Error in listAssets:", err);

    return error(res, {
      messageKey: "loadFailed",
      message: "Gagal mengambil data asset.",
    });
  }
}

async function createAsset(req, res) {
  const { name, code_item, id_category, status, image_url, location, specs } =
    req.body;

  if (!name || !name.trim()) {
    return error(res, {
      messageKey: "nameRequired",
      message: "Nama item wajib diisi.",
      statusCode: 400,
    });
  }

  if (!id_category) {
    return error(res, {
      messageKey: "categoryRequired",
      message: "Kategori wajib dipilih.",
      statusCode: 400,
    });
  }

  let client;

  try {
    client = await pool.connect();

    const actorId = req.user?.id_user || req.user?.id || null;

    await client.query("BEGIN");

    const tempCode = `TMP-${Date.now()}`;

    const insertResult = await client.query(
      `INSERT INTO asset (
         id_category,
         name,
         code,
         status,
         image_url,
         location,
         created_by,
         updated_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING id`,
      [
        id_category,
        name.trim(),
        tempCode,
        status || "functional",
        image_url || null,
        location?.trim() || null,
        actorId,
      ],
    );

    const newId = insertResult.rows[0].id;

    const finalCode = code_item?.trim() || generateAssetCode(name);

    const { rows } = await client.query(
      `UPDATE asset
       SET code = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id,
                 id_category,
                 name,
                 code,
                 status,
                 image_url,
                 location,
                 created_at,
                 updated_at`,
      [finalCode, newId],
    );

    await replaceAssetSpecifications(client, {
      idAsset: newId,
      idCategory: id_category,
      specs,
    });

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
      messageKey: "addSuccess",
      message: "Item berhasil ditambahkan.",

      data: {
        ...rows[0],

        qrCodeUrl: buildQrCodeUrl(rows[0].code),
      },

      statusCode: 201,
    });
  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Error in createAsset:", err);

    if (err.code === "23503") {
      return error(res, {
        messageKey: "invalidCategory",
        message: "Kategori tidak valid.",
        statusCode: 400,
      });
    }

    return error(res, {
      messageKey: "addFailed",
      message: "Gagal menambahkan item.",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * PATCH /api/assets/:id
 */
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
    repair,
  } = req.body;

  if (!name || !name.trim()) {
    return error(res, {
      messageKey: "nameRequired",
      message: "Nama item wajib diisi.",
      statusCode: 400,
    });
  }

  if (!id_category) {
    return error(res, {
      messageKey: "categoryRequired",
      message: "Kategori wajib dipilih.",
      statusCode: 400,
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const actorId = req.user?.id_user || req.user?.id || null;

    const { rows: previousRows } = await client.query(
      `SELECT id, id_category, name, status, image_url, location
       FROM asset
       WHERE ${assetIdentifierClause(1)}`,
      [id],
    );

    if (previousRows.length === 0) {
      await client.query("ROLLBACK");
      return error(res, {
        messageKey: "notFound",
        message: "Item tidak ditemukan.",
        statusCode: 404,
      });
    }

    const { rows: previousSpecs } = await client.query(
      `SELECT id_specification, spec_value AS value
       FROM asset_specification
       WHERE id_asset = $1
       ORDER BY id_specification ASC`,
      [previousRows[0].id],
    );

    const { rows } = await client.query(
      `UPDATE asset
       SET id_category = $1,
           name = $2,
           status = $3,
           image_url = $4,
           location = $5,
           updated_by = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE ${assetIdentifierClause(7)}
       RETURNING id,
                 id_category,
                 name,
                 code,
                 status,
                 image_url,
                 location,
                 created_at,
                 updated_at`,
      [
        id_category,
        name.trim(),
        status || "functional",
        image_url || null,
        location?.trim() || null,
        actorId,
        id,
      ],
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");

      return error(res, {
        messageKey: "notFound",
        message: "Item tidak ditemukan.",
        statusCode: 404,
      });
    }

    await replaceAssetSpecifications(client, {
      idAsset: rows[0].id,
      idCategory: id_category,
      specs,
    });

    const damagedSpecifications = await getSpecificationNames(
      client,
      id_category,
      repair?.specIds,
    );

    if (status === "needs_repair" && repair) {
      await saveRepairDetails(client, {
        idAsset: rows[0].id,
        idCategory: id_category,
        actorId,
        repair,
      });
    }

    await logHistory(client, {
      type: "edit_item",
      idAsset: rows[0].id,
      performedBy: actorId,
      subjectName: rows[0].name,
      subjectCode: rows[0].code,
      description: buildAssetEditDescription({
        previousAsset: previousRows[0],
        nextAsset: rows[0],
        previousSpecs,
        nextSpecs: specs,
        repair,
        damagedSpecifications,
      }),
    });

    await client.query("COMMIT");

    // description belum punya kolom di tabel asset — kalau nanti
    // ditambahkan, tinggal masukkan ke UPDATE di atas.
    void description;

    return success(res, {
      messageKey: "editSuccess",
      message: "Item berhasil diperbarui.",

      data: {
        ...rows[0],

        qrCodeUrl: buildQrCodeUrl(rows[0].code),
      },
    });
  } catch (err) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Error in updateAsset:", err);

    if (err.code === "NEED_REPAIR_VALIDATION") {
      return error(res, {
        messageKey: "repairDetailsRequired",
        message: err.message,
        statusCode: 400,
      });
    }

    if (err.code === "23503") {
      return error(res, {
        messageKey: "invalidCategory",
        message: "Kategori tidak valid.",
        statusCode: 400,
      });
    }

    return error(res, {
      messageKey: "editFailed",
      message: "Gagal memperbarui item.",
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * PATCH /api/assets/deactivate
 */
async function deactivateAssets(req, res) {
  const { ids, reason } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return error(res, {
      messageKey: "selectAtLeastOne",
      message: "Pilih minimal satu item.",
      statusCode: 400,
    });
  }

  if (!reason || reason.trim().length < 5) {
    return error(res, {
      messageKey: "reasonMinLength",
      message: "Alasan minimal 5 karakter.",
      statusCode: 400,
    });
  }

  try {
    const actorId = req.user?.id_user || req.user?.id || null;

    const { rows } = await pool.query(
      `UPDATE asset
       SET status = 'unavailable',
           updated_by = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE code = ANY($2::text[])
          OR id::text = ANY($2::text[])
       RETURNING id,
                 code,
                 name`,
      [actorId, ids.map(String)],
    );

    if (rows.length !== ids.length) {
      return error(res, {
        messageKey: "someItemsNotFound",
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
      messageKey: "deactivateSuccess",
      message: "Item berhasil ditandai tidak tersedia.",
      data: rows,
    });
  } catch (err) {
    console.error("Error in deactivateAssets:", err);

    return error(res, {
      messageKey: "statusChangeFailed",
      message: "Gagal mengubah status item.",
    });
  }
}

/**
 * GET /api/assets/:id/qr
 *
 * PUBLIC ENDPOINT.
 *
 * QR tidak disimpan ke database maupun filesystem.
 * PNG dibuat langsung di memory dan dikirim ke client.
 */
async function getAssetQrCode(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT code
       FROM asset
       WHERE ${assetIdentifierClause(1)}`,
      [id],
    );

    if (rows.length === 0) {
      return error(res, {
        messageKey: "notFound",
        message: "Item tidak ditemukan.",
        statusCode: 404,
      });
    }

    const assetCode = rows[0].code;

    const pngBuffer = await generateQrPng(assetCode);

    res.set({
      "Content-Type": "image/png",

      "Cache-Control": "public, max-age=31536000, immutable",

      "Content-Length": pngBuffer.length,
    });

    return res.send(pngBuffer);
  } catch (err) {
    console.error("Error in getAssetQrCode:", err);

    return error(res, {
      messageKey: "qrGenerationFailed",
      message: "Gagal membuat QR code.",
    });
  }
}

module.exports = {
  listAssets,
  createAsset,
  updateAsset,
  deactivateAssets,
  getAssetQrCode,
};
