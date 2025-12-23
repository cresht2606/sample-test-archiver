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
        const yearNum = Number(year);
        if (Number.isInteger(yearNum)) {
            where += ` AND CAST(year AS UNSIGNED) = ?`;
            params.push(yearNum);
        }
    }


    // Semester filter
    if (semester) {
        where += ` AND LOWER(TRIM(semester)) = LOWER(TRIM(?))`;
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

router.get("/filters", async (req, res) => {
    const { subject_id, university, year, semester } = req.query;

    if (!subject_id) return res.status(400).json({ error: "subject_id required" });

    try {
        // ---------------------
        // Universities: independent
        // ---------------------
        const [universities] = await pool.query(
            `SELECT DISTINCT university
             FROM tests
             WHERE subject_id = ?
             ORDER BY university`,
            [subject_id]
        );

        // ---------------------
        // Years: dependent on university (if selected)
        // ---------------------
        let yearWhere = "WHERE subject_id = ?";
        const yearParams = [subject_id];
        if (university) {
            yearWhere += " AND university = ?";
            yearParams.push(university);
        }

        const [years] = await pool.query(
            `SELECT DISTINCT year
             FROM tests
             ${yearWhere}
             ORDER BY year DESC`,
            yearParams
        );

        // ---------------------
        // Semesters: dependent on university + year
        // ---------------------
        let semWhere = "WHERE subject_id = ?";
        const semParams = [subject_id];
        if (university) { semWhere += " AND university = ?"; semParams.push(university); }
        if (year) {
            if (Number(year) === 0) {
                semWhere += " AND year = 0"; // unknown year
            } else {
                semWhere += " AND year = ?";
                semParams.push(Number(year));
            }
        }

        const [semesters] = await pool.query(
            `SELECT DISTINCT semester
             FROM tests
             ${semWhere}
             ORDER BY semester`,
            semParams
        );

        // ---------------------
        // Types: dependent on university + year + semester
        // ---------------------
        let typeWhere = "WHERE subject_id = ?";
        const typeParams = [subject_id];
        if (university) { typeWhere += " AND university = ?"; typeParams.push(university); }
        if (year) {
            if (Number(year) === 0) typeWhere += " AND year = 0";
            else { typeWhere += " AND year = ?"; typeParams.push(Number(year)); }
        }
        if (semester) { typeWhere += " AND semester LIKE CONCAT('%', ?, '%')"; typeParams.push(semester); }

        const [types] = await pool.query(
            `SELECT DISTINCT type
             FROM tests
             ${typeWhere}
             ORDER BY type`,
            typeParams
        );

        res.json({
            universities: universities.map(u => u.university),
            years: years.map(y => y.year),
            semesters: semesters.map(s => s.semester),
            types: types.map(t => t.type),
        });

    } catch (err) {
        console.error("Filter error:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// POST /api/tests/resolve (Resolve test ID from filters)
router.post("/resolve", async (req, res) => {
    let { subject_id, university, year, semester, type } = req.body;

    if (!subject_id || !university || !semester || !type) {
        return res.json({ test_id: null });
    }

    // --- Safely parse year ---
    let yearNum = Number(year);
    if (!Number.isInteger(yearNum) || yearNum < 0) yearNum = 0; // treat unknown as 0

    try {
        // Match test
        const [rows] = await pool.query(
            `SELECT id
             FROM tests
             WHERE subject_id = ?
               AND LOWER(TRIM(university)) = LOWER(TRIM(?))
               AND year = ?
               AND LOWER(semester) LIKE CONCAT('%', LOWER(TRIM(?)), '%')
               AND LOWER(TRIM(type)) = LOWER(TRIM(?))
             LIMIT 1`,
            [subject_id, university, yearNum, semester, type]
        );

        if (!rows || rows.length === 0) return res.json({ test_id: null });

        res.json({ test_id: rows[0].id });
    } catch (err) {
        console.error("Resolve error:", err);
        res.status(500).json({ error: "Failed to resolve test ID", details: err.message });
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

// Get rating per test
router.get("/:id/rating", async (req, res) => {
    const testId = req.params.id;
    try {
        const [rows] = await pool.query(
            `SELECT avg_rating, total_reviews 
             FROM test_ratings 
             WHERE test_id = ?`,
            [testId]
        );

        if (rows.length === 0) return res.json({ avg_rating: 0, total_reviews: 0 });

        // Ensure numeric format for frontend
        const avg_rating = parseFloat(rows[0].avg_rating) || 0;
        const total_reviews = rows[0].total_reviews || 0;

        res.json({ avg_rating, total_reviews });
    } catch (err) {
        console.error("Rating fetch failed:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


//View counter by session
router.post('/:id/view', async (req, res) => {
    if (!req.session) {
        console.error("Session middleware not initialized");
        return res.status(500).json({ error: "session_not_initialized" });
    }

    req.session.viewedTests ??= {};
    const testId = Number(req.params.id);

    if (req.session.viewedTests[testId]) {
        return res.json({ skipped: true });
    }

    req.session.viewedTests[testId] = true;

    await pool.query(
        'UPDATE tests SET views = views + 1 WHERE id = ?',
        [testId]
    );

    const [[row]] = await pool.query(
        'SELECT views FROM tests WHERE id = ?',
        [testId]
    );

    res.json({ views: row.views });
});


module.exports = router;
