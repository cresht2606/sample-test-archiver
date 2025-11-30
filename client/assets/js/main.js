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
let favourites = JSON.parse(localStorage.getItem("favourites") || "[]"); // Favorite Storage 

// ---------- Favourites Placeholder ----------
function renderFavouritesPlaceholder() {
    if (favList) {
        favList.innerHTML = '<small class="text-muted"> Favorites feature coming soon ... </small>';
    }
}
renderFavouritesPlaceholder();

if (favBtn) {
    favBtn.addEventListener('click', () => {
        if (!selectedTest) {
            alert("Select a test first!");
            return;
        }
        // If already in favorite => do nothing
        if (!favourites.includes(selectedTest.id)) {
            favourites.push(selectedTest.id);
            localStorage.setItem("favourites", JSON.stringify(favourites));
            renderFavourites();
        }
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
    //Load favorites from localStorage into UI
    renderFavourites();
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
// --- View counter in local storage ---

let views = JSON.parse(localStorage.getItem("testViews") || "{}");
// No view count yet => set to 0 first
if (!views[test.id]) {
    views[test.id] = 0;
}
//increment of view count
views[test.id]++;
//save back
localStorage.setItem("testViews", JSON.stringify(views));
//update UI count
if (viewsCountSpan) {
    viewsCountSpan.textContent = views[test.id];
}

//Render Favorites Panel
async function renderFavourites() {
    if (!favList) return;
    if (favourites.length === 0) {
        favList.innerHTML = '<small class="text-muted">No favourites yet</small>';
        return;
    }
    favList.innerHTML = "";
    //Loop Favorite
    for (const id of favourites) {
        const test = await fetchTestById(id);
        const div = document.createElement('div');
        div.className = 'fav-item mb-2 p-2 border rounded';
        div.innerHTML = `
            <b>${test.title}</b><br>
            <small>${test.university} — ${test.year} Semester ${test.semester}</small>
            <button class="btn btn-sm btn-outline-danger float-end remove-fav" data-id="${id}">
            Remove</button>`;
        div.addEventListener("click", () => loadTest(test));
        favList.appendChild(div);
    }
    //Remove button listeners
    document.querySelectorAll(".remove-fav").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const id = Number(btn.dataset.id);
            favourites = favourites.filter(f => f !== id);
            localStorage.setItem("favourites", JSON.stringify(favourites));
            renderFavourites();
        });
    });
}

//--- load Drive Viewer---
    embedWrap.innerHTML = `
    <div class="embed-responsive">
      <iframe src="${test.drive_embed_url}" width="640" height="480" allowfullscreen></iframe>
    </div>`;
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