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

router.get("/filters", async (req, res) => {
    const { subject_id, university, year, semester } = req.query;

    try {
        // Build base where clause
        let baseWhere = 'WHERE subject_id = ?';
        let baseParams = [subject_id];

        // Build filtered where clause (for semester/type queries)
        let filteredWhere = baseWhere;
        let filteredParams = [...baseParams];

        if (university) {
            filteredWhere += ` AND LOWER(TRIM(university)) = LOWER(TRIM(?))`;
            filteredParams.push(university);
        }

        if (year) {
            filteredWhere += ` AND CAST(year AS UNSIGNED) = ?`;
            filteredParams.push(parseInt(year, 10));
        }

        if (semester) {
            filteredWhere += ` AND LOWER(TRIM(semester)) = LOWER(TRIM(?))`;
            filteredParams.push(semester);
        }

        console.log("Filters query - baseWhere:", baseWhere, "baseParams:", baseParams);
        console.log("Filters query - filteredWhere:", filteredWhere, "filteredParams:", filteredParams);

        // Universities (always available for subject)
        const [universities] = await pool.query(`
            SELECT DISTINCT LOWER(TRIM(university)) AS name, university AS id
            FROM tests
            ${baseWhere}
            ORDER BY university
        `, baseParams);

        // Years (always available for subject)
        const [years] = await pool.query(`
            SELECT DISTINCT year AS name, year AS id
            FROM tests
            ${baseWhere}
            ORDER BY year DESC
        `, baseParams);

        // Semesters (filtered by university and year if provided)
        let semesterWhere = baseWhere;
        let semesterParams = [...baseParams];
        if (university) {
            semesterWhere += ` AND LOWER(TRIM(university)) = LOWER(TRIM(?))`;
            semesterParams.push(university);
        }
        if (year) {
            semesterWhere += ` AND CAST(year AS UNSIGNED) = ?`;
            semesterParams.push(parseInt(year, 10));
        }

        const [semesters] = await pool.query(`
            SELECT DISTINCT LOWER(TRIM(semester)) AS name, semester AS id
            FROM tests
            ${semesterWhere}
            ORDER BY semester
        `, semesterParams);

        // Types (filtered by university, year, AND semester if provided)
        const [types] = await pool.query(`
            SELECT DISTINCT LOWER(TRIM(type)) AS name, type AS id
            FROM tests
            ${filteredWhere}
            ORDER BY type
        `, filteredParams);

        console.log(`Filters for subject ${subject_id}:`, {
            universities: universities.length,
            years: years.length,
            semesters: semesters.length,
            types: types.length
        });

        res.json({
            universities,
            years,
            semesters,
            types
        });

    } catch (err) {
        console.error("Failed to load filters:", err);
        res.status(500).json({ error: "Failed to load filters" });
    }
});

// POST /api/tests/resolve (Resolve test ID from filters)
router.post("/resolve", async (req, res) => {
    const { subject_id, university, year, semester, type } = req.body;

    console.log("=== RESOLVE DEBUG ===");
    console.log("Raw request params:", { subject_id, university, year, semester, type });

    if (!subject_id || !university || !year || !semester || !type) {
        console.log("❌ Missing parameters for resolve");
        return res.json({ test_id: null });
    }

    try {
        // Convert year to number
        const yearNum = parseInt(year, 10);
        console.log("Converted year to:", yearNum, "type:", typeof yearNum);

        // First, let's debug what's in the database for this subject
        const [allTests] = await pool.query(
            `SELECT id, subject_id, university, year, semester, type
             FROM tests
             WHERE subject_id = ?`,
            [subject_id]
        );
        console.log("All tests for subject_id", subject_id, ":", allTests);

        // Now query with proper type casting
        const [rows] = await pool.query(
            `SELECT id
             FROM tests
             WHERE subject_id = ?
               AND LOWER(TRIM(university)) = LOWER(TRIM(?))
               AND CAST(year AS UNSIGNED) = ?
               AND LOWER(TRIM(semester)) = LOWER(TRIM(?))
               AND LOWER(TRIM(type)) = LOWER(TRIM(?))
             LIMIT 1`,
            [subject_id, university, yearNum, semester, type]
        );

        console.log("✅ Query result:", rows);

        if (!rows || rows.length === 0) {
            console.log("⚠️ No matching test found with these criteria");
            console.log("Looking for:", {
                subject_id,
                university: university.toLowerCase().trim(),
                year: yearNum,
                semester: semester.toLowerCase().trim(),
                type: type.toLowerCase().trim()
            });
            return res.json({ test_id: null });
        }

        const testId = rows[0].id;
        console.log("✅ Resolved test_id:", testId);
        res.json({ test_id: testId });

    } catch (err) {
        console.error("❌ Failed to resolve test ID:", err);
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
