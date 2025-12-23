document.addEventListener("DOMContentLoaded", () => {
    // Elements
    const fullname = document.getElementById("fullname");
    const email = document.getElementById("email");
    const dob = document.getElementById("dob");
    const description = document.getElementById("description");

    const problemType = document.getElementById("problemType");
    const sampleSection = document.getElementById("sampleTestSection");
    const ratingSection = document.getElementById("ratingSection");
    const form = document.getElementById("feedbackForm");

    const stars = document.querySelectorAll(".rating-stars .star");
    const output = document.getElementById("ratingOutput");

    const fbUniversity = document.getElementById("fbUniversity");
    const fbYear = document.getElementById("fbYear");
    const fbSemester = document.getElementById("fbSemester");
    const fbType = document.getElementById("fbType");

    const searchInput = document.getElementById("searchInput");
    const searchSuggestions = document.getElementById("searchSuggestions");

    // State
    let selectedRating = 0;
    let selectedTestId = null;
    let selectedKeywordId = null;
    let formChanged = false; // Flag to track if the form has been modified

    // Attach event listeners to form fields to track changes
    const formFields = [
        fullname, email, dob, description, problemType, fbUniversity, fbYear, fbSemester, fbType
    ];

    formFields.forEach(field => {
        if (field) {
            field.addEventListener('input', () => {
                formChanged = true;  // Set flag to true when any form field is modified
            });
        }
    });

    // Initial state (safely)
    sampleSection?.classList.add("d-none");
    ratingSection?.classList.add("d-none");

    // -----------------------------
    // UTILITY FUNCTIONS
    // -----------------------------

    function logState() {
        console.log("=== Current State ===");
        console.log("selectedKeywordId:", selectedKeywordId);
        console.log("selectedTestId:", selectedTestId);
        console.log("selectedRating:", selectedRating);
        console.log("University:", fbUniversity?.value);
        console.log("Year:", fbYear?.value);
        console.log("Semester:", fbSemester?.value);
        console.log("Type:", fbType?.value);
        console.log("===================");
    }

    function clearStars() {
        selectedRating = 0;
        stars.forEach(s => s.classList.remove("full", "half"));
        if (output) output.textContent = "Rating: 0 / 5";
    }

    function renderStars(rating) {
        stars.forEach((star, idx) => {
            star.classList.remove("full", "half");
            if (rating >= idx + 1) star.classList.add("full");
            else if (rating >= idx + 0.5) star.classList.add("half");
        });
        if (output) output.textContent = `Rating is: ${rating.toFixed(1)} / 5`;
    }

    function populateSelect(selectEl, items) {
        if (!selectEl) return;
        const placeholderText = selectEl.options[0]?.text || "Select";
        selectEl.innerHTML = `<option value="" disabled selected hidden>${placeholderText}</option>`;
        if (!items || items.length === 0) {
            selectEl.disabled = true;
            return;
        }
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id || item.name || item;
            option.textContent = (item.name || item.id || item).toString().replace(/\b\w/g, char => char.toUpperCase()); // Capitalizing the first letter of each word
            selectEl.appendChild(option);
        });
        selectEl.disabled = false;
    }

    async function loadFiltersForSubject(subjectId) {
        if (!subjectId) return;
        try {
            const params = new URLSearchParams({ subject_id: subjectId });
            if (fbUniversity?.value) params.append("university", fbUniversity.value);
            if (fbYear?.value) params.append("year", fbYear.value);
            if (fbSemester?.value) params.append("semester", fbSemester.value);

            const res = await fetch(`/api/tests/filters?${params.toString()}`);
            if (!res.ok) return;
            const data = await res.json();

            if (fbUniversity?.value && fbYear?.value && fbSemester?.value) {
                populateSelect(fbType, data.types);
            } else if (fbUniversity?.value && fbYear?.value) {
                populateSelect(fbSemester, data.semesters);
                populateSelect(fbType, data.types);
            } else if (fbUniversity?.value) {
                populateSelect(fbYear, data.years);
                if (fbSemester) { fbSemester.innerHTML = '<option value="" disabled selected hidden>Semester</option>'; fbSemester.disabled = true; }
                if (fbType) { fbType.innerHTML = '<option value="" disabled selected hidden>Type</option>'; fbType.disabled = true; }
            } else {
                populateSelect(fbUniversity, data.universities);
                populateSelect(fbYear, data.years);
                if (fbSemester) { fbSemester.innerHTML = '<option value="" disabled selected hidden>Semester</option>'; fbSemester.disabled = true; }
                if (fbType) { fbType.innerHTML = '<option value="" disabled selected hidden>Type</option>'; fbType.disabled = true; }
            }
        } catch (err) {
            console.error("Error loading filters:", err);
        }
    }

    async function resolveTestId() {
        if (!selectedKeywordId || !fbUniversity?.value || !fbYear?.value || !fbSemester?.value || !fbType?.value) {
            selectedTestId = null;
            return;
        }
        const params = {
            subject_id: selectedKeywordId,
            university: fbUniversity.value,
            year: String(fbYear.value),
            semester: fbSemester.value,
            type: fbType.value
        };
        try {
            const res = await fetch("/api/tests/resolve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params)
            });
            if (!res.ok) { selectedTestId = null; return; }
            const data = await res.json();
            selectedTestId = data.test_id || null;
        } catch {
            selectedTestId = null;
        }
    }

    // -----------------------------
    // EVENT HANDLERS
    // -----------------------------

    problemType?.addEventListener("change", () => {
        const isSampleTest = problemType.value === "sample_test";
        if (isSampleTest) {
            sampleSection?.classList.remove("d-none");
            ratingSection?.classList.remove("d-none");
        } else {
            sampleSection?.classList.add("d-none");
            ratingSection?.classList.add("d-none");
            clearStars();
            selectedTestId = null;
            selectedKeywordId = null;
            if (searchInput) searchInput.value = "";
            if (searchSuggestions) searchSuggestions.innerHTML = "";
        }
    });

    stars.forEach((star, idx) => {
        star.addEventListener("click", () => {
            selectedRating = idx + 1;
            renderStars(selectedRating);
        });
    });

    let acTimer = null;
    searchInput?.addEventListener("input", async () => {
        clearTimeout(acTimer);
        const q = searchInput.value.trim();
        if (!q) {
            if (searchSuggestions) searchSuggestions.innerHTML = "";
            return;
        }
        acTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/subjects/autocomplete?q=${encodeURIComponent(q)}`);
                if (!res.ok) return;
                const subjects = await res.json();
                if (searchSuggestions) searchSuggestions.innerHTML = "";
                subjects.forEach(sub => {
                    const li = document.createElement("li");
                    li.className = "list-group-item list-group-item-action";
                    li.style.cursor = "pointer";
                    li.textContent = sub.name;
                    li.addEventListener("click", () => {
                        if (searchInput) searchInput.value = sub.name;
                        selectedKeywordId = sub.id;
                        if (searchSuggestions) searchSuggestions.innerHTML = "";
                        loadFiltersForSubject(sub.id);
                    });
                    searchSuggestions?.appendChild(li);
                });
            } catch (err) {
                console.error("Autocomplete error:", err);
            }
        }, 300);
    });

    document.addEventListener("click", (e) => {
        if (searchInput && searchSuggestions &&
            !searchInput.contains(e.target) &&
            !searchSuggestions.contains(e.target)) {
            searchSuggestions.innerHTML = "";
        }
    });

    fbUniversity?.addEventListener("change", async () => {
        // Reset Year, Semester, Type fields whenever University changes
        if (fbYear) {
            fbYear.innerHTML = '<option value="" disabled selected hidden>Year</option>';
            fbYear.disabled = false;
        }
        if (fbSemester) {
            fbSemester.innerHTML = '<option value="" disabled selected hidden>Semester</option>';
            fbSemester.disabled = true;
        }
        if (fbType) {
            fbType.innerHTML = '<option value="" disabled selected hidden>Type</option>';
            fbType.disabled = true;
        }

        selectedTestId = null;
        if (selectedKeywordId && fbUniversity.value) {
            await loadFiltersForSubject(selectedKeywordId);
        }
    });

    fbYear?.addEventListener("change", async () => {
        // Reset Semester and Type fields when Year changes
        if (fbSemester) {
            fbSemester.innerHTML = '<option value="" disabled selected hidden>Semester</option>';
            fbSemester.disabled = false;
        }
        if (fbType) {
            fbType.innerHTML = '<option value="" disabled selected hidden>Type</option>';
            fbType.disabled = true;
        }

        selectedTestId = null;
        if (selectedKeywordId && fbUniversity?.value && fbYear.value) {
            await loadFiltersForSubject(selectedKeywordId);
        }
    });

    fbSemester?.addEventListener("change", async () => {
        // Enable the Type field when Semester is selected
        if (fbType) {
            fbType.innerHTML = '<option value="" disabled selected hidden>Type</option>';
            fbType.disabled = false;
        }

        selectedTestId = null;
        if (selectedKeywordId && fbUniversity?.value && fbYear?.value && fbSemester.value) {
            try {
                const params = new URLSearchParams({
                    subject_id: selectedKeywordId,
                    university: fbUniversity.value,
                    year: fbYear.value,
                    semester: fbSemester.value
                });
                const res = await fetch(`/api/tests/filters?${params.toString()}`);
                if (!res.ok) return;
                const data = await res.json();
                populateSelect(fbType, data.types); // Populate types once semester is selected
            } catch (err) {
                console.error(err);
            }
        }
    });

    fbType?.addEventListener("change", async () => {
        // Resolve test ID when Type changes
        await resolveTestId();
        logState(); // Log the current state after changes
    });

    window.addEventListener('beforeunload', (event) => {
        if (formChanged) {
            const message = "You have unsaved changes. Are you sure you want to leave?";
            event.returnValue = message;  // Standard for most browsers
            return message;  // For some older browsers
        }
    });

    // -----------------------------
    // FORM SUBMISSION
    // -----------------------------

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Collect input values
        const fullname = document.getElementById("fullname")?.value.trim() || "";
        const email = document.getElementById("email")?.value.trim() || "";
        const dob = document.getElementById("dob")?.value || null;
        const description = document.getElementById("description")?.value.trim() || "";
        const probType = problemType?.value || "";

        // Check if required fields are filled out
        if (!fullname || !email || !dob || !probType || !description) {
            alert("Please fill in all required fields.");
            return;
        }

        // Regex for email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        // Validate DOB (must be a valid past date)
        const dobDate = new Date(dob);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(dobDate.getTime())) {
            alert("Please enter a valid Date of Birth.");
            return;
        }

        if (dobDate >= today) {
            alert("Date of Birth must be in the past.");
            return;
        }

        // If the problem type is "sample_test", ensure the user has selected a test and given a rating
        if (probType === "sample_test") {
            if (!selectedTestId) {
                alert("Please select a valid sample test using the filters.");
                return;
            }
            if (!selectedRating) {
                alert("Please provide a rating for the sample test.");
                return;
            }
        }

        // Ensure that the user has selected values for university, year, semester, and type when applicable
        if (probType === "sample_test") {
            if (!fbUniversity?.value || !fbYear?.value || !fbSemester?.value || !fbType?.value) {
                alert("Please ensure all filters (University, Year, Semester, Type) are selected.");
                return;
            }
        }

        const payload = {
            user_fullname: fullname,
            email,
            dob,
            problem_type: probType,
            test_id: selectedTestId,
            rating: selectedRating || null,
            description
        };

        // Submit the feedback
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                alert(`Error: ${errData.error || "Failed to submit feedback"}`);
                return;
            }

            alert("✅ Feedback submitted successfully! Thank you.");
            form.reset();
            clearStars();
            sampleSection?.classList.add("d-none");
            ratingSection?.classList.add("d-none");
            if (searchSuggestions) searchSuggestions.innerHTML = "";
            selectedTestId = null;
            selectedKeywordId = null;

            // Reset the formChanged flag
            formChanged = false;  // No unsaved changes anymore

        } catch (err) {
            console.error(err);
            alert("An error occurred while submitting feedback. Please try again.");
        }
    });


    form?.addEventListener("reset", () => {
        clearStars();
        sampleSection?.classList.add("d-none");
        ratingSection?.classList.add("d-none");
        if (searchSuggestions) searchSuggestions.innerHTML = "";
        selectedTestId = null;
        selectedKeywordId = null;

        // Reset the formChanged flag
        formChanged = false;  // No unsaved changes anymore
    });
});
