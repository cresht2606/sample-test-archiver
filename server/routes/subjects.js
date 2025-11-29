const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// GET /api/subjects/autocomplete?q=calc
router.get('/autocomplete', async (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    try {
        const [rows] = await pool.query(
            `SELECT id, code, name,
                    CONCAT(code, ' - ', name) AS title
             FROM subjects
             WHERE code LIKE ? OR name LIKE ?
             LIMIT 10`,
            [`%${q}%`, `%${q}%`]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db_error' });
    }
});

// GET /api/subjects/:id/filters
router.get('/:id/filters', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT DISTINCT year, semester, type, university
             FROM tests
             WHERE subject_id = ?`,
            [req.params.id]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'db_error' });
    }
});

// GET /api/subjects/all (Fetch all students on load)
router.get('/all', async (req, res) => {
    try {
        const [rows] = await pool.query(`SELECT id, code, name, CONCAT(code, ' - ', name) AS title
            FROM subjects ORDER BY code ASC 
        `);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "db_error" });
    }
});

module.exports = router;
