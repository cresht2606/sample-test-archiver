-- migrations / create

CREATE DATABASE IF NOT EXISTS sample_archiver CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sample_archiver;

-- Tests table (each sample test)
CREATE TABLE IF NOT EXISTS tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    university VARCHAR(255) DEFAULT NULL,
    year SMALLINT DEFAULT NULL,
    semester VARCHAR(50) DEFAULT NULL,
    type VARCHAR(100) DEFAULT NULL,
    drive_embed_url TEXT,     -- should store an iframe-safe embed URL
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Changelog entries
CREATE TABLE IF NOT EXISTS changelog(
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    date DATE,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion
INSERT INTO tests (title, university, year, semester, type, drive_embed_url)
VALUES ('Calculus I - Sample Test', 'National University', 2020, 'Semester 3', 'Final', 'https://drive.google.com/file/d/1S9JsVG5XHT7fPvQVFSsc__5xbwXNNH_C/preview');
