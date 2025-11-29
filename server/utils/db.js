// Importing the mysql2 library for working with MySQL databases
const mysql = require('mysql2/promise');

// Importing dotenv to load environment variables from a .env file
require('dotenv').config();

// Database connection (pool)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'Phaidauhcmus26@',
    database: process.env.DB_NAME || 'sample_archiver',
    waitForConnections: true, // Wait for other connections in use
    connectionLimit: 20, // Maximum number of connections allowed in a pool
    charset: 'utf8mb4'
});

// Connection Test On Startup
pool.getConnection()
    .then(conn => {
        console.log("📦 MySQL Connected Successfully");
        conn.release();
    })
    .catch(err => {
        console.error("❌ MySQL Connection Failed:", err.message);
    });

// Exporting the pool object to be used in other parts of the application
module.exports = pool;