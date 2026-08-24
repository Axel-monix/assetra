const pool = require("../config/db");
const { success, error } = require("../../constants/response");

async function listCategories(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, category_name, description FROM category ORDER BY category_name ASC`
    );
    
    return success(res, { data: result.rows });
  } catch (err) {
    console.error("Error in listCategories:", err);
    return error(res, { message: "Gagal mengambil data kategori." });
  }
}

module.exports = { listCategories };