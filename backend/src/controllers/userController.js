const pool = require("../config/db");

const getUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                name,
                email,
                role,
                status,
                created_at,
                updated_at
            FROM users
            ORDER BY id ASC
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

module.exports = {
    getUsers
};