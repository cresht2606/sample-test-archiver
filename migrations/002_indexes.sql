-- =========================
-- Indexes
-- =========================

CREATE INDEX idx_tests_subject ON tests (subject_id);

CREATE INDEX idx_tests_filters ON tests (university, year, semester, type);

CREATE INDEX idx_feedback_test_id ON feedback (test_id);

CREATE INDEX idx_feedback_problem_type ON feedback (problem_type);

CREATE INDEX idx_feedback_created_at ON feedback (created_at);

CREATE INDEX idx_feedback_test_rating ON feedback (test_id, rating);

CREATE INDEX idx_export_queue_exported ON feedback_export_queue (exported);

CREATE INDEX idx_export_queue_feedback_id ON feedback_export_queue (feedback_id);

CREATE INDEX idx_test_ratings_avg ON test_ratings (avg_rating);