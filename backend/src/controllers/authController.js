const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/password");

const login = async (req, res) => {
  try {
    const { identifier = req.body.email, password } = req.body;
    // VALIDASI INPUT

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/email and password are required",
        data: null,
      });
    }
    // CARI USER

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password,
        role,
        status
      FROM users
      WHERE LOWER(email) = LOWER($1)
         OR LOWER(name) = LOWER($1)
      `,
      [identifier.trim()],
    );
    // USER TIDAK DITEMUKAN

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
        data: null,
      });
    }

    const user = result.rows[0];

    // CEK STATUS USER

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Invalid username/email or password",
        data: null,
      });
    }

    // CEK PASSWORD

    let isPasswordValid = false;

    try {
      isPasswordValid = await comparePassword(password, user.password);
    } catch (error) {
      isPasswordValid = password === user.password;

      if (isPasswordValid) {
        const hashedPassword = await hashPassword(password);
        await pool.query("UPDATE users SET password = $1 WHERE id = $2", [
          hashedPassword,
          user.id,
        ]);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
        data: null,
      });
    }

    // BUAT JWT PAYLOAD

    const payload = {
      id: user.id,
      role: user.role,
    };

    // BUAT TOKEN

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // RESPONSE LOGIN

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

// GET CURRENT USER
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "User data retrieved successfully",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      data: null,
    });
  }
};

module.exports = {
  login,
  getMe,
};
