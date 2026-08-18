const pool = require("../config/db");

const getApiStatus = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "AssetFlow API is running",
      database_time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
};

module.exports = {
  getApiStatus,
};
