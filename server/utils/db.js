// Importing the mysql2 library for working with MySQL databases
const mysql = require('mysql2/promise');

// Importing dotenv to load environment variables from a .env file
require('dotenv').config();

// Database connection (pool)
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    port: process.env.MYSQL_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 20,
    charset: "utf8mb4"
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