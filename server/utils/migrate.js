const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE
  });

  // Ensure migrations table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  const migrationsDir = path.join(__dirname, "../../migrations");
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
      try {
        await connection.query(stmt);
      } catch (err) {
        // Ignore duplicate index errors (MySQL 5.7 safe)
        if (err.code === "ER_DUP_KEYNAME") {
          console.log(`↷ Index already exists, skipping`);
          continue;
        }
        throw err;
      }
    }

    await connection.query(
      "INSERT INTO migrations (name) VALUES (?)",
      [file]
    );

    console.log(`✔ Applied ${file}`);
  }

  await connection.end();
}

runMigrations().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
