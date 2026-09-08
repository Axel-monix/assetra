const pool = require("../config/db");
const { success, error } = require("../../constants/response");

/**
 * =========================================================
 * SKEMA DB (lihat migration_category_specification.sql):
 *
 * CREATE TABLE category_specification (
 *   id          SERIAL PRIMARY KEY,
 *   id_category INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
 *   name        VARCHAR(100) NOT NULL,
 *   type        VARCHAR(20) NOT NULL DEFAULT 'text', -- text | number | date | boolean
 *   required    BOOLEAN NOT NULL DEFAULT false,
 *   repairable  BOOLEAN NOT NULL DEFAULT false,
 *   created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * asset_specification.id_specification -> FK ke category_specification.id
 * =========================================================
 */

const SPEC_TYPES = ["text", "number", "date", "boolean"];

function validateSpecifications(specifications) {
  if (!Array.isArray(specifications) || specifications.length === 0) {
    return "Minimal satu specification wajib diisi.";
  }

  for (const spec of specifications) {
    if (!spec.name || !String(spec.name).trim()) {
      return "Nama specification tidak boleh kosong.";
    }

    if (spec.type && !SPEC_TYPES.includes(spec.type)) {
      return `Tipe specification tidak valid: ${spec.type}`;
    }
  }

  return null;
}

/**
 * GET /api/categories
 */
async function listCategories(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT category.id,
              category.category_name,
              category.description,
              category.created_at,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', cs.id,
                    'name', cs.name,
                    'type', cs.type,
                    'required', cs.required,
                    'repairable', cs.repairable
                  )
                  ORDER BY cs.id ASC
                ) FILTER (WHERE cs.id IS NOT NULL),
                '[]'
              ) AS specifications
       FROM category
       LEFT JOIN category_specification cs ON cs.id_category = category.id
       GROUP BY category.id
       ORDER BY category.category_name ASC`,
    );

    return success(res, { data: rows });
  } catch (err) {
    console.error("Error in listCategories:", err);

    return error(res, {
      messageKey: "loadFailed",
      message: "Gagal mengambil data kategori.",
    });
  }
}

/**
 * GET /api/categories/:id
 */
async function getCategoryById(req, res) {
  const { id } = req.params;

  try {
    const { rows: categoryRows } = await pool.query(
      `SELECT id, category_name, description, created_at
       FROM category
       WHERE id = $1`,
      [id],
    );

    if (categoryRows.length === 0) {
      return error(res, {
        messageKey: "notFound",
        message: "Kategori tidak ditemukan.",
        statusCode: 404,
      });
    }

    const { rows: specRows } = await pool.query(
      `SELECT id, name, type, required, repairable
       FROM category_specification
       WHERE id_category = $1
       ORDER BY id ASC`,
      [id],
    );

    return success(res, {
      data: {
        ...categoryRows[0],
        specifications: specRows,
      },
    });
  } catch (err) {
    console.error("Error in getCategoryById:", err);

    return error(res, {
      messageKey: "loadFailed",
      message: "Gagal mengambil detail kategori.",
    });
  }
}

/**
 * POST /api/categories
 * Body: { category_name, description, specifications: [{ name, type, required, repairable }] }
 */
async function createCategory(req, res) {
  const { category_name, description, specifications } = req.body;

  if (!category_name || !category_name.trim()) {
    return error(res, {
      messageKey: "categoryNameRequired",
      message: "Nama kategori wajib diisi.",
      statusCode: 400,
    });
  }

  const specError = validateSpecifications(specifications);

  if (specError) {
    return error(res, {
      messageKey: "invalidSpecifications",
      message: specError,
      statusCode: 400,
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { rows: categoryRows } = await client.query(
      `INSERT INTO category (category_name, description)
       VALUES ($1, $2)
       RETURNING id, category_name, description, created_at`,
      [category_name.trim(), description?.trim() || null],
    );

    const newCategory = categoryRows[0];

    const insertedSpecs = [];

    for (const spec of specifications) {
      const { rows: specRows } = await client.query(
        `INSERT INTO category_specification
           (id_category, name, type, required, repairable)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, type, required, repairable`,
        [
          newCategory.id,
          String(spec.name).trim(),
          spec.type || "text",
          Boolean(spec.required),
          Boolean(spec.repairable),
        ],
      );

      insertedSpecs.push(specRows[0]);
    }

    await client.query("COMMIT");

    return success(res, {
      messageKey: "categoryCreated",
      message: "Kategori berhasil dibuat.",
      data: {
        ...newCategory,
        specifications: insertedSpecs,
      },
      statusCode: 201,
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");

    console.error("Error in createCategory:", err);

    if (err.code === "23505") {
      return error(res, {
        messageKey: "categoryNameTaken",
        message: "Nama kategori sudah digunakan.",
        statusCode: 409,
      });
    }

    return error(res, {
      messageKey: "createFailed",
      message: "Gagal membuat kategori.",
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * PATCH /api/categories/:id
 * Body: { category_name, description, specifications: [{ id?, name, type, required, repairable }] }
 *
 * Strategi upsert specification:
 *  - item dengan `id` -> UPDATE baris tsb (harus milik category ini)
 *  - item tanpa `id`  -> INSERT baris baru
 *  - baris lama yang tidak ada lagi di payload -> DELETE,
 *    KECUALI baris tsb masih direferensikan oleh asset_specification.
 *    Jika masih dipakai, baris dipertahankan dan dilaporkan lewat
 *    `data.retainedSpecifications`.
 */
async function updateCategory(req, res) {
  const { id } = req.params;
  const { category_name, description, specifications } = req.body;

  if (!category_name || !category_name.trim()) {
    return error(res, {
      messageKey: "categoryNameRequired",
      message: "Nama kategori wajib diisi.",
      statusCode: 400,
    });
  }

  const specError = validateSpecifications(specifications);

  if (specError) {
    return error(res, {
      messageKey: "invalidSpecifications",
      message: specError,
      statusCode: 400,
    });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const { rows: categoryRows } = await client.query(
      `UPDATE category
       SET category_name = $1,
           description = $2
       WHERE id = $3
       RETURNING id, category_name, description, created_at`,
      [category_name.trim(), description?.trim() || null, id],
    );

    if (categoryRows.length === 0) {
      await client.query("ROLLBACK");

      return error(res, {
        messageKey: "notFound",
        message: "Kategori tidak ditemukan.",
        statusCode: 404,
      });
    }

    const { rows: existingSpecs } = await client.query(
      `SELECT id FROM category_specification WHERE id_category = $1`,
      [id],
    );

    const incomingIds = specifications
      .filter((spec) => spec.id)
      .map((spec) => Number(spec.id));

    const toDelete = existingSpecs
      .map((row) => row.id)
      .filter((specId) => !incomingIds.includes(specId));

    const retainedSpecifications = [];

    for (const specId of toDelete) {
      const { rows: usage } = await client.query(
        `SELECT s.name, COUNT(a.id) AS usage_count
         FROM category_specification s
         LEFT JOIN asset_specification a ON a.id_specification = s.id
         WHERE s.id = $1
         GROUP BY s.name`,
        [specId],
      );

      const isUsed = usage.length > 0 && Number(usage[0].usage_count) > 0;

      if (isUsed) {
        retainedSpecifications.push(usage[0].name);
        continue;
      }

      await client.query(`DELETE FROM category_specification WHERE id = $1`, [
        specId,
      ]);
    }

    const savedSpecs = [];

    for (const spec of specifications) {
      if (spec.id) {
        const { rows } = await client.query(
          `UPDATE category_specification
           SET name = $1, type = $2, required = $3, repairable = $4, updated_at = CURRENT_TIMESTAMP
           WHERE id = $5 AND id_category = $6
           RETURNING id, name, type, required, repairable`,
          [
            String(spec.name).trim(),
            spec.type || "text",
            Boolean(spec.required),
            Boolean(spec.repairable),
            spec.id,
            id,
          ],
        );

        if (rows.length) savedSpecs.push(rows[0]);
      } else {
        const { rows } = await client.query(
          `INSERT INTO category_specification
             (id_category, name, type, required, repairable)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, type, required, repairable`,
          [
            id,
            String(spec.name).trim(),
            spec.type || "text",
            Boolean(spec.required),
            Boolean(spec.repairable),
          ],
        );

        savedSpecs.push(rows[0]);
      }
    }

    await client.query("COMMIT");

    return success(res, {
      messageKey: "categoryUpdated",
      message: "Kategori berhasil diperbarui.",
      data: {
        ...categoryRows[0],
        specifications: savedSpecs,
        retainedSpecifications,
      },
    });
  } catch (err) {
    if (client) await client.query("ROLLBACK");

    console.error("Error in updateCategory:", err);

    if (err.code === "23505") {
      return error(res, {
        messageKey: "categoryNameTaken",
        message: "Nama kategori sudah digunakan.",
        statusCode: 409,
      });
    }

    return error(res, {
      messageKey: "updateFailed",
      message: "Gagal memperbarui kategori.",
    });
  } finally {
    if (client) client.release();
  }
}
async function deleteCategory(req, res) {
  const { id } = req.params;

  try {
    const { rows: usage } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM asset WHERE id_category = $1`,
      [id],
    );

    if (usage[0].total > 0) {
      return error(res, {
        messageKey: "categoryInUse",
        message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${usage[0].total} item.`,
        statusCode: 409,
      });
    }

    const { rows } = await pool.query(
      `DELETE FROM category WHERE id = $1 RETURNING id`,
      [id],
    );

    if (rows.length === 0) {
      return error(res, {
        messageKey: "notFound",
        message: "Kategori tidak ditemukan.",
        statusCode: 404,
      });
    }

    return success(res, {
      messageKey: "categoryDeleted",
      message: "Kategori berhasil dihapus.",
      data: { id: rows[0].id },
    });
  } catch (err) {
    console.error("Error in deleteCategory:", err);

    return error(res, {
      messageKey: "deleteFailed",
      message: "Gagal menghapus kategori.",
    });
  }
}

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};