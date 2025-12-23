import {
    fetchSubjectAutocomplete,
    fetchSubjectFilters,
    fetchTestByFilters,
    fetchTestById
} from "./api.js";

import {
    getFavourites,
    toggleFavourite,
    isFavourite,
    incrementView
} from "./utils.js";

const input = document.getElementById('searchInput');
const embedWrap = document.getElementById('embedWrap');

const selUniversity = document.getElementById('selUniversity');
const selYear = document.getElementById('selYear');
const selSemester = document.getElementById('selSemester');
const selType = document.getElementById('selType');

const favBtn = document.getElementById('favBtn');
const favList = document.getElementById('favList');
const viewsCountSpan = document.getElementById('viewsCount');

const avgRatingWrap = document.getElementById("avgRatingWrap");
const avgStars = document.querySelectorAll("#avgStars .star");
const avgRatingValue = document.getElementById("avgRatingValue");
const totalReviews = document.getElementById("totalReviews");

let subjects = []; // cache all subjects on load
let selectedSubjectId = null;
let selectedTest = null;
let favourites = getFavourites(); // Favourite storage

let lastViewedTestId = null;

function updateFavButton() {
    if (!favBtn) return;
    favBtn.textContent = selectedTest && isFavourite(selectedTest.id)
        ? "★ Favourited"
        : "☆ Add to favourite";
}

// ---------- Favourites Placeholder ----------
function renderFavouritesPlaceholder() {
    if (favList) {
        favList.innerHTML = '<small class="text-muted"> Favourites feature coming soon ... </small>';
    }
}
renderFavouritesPlaceholder();

//Render Favourites Panel

// Fetch all subjects at start
window.addEventListener("DOMContentLoaded", async () => {
    subjects = await fetch("/api/subjects/all").then(r => r.json());
    
    // Show all subjects
    showAutocomplete(subjects);
    
    renderFavourites();
    updateFavButton();
});

async function renderFavourites() {
    if (!favList) return;

    favourites = getFavourites();

    if (!favourites.length) {
        favList.innerHTML = `<small class="text-muted">No favourites yet</small>`;
        return;
    }

    favList.innerHTML = "";

    for (const id of favourites) {
        try {
            const test = await fetchTestById(id);
            const subject = subjects.find(s => s.id === test.subject_id);

            const div = document.createElement("div");
            div.className = "fav-item p-2 border rounded mb-2";
            div.innerHTML = `
        <b>${subject?.name ?? "Unknown Subject"}</b><br>
        <small>${test.university} — ${test.year ?? "N/A"} ${test.semester} (${test.type})</small>
        <button class="btn btn-sm btn-outline-danger float-end remove-fav" data-id="${id}">Remove</button>
      `;

            div.addEventListener("click", () => loadTest(test));
            favList.appendChild(div);

            div.querySelector(".remove-fav").addEventListener("click", e => {
                e.stopPropagation();
                toggleFavourite(id);
                renderFavourites();
                updateFavButton();
            });

        } catch (err) {
            console.error("Favourite load failed:", err);
        }
    }
}

favBtn?.addEventListener("click", () => {
    if (!selectedTest) return alert("Select a test first");
    toggleFavourite(selectedTest.id);
    renderFavourites();
    updateFavButton();
});

// ---------- Autocomplete ----------
let acTimer = null;
input.addEventListener('input', async (e) => {
    const q = e.target.value.trim();
    clearTimeout(acTimer);

    if (!q) {
        closeAutocomplete();

        // Only reset if a test or subject was previously selected
        if (selectedSubjectId || selectedTest) {
            resetFiltersAndViewer();
        }

        return;
    }

    acTimer = setTimeout(async () => {
        const suggestions = await fetchSubjectAutocomplete(q);
        showAutocomplete(suggestions);
    }, 200);
});

function closeAutocomplete() {
    const existing = document.querySelector('.autocomplete-list');
    if (existing) existing.remove();
}

function showAutocomplete(items = []) {
    closeAutocomplete();
    const list = document.createElement('div');
    list.className = 'autocomplete-list list-group position-absolute';
    list.style.zIndex = 9999;

    items.forEach(it => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'list-group-item list-group-item-action';
        el.textContent = it.name;

        el.addEventListener('click', async () => {
            input.value = it.name;
            selectedSubjectId = it.id;
            closeAutocomplete();

            // Fetch filters for this subject
            try {
                const filters = await fetchSubjectFilters(selectedSubjectId);
                populateDropdowns(filters);
            } catch {
                resetFiltersAndViewer();
            }
        });

        list.appendChild(el);
    });

    document.querySelector('.search-wrap').appendChild(list);
    list.style.width = `${input.offsetWidth}px`; // match width
    list.style.left = `${input.offsetLeft}px`;  // align horizontally
    list.style.top = `${input.offsetTop + input.offsetHeight}px`; // right under input
}

// ---------- Populate Dropdowns Sequentially ----------
function populateDropdowns(filters) {
    // Reset dropdowns
    selUniversity.innerHTML = `<option value="" disabled hidden selected>University</option>`;
    selYear.innerHTML = `<option value="" disabled hidden selected>Year</option>`;
    selSemester.innerHTML = `<option value="" disabled hidden selected>Semester</option>`;
    selType.innerHTML = `<option value="" disabled hidden selected>Type</option>`;

    // Populate university options
    const universities = [...new Set(filters.map(f => f.university))].sort();
    universities.forEach(u => selUniversity.appendChild(new Option(u, u)));

    // Enable only University initially
    selUniversity.disabled = false;
    selYear.disabled = true;
    selSemester.disabled = true;
    selType.disabled = true;

    // Store filters in dataset for use in event handlers
    selUniversity.dataset.filters = JSON.stringify(filters);
}

// ---------- Event Listeners for Sequential Dropdowns ----------
// These are attached only once
selUniversity.addEventListener('change', () => {
    const filters = JSON.parse(selUniversity.dataset.filters);
    const university = selUniversity.value;

    const years = [...new Set(filters.filter(f => f.university === university && f.year !== null).map(f => f.year))].sort();
    selYear.innerHTML = `<option value="" disabled hidden selected>Year</option>`;
    years.forEach(y => selYear.appendChild(new Option(y, y)));

    selYear.disabled = false;

    selSemester.innerHTML = `<option value="" disabled hidden selected>Semester</option>`;
    selSemester.disabled = true;
    selType.innerHTML = `<option value="" disabled hidden selected>Type</option>`;
    selType.disabled = true;
});

selYear.addEventListener('change', () => {
    const filters = JSON.parse(selUniversity.dataset.filters);
    const university = selUniversity.value;
    const year = selYear.value;

    const semesters = [...new Set(filters.filter(f => f.university === university && f.year == year).map(f => f.semester))];
    selSemester.innerHTML = `<option value="" disabled hidden selected>Semester</option>`;
    semesters.forEach(s => selSemester.appendChild(new Option(s, s)));

    selSemester.disabled = false;
    selType.innerHTML = `<option value="" disabled hidden selected>Type</option>`;
    selType.disabled = true;
});

selSemester.addEventListener('change', () => {
    const filters = JSON.parse(selUniversity.dataset.filters);
    const university = selUniversity.value;
    const year = selYear.value;
    const semester = selSemester.value;

    const types = [...new Set(filters.filter(f => f.university === university && f.year == year && f.semester == semester).map(f => f.type))];
    selType.innerHTML = `<option value="" disabled hidden selected>Type</option>`;
    types.forEach(t => selType.appendChild(new Option(t, t)));

    selType.disabled = false;
});

selType.addEventListener('change', async () => {
    const university = selUniversity.value;
    const year = selYear.value;
    const semester = selSemester.value;
    const type = selType.value;

    if (selectedSubjectId && university && year && semester && type) {
        const results = await fetchTestByFilters({
            subject_id: selectedSubjectId,
            university,
            year,
            semester,
            type
        });
        if (results.length) loadTest(results[0]);
    }
});

// Outside-click handle → Closes only autocomplete
document.addEventListener('click', (e) => {
    const autocompleteList = document.querySelector('.autocomplete-list');
    const clickInsideInput = input.contains(e.target);
    const clickInsideList = autocompleteList?.contains(e.target);

    // If clicked outside input and outside autocomplete list → close it
    if (!clickInsideInput && !clickInsideList) {
        closeAutocomplete();
    }
});

// ---------- Load Test Viewer ----------
async function loadTest(test) {
    selectedTest = test;

    if (lastViewedTestId !== test.id) {
        incrementView(test.id, viewsCountSpan);
        lastViewedTestId = test.id;
    }

    // --- Load Drive Viewer---
    embedWrap.innerHTML = `
    <div class="embed-responsive">
      <iframe src="${test.drive_embed_url}" width="640" height="480" allowfullscreen></iframe>
    </div>`;

    // --- Load average rating for this test ---
    await loadAvgRating(test.id);

    // --- Update favourite button ---
    updateFavButton();
}

// Reset filters and viewer
function resetFiltersAndViewer() {
    selectedSubjectId = null;
    selectedTest = null;
    lastViewedTestId = null;

    // Reset dropdowns
    selUniversity.innerHTML = `<option value="" disabled hidden selected>University</option>`;
    selYear.innerHTML = `<option value="" disabled hidden selected>Year</option>`;
    selSemester.innerHTML = `<option value="" disabled hidden selected>Semester</option>`;
    selType.innerHTML = `<option value="" disabled hidden selected>Type</option>`;

    selUniversity.disabled = true;
    selYear.disabled = true;
    selSemester.disabled = true;
    selType.disabled = true;

    // Clear Google Drive frame
    embedWrap.innerHTML = "";

    // Clear view tracking (sessionStorage)
    sessionStorage.removeItem('viewedTests');

    // Reset views count UI to 0
    if (viewsCountSpan) {
        viewsCountSpan.textContent = "0";
    }

    // Reset favourites UI and button
    renderFavourites();
    updateFavButton();

    // Hide average rating
    avgRatingWrap.classList.add("d-none");
}

function renderAvgRating(avg) {
    console.log("Rendering stars for avg:", avg);
    avgStars.forEach((star, i) => {
        star.className = 'star'; // reset all stars

        if (avg >= i + 1) {
            star.classList.add('full');
            star.style.removeProperty('--fill-percent');
        } else if (avg > i && avg < i + 1) {
            star.classList.add('partial');
            star.style.setProperty('--fill-percent', `${(avg - i) * 100}%`);
        } else {
            star.classList.add('empty');
            star.style.removeProperty('--fill-percent');
        }

        // Make stars unclickable and non-interactive
        star.style.pointerEvents = 'none'; // Disable click events on stars
        star.style.cursor = 'default'; // Make cursor default (not a pointer)
    });
}

async function loadAvgRating(testId) {
    try {
        const res = await fetch(`/api/tests/${testId}/rating`);
        if (!res.ok) return;

        const data = await res.json();

        // Update numeric rating
        avgRatingValue.textContent = Number(data.avg_rating).toFixed(2);
        totalReviews.textContent = data.total_reviews;

        // Update stars
        renderAvgRating(data.avg_rating);

        // Show rating container
        avgRatingWrap.classList.remove("d-none");

    } catch (err) {
        console.error("Failed to load avg rating:", err);
        // hide if fetch fails
        avgRatingWrap.classList.add("d-none");
    }

}
