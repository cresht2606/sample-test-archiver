const express = require("express");
const router = express.Router();
const pool = require("../utils/db");
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// POST /api/feedback
router.post("/", async (req, res) => {
    const {
        user_fullname,
        email,
        dob,
        problem_type,
        test_id,
        rating,
        description
    } = req.body;

    // Server-side email validation
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format." });
    }

    if (!user_fullname || !email || !problem_type || !description) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (problem_type === "sample_test") {
        if (!test_id || !rating) {
            return res.status(400).json({ error: "Sample test feedback requires test_id and rating" });
        }
    }

    try {
        const [feedbackResult] = await pool.query(
            `INSERT INTO feedback (
            user_fullname, email, dob, problem_type, test_id, rating, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_fullname, email, dob, problem_type, test_id || null, rating || null, description]
        );

        const feedbackId = feedbackResult.insertId;

        if (problem_type === "sample_test") {
            await updateTestRating(test_id);
        }

        await pool.query(`INSERT INTO feedback_export_queue (feedback_id) VALUES (?)`, [feedbackId]);
        res.status(201).json({ success: true });

    } catch (err) {
        console.error("Feedback insert failed:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update test ratings
async function updateTestRating(testId) {
    await pool.query(
        `INSERT IGNORE INTO test_ratings (test_id, avg_rating, total_reviews)
         VALUES (?, 0, 0)`,
        [testId]
    );

    await pool.query(
        `UPDATE test_ratings
         SET total_reviews = total_reviews + 1,
             avg_rating = (
                SELECT ROUND(AVG(rating), 2)
                FROM feedback
                WHERE test_id = ? AND rating IS NOT NULL
             )
         WHERE test_id = ?`,
        [testId, testId]
    );
}

module.exports = router;