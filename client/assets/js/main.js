import {
    fetchSubjectAutocomplete,
    fetchSubjectFilters,
    fetchTestByFilters,
    fetchTestById
} from "./api.js";

const input = document.getElementById('searchInput');
const embedWrap = document.getElementById('embedWrap');

const selYear = document.getElementById('selYear');
const selSemester = document.getElementById('selSemester');
const selType = document.getElementById('selType');
const selUniversity = document.getElementById('selUniversity');

const favBtn = document.getElementById('favBtn');
const favList = document.getElementById('favList');
const viewsBtn = document.getElementById('viewsBtn');
const viewsCountSpan = document.getElementById('viewsCount');

let selectedSubjectId = null;
let selectedTest = null;

// ---------- Favourites Placeholder ----------
function renderFavouritesPlaceholder() {
    if (favList) {
        favList.innerHTML = '<small class="text-muted"> Favorites feature coming soon ... </small>';
    }
}
renderFavouritesPlaceholder();

if (favBtn) {
    favBtn.addEventListener('click', () => {
        alert("⭐ Favorites feature will be available soon!");
    });
}

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
        el.textContent = it.title;

        el.addEventListener('click', async () => {
            input.value = it.title;
            selectedSubjectId = it.id;
            closeAutocomplete();

            // Fetch filters for this subject
            const filters = await fetchSubjectFilters(selectedSubjectId);
            populateDropdowns(filters);
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

// Automatically load the subject list
window.addEventListener("DOMContentLoaded", async () => {
    const list = await fetch('/api/subjects/all').then(r => r.json());
    showAutocomplete(list);
});

// ---------- Event Listeners for Sequential Dropdowns ----------
// These are attached only once
selUniversity.addEventListener('change', () => {
    const filters = JSON.parse(selUniversity.dataset.filters);
    const university = selUniversity.value;

    const years = [...new Set(filters.filter(f => f.university === university).map(f => f.year))].sort();
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
function loadTest(test) {
    selectedTest = test;

    embedWrap.innerHTML = `
    <div class="embed-responsive">
      <iframe src="${test.drive_embed_url}" width="640" height="480" allowfullscreen></iframe>
    </div>`;

    if (viewsCountSpan) {
        viewsCountSpan.textContent = '👁 Feature coming soon';
    }
}

// Reset filters and viewer
function resetFiltersAndViewer() {
    selectedSubjectId = null;
    selectedTest = null;

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
}