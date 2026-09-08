const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
        data: null,
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
        data: null,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await pool.query(
      `
          SELECT id, name, email, role, status, image_url
          FROM users
          WHERE id = $1
        `,
      [decoded.id],
    );

    if (rows.length === 0 || rows[0].status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
        data: null,
      });
    }

    req.user = {
      ...decoded,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
      status: rows[0].status,
      image_url: rows[0].image_url,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      data: null,
    });
  }
};

module.exports = {
  authenticateToken,
};
