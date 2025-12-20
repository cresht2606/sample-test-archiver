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