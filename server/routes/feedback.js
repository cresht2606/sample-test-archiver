const express = require("express");
const router = express.Router();
const pool = require("../utils/db");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!emailRegex.test(email))
        return res.status(400).json({ error: "Invalid email" });

    if (!user_fullname || !problem_type || !description)
        return res.status(400).json({ error: "Missing fields" });

    if (problem_type === "sample_test" && (!test_id || !rating))
        return res.status(400).json({ error: "test_id & rating required" });

    try {
        const [result] = await pool.query(
            `INSERT INTO feedback
       (user_fullname, email, dob, problem_type, test_id, rating, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_fullname, email, dob, problem_type, test_id || null, rating || null, description]
        );

        if (problem_type === "sample_test") {
            await pool.query(
                `INSERT INTO test_ratings (test_id, avg_rating, total_reviews)
         SELECT ?, ROUND(AVG(rating),2), COUNT(*)
         FROM feedback WHERE test_id = ? AND rating IS NOT NULL
         ON DUPLICATE KEY UPDATE
           avg_rating = VALUES(avg_rating),
           total_reviews = VALUES(total_reviews)`,
                [test_id, test_id]
            );
        }

        await pool.query(
            `INSERT INTO feedback_export_queue (feedback_id) VALUES (?)`,
            [result.insertId]
        );

        res.status(201).json({ success: true });

    } catch (err) {
        console.error("Feedback error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
