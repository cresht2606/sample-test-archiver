// server/routes/changelog.js
const express = require('express'); // Import express for routing   
const router = express.Router(); // Create a new router instance for defining routes
const pool = require('../utils/db'); // Import the MySQL connection pool from the db.js file

// GET /api/changelog?page=1&per_page=5
router.get('/', async (req, res) => {
    try {
        // ---- Parse & Validate Query Params ----
        const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
        const per_page = Number(req.query.per_page) > 0 ? Number(req.query.per_page) : 5;

        // Calculate the offset for pagination (i.e., how many records to skip)
        const offset = (page - 1) * per_page;

        // Query the database to retrieve changelog records
        const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM changelog');
        const [rows] = await pool.query(`
            SELECT 
                id,
                version,
                DATE_FORMAT(date, '%Y-%m-%d') AS date,
                body,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM changelog
            ORDER BY date DESC, id DESC
            LIMIT ? OFFSET ?
        `, [per_page, offset]);

        // ---- Response ----
        res.json({
            success: true,
            page,
            per_page,
            total,
            total_pages: Math.ceil(total / per_page),
            data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "db_error" });
    }
});

// Export the router so it can be used in the main application
module.exports = router;