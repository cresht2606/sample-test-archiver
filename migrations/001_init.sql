-- =========================
-- Core Tables
-- =========================

CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    university VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    semester VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    drive_embed_url TEXT NOT NULL,
    views INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tests_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Changelog
-- =========================

CREATE TABLE IF NOT EXISTS changelog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    date DATE,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Feedback
-- =========================

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_fullname VARCHAR(120),
    email VARCHAR(120),
    dob DATE,
    problem_type ENUM('website', 'sample_test') NOT NULL,
    test_id INT NULL,
    rating INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_test
        FOREIGN KEY (test_id)
        REFERENCES tests(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Test Ratings
-- =========================

CREATE TABLE IF NOT EXISTS test_ratings (
    test_id INT PRIMARY KEY,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,

    CONSTRAINT fk_test_ratings_test
        FOREIGN KEY (test_id)
        REFERENCES tests(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Feedback Export Queue
-- =========================

CREATE TABLE IF NOT EXISTS feedback_export_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL,
    exported BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_export_feedback
        FOREIGN KEY (feedback_id)
        REFERENCES feedback(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Indexes
-- =========================

CREATE INDEX idx_tests_subject ON tests (subject_id);

CREATE INDEX idx_tests_filters ON tests (year, semester, type, university);

CREATE INDEX idx_feedback_test_id ON feedback (test_id);

CREATE INDEX idx_feedback_problem_type ON feedback (problem_type);

CREATE INDEX idx_feedback_created_at ON feedback (created_at);

CREATE INDEX idx_feedback_test_rating ON feedback (test_id, rating);

CREATE INDEX idx_export_queue_exported ON feedback_export_queue (exported);

CREATE INDEX idx_export_queue_feedback_id ON feedback_export_queue (feedback_id);

CREATE INDEX idx_test_ratings_avg ON test_ratings (avg_rating);

-- =========================
-- Seed Data
-- =========================

INSERT IGNORE INTO subjects (code, name) VALUES
('MATH101', 'Calculus I'),
('MATH102', 'Calculus II'),
('MATH201', 'Discrete Mathematics'),
('STAT201', 'Probability'),
('MATH202', 'Linear Algebra'),
('MATH203', 'Applied Linear Algebra');

INSERT IGNORE INTO tests (
    subject_id,
    university,
    year,
    semester,
    type,
    drive_embed_url
) VALUES
(1, 'HCMIU', 2024, 'Final-term', 'Final',
 'https://drive.google.com/file/d/1J4g4kbHky13JjfYBDls1xBEJNIia52Fr/preview'),
(1, 'HCMIU', 0, 'Final-term', 'Final',
 'https://drive.google.com/file/d/1LqUUpxjwSKU-_guTto7Y4wK4PlyLUDVy/preview'),
(1, 'HCMUS', 2024, 'Final-term', 'Final',
 'https://drive.google.com/file/d/1cViBVselThuQj5E5kHWf41eQh_CR_duG/preview'),

(2, 'HCMIU', 2021, 'Semester 2', 'Midterm',
 'https://drive.google.com/file/d/1rwjW6v7nubAYUUImLpZf1zlt0KPGjHYo/preview'),
(2, 'HCMIU', 2021, 'Semester 3', 'Midterm',
 'https://drive.google.com/file/d/1fk-LTetINpoV8YiGiIwvc5yJITAzRHXy/preview'),
(2, 'HCMIU', 2021, 'Semester 2 (G3 & 4)', 'Final',
 'https://drive.google.com/file/d/1IYXeByVO0IOJByNHuCHFzcPJ_-ix2MIa/preview'),
(2, 'HCMIU', 2021, 'Semester 2 (G5 & 6)', 'Final',
 'https://drive.google.com/file/d/1-fXdlVToQWDbBa4YAlXag0Z1UXJff5--/preview'),
(2, 'HCMIU', 2023, 'Semester 2', 'Final',
 'https://drive.google.com/file/d/10E-Z_Mqn-ROdot9pqSn-rF-qfqwhnalQ/preview'),
(2, 'HCMUS', 2024, 'Semester 2', 'Midterm',
 'https://drive.google.com/file/d/1OsVyr5r0wIpYOGR4z7dzt1IToLpufGGL/preview'),

(3, 'HCMUS', 2024, 'Semester 1', 'Midterm',
 'https://drive.google.com/file/d/1_T4HoYrWXNbt6RK0tbHk499KscemhdeK/preview'),
(3, 'HCMUS', 2024, 'Semester 1', 'Final',
 'https://drive.google.com/file/d/1eMqLomI-vHbznUOlWk82qezRvXHlnAvT/preview'),

(4, 'HCMIU', 2021, 'Semester 1', 'Midterm',
 'https://drive.google.com/file/d/1yK1j_bfj5mYQlA3zWq7sn_vETBfFIZq8/preview'),
(4, 'HCMIU', 2021, 'Semester 2', 'Final',
 'https://drive.google.com/file/d/1udayT5PH-aEU4ZMcKgwcEyz4wsxBPbPa/preview'),
(4, 'HCMIU', 2024, 'Semester 2', 'Final',
 'https://drive.google.com/file/d/1OcvEvJH0m5phDDADIrGjYSopouWjnpNN/preview'),
(4, 'HCMUS', 2024, 'Semester 2', 'Midterm',
 'https://drive.google.com/file/d/1fXWPewcJnKiYPOxEEbm-0I4XMXMNxV1X/preview'),
(4, 'HCMUS', 2024, 'Semester 1', 'Final',
 'https://drive.google.com/file/d/1e-54OScTr9zpaeLRfv62hUQQUQfG57pZ/preview'),

(5, 'HCMIU', 2023, 'Semester 3', 'Midterm',
 'https://drive.google.com/file/d/1ox24O8KgdFQ7cZeyuA5yVrxQeUaNugWv/preview'),
(5, 'HCMIU', 0, 'Unknown Semester', 'Final',
 'https://drive.google.com/file/d/1Sf9ce__w1Ax46sPptzfP2Zup9b77ruJP/preview'),
(5, 'HCMUS', 2024, 'Semester 1', 'Midterm',
 'https://drive.google.com/file/d/1yx_JtQtkKJXkFKd3oOsKOporp1YxqNnE/preview'),
(5, 'HCMUS', 2022, 'Semester 1', 'Final',
 'https://drive.google.com/file/d/1UMYQoOfAH9P8WYE3LbYbVYs4FPtFoGZO/preview'),

(6, 'HCMUS', 2023, 'Semester 2', 'Midterm',
 'https://drive.google.com/file/d/1qeNRyIcDIxE6t0mVHPKsC_IpzRlOkwT5/preview'),
(6, 'HCMUS', 2023, 'Semester 2', 'Final',
 'https://drive.google.com/file/d/1JCIu5S7n0gUKZwqBe5yajq1JalBGvU50/preview');
