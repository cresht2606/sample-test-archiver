-- ===============================
-- GLOBAL SETTINGS (Railway-safe)
-- ===============================
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ===============================
-- SUBJECTS
-- ===============================
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===============================
-- TESTS
-- ===============================
CREATE TABLE IF NOT EXISTS tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    university VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    semester VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    drive_embed_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views INT DEFAULT 0,

    CONSTRAINT fk_tests_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===============================
-- CHANGELOG
-- ===============================
CREATE TABLE IF NOT EXISTS changelog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    date DATE,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===============================
-- FEEDBACK
-- ===============================
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_fullname VARCHAR(120),
    email VARCHAR(120),
    dob DATE,
    problem_type ENUM('website', 'sample_test'),
    test_id INT NULL,
    rating INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_test
        FOREIGN KEY (test_id)
        REFERENCES tests(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===============================
-- TEST RATINGS
-- ===============================
CREATE TABLE IF NOT EXISTS test_ratings (
    test_id INT PRIMARY KEY,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,

    CONSTRAINT fk_test_ratings_test
        FOREIGN KEY (test_id)
        REFERENCES tests(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===============================
-- FEEDBACK EXPORT QUEUE
-- ===============================
CREATE TABLE IF NOT EXISTS feedback_export_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL,
    exported BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_export_feedback
        FOREIGN KEY (feedback_id)
        REFERENCES feedback(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===============================
-- INDEXES
-- ===============================
CREATE INDEX idx_tests_subject ON tests (subject_id);
CREATE INDEX idx_tests_filters ON tests (year, semester, type, university);

CREATE INDEX idx_feedback_test_id ON feedback (test_id);
CREATE INDEX idx_feedback_problem_type ON feedback (problem_type);
CREATE INDEX idx_feedback_created_at ON feedback (created_at);
CREATE INDEX idx_feedback_test_rating ON feedback (test_id, rating);

CREATE INDEX idx_export_queue_exported ON feedback_export_queue (exported);
CREATE INDEX idx_export_queue_feedback_id ON feedback_export_queue (feedback_id);

CREATE INDEX idx_test_ratings_avg ON test_ratings (avg_rating);

-- ===============================
-- SEED DATA (IDEMPOTENT)
-- ===============================
INSERT IGNORE INTO subjects (code, name) VALUES
('MATH101', 'Calculus I'),
('PHYS201', 'Physics II'),
('CS105', 'Introduction to Programming');

INSERT IGNORE INTO tests
(subject_id, university, year, semester, type, drive_embed_url)
VALUES
(1, 'MIT', 2024, 'Fall', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(1, 'MIT', 2024, 'Fall', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(1, 'Harvard', 2024, 'Spring', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(1, 'Harvard', 2024, 'Spring', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),

(2, 'MIT', 2023, 'Fall', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(2, 'MIT', 2023, 'Fall', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(2, 'Stanford', 2023, 'Spring', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(2, 'Stanford', 2023, 'Spring', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),

(3, 'Harvard', 2024, 'Fall', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(3, 'Harvard', 2024, 'Fall', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(3, 'MIT', 2024, 'Spring', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view'),
(3, 'MIT', 2024, 'Spring', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view');

INSERT IGNORE INTO changelog (version, date, body) VALUES
('1.3.8', '2020-06-04', 'Updated Bootstrap, jQuery, RTL, Dark mode'),
('1.3.0', '2020-05-28', 'Material Icons update, RTL, Dark variants'),
('1.0.0', '2020-03-04', 'Initial Release');
