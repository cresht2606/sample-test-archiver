// server/routes/changelog.js
const express = require('express'); // Import express for routing   
const router = express.Router(); // Create a new router instance for defining routes
const pool = require('../utils/db'); // Import the MySQL connection pool from the db.js file

// GET /api/changelog?page=1&per_page=5
router.get('/', async (req, res) => {
    // Parse the 'page' query parameter, default to 1 if not provided
    const page = Math.max(1, parseInt(req.query.page || '1'));
    // Parse the 'per_page' query parameter, default to 5 if not provided
    const per_page = Math.max(1, parseInt(req.query.per_page || '5'));
    // Calculate the offset for pagination (i.e., how many records to skip)
    const offset = (page - 1) * per_page;

    // Query the database to retrieve changelog records
    try {
        const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM changelog');
        const [rows] = await pool.query('SELECT * FROM changelog ORDER BY date DESC LIMIT ? OFFSET ?', [per_page, offset]);

        res.json({
            total, page, per_page, data: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db_eror' });
    }
});

// Export the router so it can be used in the main application
module.exports = router;