// Key endpoints: search, filters, get by id
const express = require('express');
const router = express.Router();
const pool = require('../utils/db');

// Filters: GET /api/tests?query=&university=&year=&semester=&type=
router.get('/', async (req, res) => {
    const { query = '', university, year, semester, type } = req.query;
    const params = [];
    let where = 'WHERE 1 = 1';

    // Keyword sort
    if (query) {
        where += ' AND title LIKE ?';
        params.push(`%${query}%`);
    }

    // University filter
    if (university) {
        where += ' AND university = ?';
        params.push(university);
    }

    // Year filter
    if (year) {
        where += ' AND year = ?';
        params.push(year);
    }

    // Semester filter
    if (semester) {
        where += ' AND semester = ?';
        params.push(semester);
    }

    // Type (Mid-term, Final-term)
    if (type) {
        where += ' AND type = ?';
        params.push(type);
    }

    try {
        const [rows] = await pool.query(`SELECT * FROM tests ${where} ORDER BY created_at DESC LIMIT 500`, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'db_error'
        });
    }
});

// GET /api/tests/:id
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM tests where id = ? LIMIT 1', [req.params.id]); // Unique ID for single test
        if (!rows.length) {
            return res.status(404).json({
                error: 'not_found'
            });
        };
        res.json(rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'db_error'
        });
    }
});

//View counter by session
router.post('/view/:id', async (req, res) => {
    const testId = req.params.id;
    try {
        const [result] = await pool.query(
            'UPDATE tests SET views = views + 1 WHERE id = ?', [testId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'not_found' });
        }
        res.json({ success: true });
    } catch (err) {
        console.error('View update failed:', err);
        res.status(500).json({ error: 'db_error' });
    }
});

module.exports = router;
