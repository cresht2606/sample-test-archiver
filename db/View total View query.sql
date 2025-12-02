SELECT s.name AS subject, SUM(t.views) AS total_views
FROM subjects s
JOIN tests t ON s.id = t.subject_id
GROUP BY s.id;