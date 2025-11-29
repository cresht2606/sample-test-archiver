// src/js/api.js

// Autocomplete subjects
export async function fetchSubjectAutocomplete(q) {
    const res = await fetch(`/api/subjects/autocomplete?q=${encodeURIComponent(q)}`);
    return res.json(); // [{id, code, name, title}]
}

// Fetch available filters for a subject (years, semesters, types, universities)
export async function fetchSubjectFilters(subjectId) {
    const res = await fetch(`/api/subjects/${subjectId}/filters`);
    return res.json(); // [{year, semester, type, university}]
}

// ========== TESTS API ==========

// Fetch final test by filters
// Example: fetchTestByFilters({ subject_id: 1, year: 2024, semester: "Fall", type: "Final", university: "IU" })

export async function fetchTestByFilters(params = {}) {
    const qs = new URLSearchParams(params);
    const res = await fetch(`/api/tests?${qs.toString()}`);
    return res.json();
}

export async function fetchTestById(id) {
    const res = await fetch(`/api/tests/${id}`);
    return res.json();
}
