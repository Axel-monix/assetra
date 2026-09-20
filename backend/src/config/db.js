const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL && (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.trim() === "")) {
  console.warn(
    "⚠️ Warning: DB_PASSWORD is empty or not set in backend/.env! Neon PostgreSQL requires a password."
  );
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD ?? "").trim(),
      ssl: {
        rejectUnauthorized: false,
      },
    });

module.exports = pool;