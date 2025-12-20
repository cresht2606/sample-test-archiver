-- migrations / create

CREATE DATABASE IF NOT EXISTS sample_archiver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sample_archiver;

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tests (
	id INT AUTO_INCREMENT PRIMARY KEY,
	-- FK → subject.id
    subject_id INT NOT NULL,
    university VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    semester VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    drive_embed_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views INT DEFAULT 0,

-- Constraint On FK
CONSTRAINT fk_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE -- delete all tests if subject is feleted
);
-- Add the views column
ALTER TABLE tests ADD COLUMN views INT DEFAULT 0;

-- Changelog entries
CREATE TABLE IF NOT EXISTS changelog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    date DATE,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback Table
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_fullname VARCHAR(120),
    email VARCHAR(120),
    dob DATE,
    problem_type VARCHAR(50) CHECK (
        problem_type IN ("website", "sample_test")
    ),
    test_id INT REFERENCES tests (id) ON DELETE SET NULL,
    rating INT CHECK (
        rating >= 1
        AND rating <= 5
    ),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rating Table
CREATE TABLE test_ratings (
    test_id INT PRIMARY KEY REFERENCES tests (id),
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INT DEFAULT 0
);

-- Feedback Export Table
CREATE TABLE feedback_export_queue (
    id SERIAL PRIMARY KEY,
    feedback_id INT REFERENCES feedback (id),
    exported BOOLEAN DEFAULT FALSE
);

-- Useful indexes
CREATE INDEX idx_tests_subject ON tests (subject_id);

CREATE INDEX idx_tests_filters ON tests(year, semester, type, university);

-- Feedback table
CREATE INDEX idx_feedback_test_id ON feedback (test_id);

CREATE INDEX idx_feedback_problem_type ON feedback (problem_type);

CREATE INDEX idx_feedback_created_at ON feedback (created_at);

CREATE INDEX idx_feedback_test_rating ON feedback (test_id, rating);

-- Feedback export queue
CREATE INDEX idx_export_queue_exported ON feedback_export_queue (exported);

CREATE INDEX idx_export_queue_feedback_id ON feedback_export_queue (feedback_id);

-- Optional analytics
CREATE INDEX idx_test_ratings_avg ON test_ratings (avg_rating);

-- Sample Subjects
INSERT INTO
    subjects (code, name)
VALUES ('MATH101', 'Calculus I'),
    ('PHYS201', 'Physics II'),
    (
        'CS105',
        'Introduction to Programming'
    );

-- Sample Tests
INSERT INTO tests (subject_id, university, year, semester, type, drive_embed_url) VALUES
-- Calculus I
(1, 'MIT', 2024, 'Fall', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(1, 'MIT', 2024, 'Fall', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(1, 'Harvard', 2024, 'Spring', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(1, 'Harvard', 2024, 'Spring', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),

-- Physics II
(2, 'MIT', 2023, 'Fall', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(2, 'MIT', 2023, 'Fall', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(2, 'Stanford', 2023, 'Spring', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(2, 'Stanford', 2023, 'Spring', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),

-- Introduction to Programming
(3, 'Harvard', 2024, 'Fall', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(3, 'Harvard', 2024, 'Fall', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(3, 'MIT', 2024, 'Spring', 'Midterm', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing'),
(3, 'MIT', 2024, 'Spring', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/view?usp=sharing');

-- Sample Changelog
INSERT INTO
    changelog (version, date, body)
VALUES (
        '1.3.8',
        '2020-06-04',
        'Updated to Bootstrap v4.5
Updated to jQuery v3.5.1
Updated Material Icons v5.3.45
Added RTL version
Added Dark mode
Added Dark RTL
Fixed responsive issues'
    ),
    (
        '1.3.0',
        '2020-05-28',
        'Updated Material Icons
Added RTL Version
Added Dark Version
Added Dark RTL Version
Added 6 Color Schemes'
    ),
    (
        '1.0.0',
        '2020-03-04',
        'Initial Release'
    );