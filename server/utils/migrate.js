import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 1. ensure migrations table
await connection.query(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const migrationsDir = "./migrations";
const files = fs.readdirSync(migrationsDir).sort();

for (const file of files) {
  const [rows] = await connection.query(
    "SELECT 1 FROM migrations WHERE name = ?",
    [file]
  );

  if (rows.length) {
    console.log(`✓ Skipped ${file}`);
    continue;
  }

  console.log(`▶ Running ${file}`);
  const sql = fs.readFileSync(
    path.join(migrationsDir, file),
    "utf8"
  );

  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await connection.query(stmt);
  }

  await connection.query(
    "INSERT INTO migrations (name) VALUES (?)",
    [file]
  );

  console.log(`✔ Applied ${file}`);
}

await connection.end();
