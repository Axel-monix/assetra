const pool = require("../config/db");
const { success, error } = require("../../constants/response");

const PAGE_SIZE = 10;

const TYPE_GROUPS = {
  added: ["add_admin", "add_item"],
  updated: ["edit_item"],
  deactivated: ["deactivate_admin", "deactivate_item"],
};

async function listHistory(req, res) {
  try {
    const { type, search, dateFrom, dateTo, cursor } = req.query;

    const conditions = [];
    const params = [];
    let idx = 1;

    if (type && type !== "all" && TYPE_GROUPS[type]) {
      conditions.push(`history.type = ANY($${idx}::history_type[])`);
      params.push(TYPE_GROUPS[type]);
      idx++;
    }

    if (search && search.trim()) {
      conditions.push(
        `(history.subject_name ILIKE $${idx} OR history.subject_code ILIKE $${idx} OR history.description ILIKE $${idx})`,
      );
      params.push(`%${search.trim()}%`);
      idx++;
    }

    if (dateFrom) {
      conditions.push(`history.created_at >= $${idx}`);
      params.push(`${dateFrom} 00:00:00`);
      idx++;
    }

    if (dateTo) {
      conditions.push(`history.created_at <= $${idx}`);
      params.push(`${dateTo} 23:59:59.999`);
      idx++;
    }

    if (cursor) {
      conditions.push(`history.id < $${idx}`);
      params.push(Number(cursor));
      idx++;
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows } = await pool.query(
      `SELECT history.id, history.type, history.subject_name,
              history.subject_code, history.description,
              history.created_at, performer.name AS performed_by_name
         FROM history
         LEFT JOIN users performer ON performer.id = history.performed_by
         ${whereClause}
         ORDER BY history.created_at DESC, history.id DESC
         LIMIT $${idx}`,
      [...params, PAGE_SIZE + 1],
    );

    const hasMore = rows.length > PAGE_SIZE;
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return success(res, { data, meta: { nextCursor, hasMore } });
  } catch (err) {
    console.error("Error in listHistory:", err);
    return error(res, { message: "Gagal mengambil data riwayat." });
  }
}

module.exports = { listHistory };