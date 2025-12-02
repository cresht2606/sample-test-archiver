// utils.js - Handles LocalStorage (ES6)

// ------------------ FAVOURITES ------------------ //
export function getFavourites() {
    return JSON.parse(localStorage.getItem("favourites") || "[]");
};

export function saveFavourites(list) {
    localStorage.setItem("favourites", JSON.stringify(list));
};

export function isFavourite(testId) {
    const favs = getFavourites();
    return favs.includes(testId);
};

export function toggleFavourite(testId) {
    let favs = getFavourites();

    if (favs.includes(testId)) {
        favs = favs.filter(id => id !== testId); // remove
    } else {
        favs.push(testId); // add
    }

    saveFavourites(favs);
    return favs;
};

// ------------------ VIEW TRACKER GOES HERE ------------------

export function hasViewedThisSession(testId) {
    const viewed = JSON.parse(sessionStorage.getItem("viewedTests") || "{}");
    return viewed[testId] === true;
};

export function markViewedThisSession(testId) {
    const viewed = JSON.parse(sessionStorage.getItem("viewedTests") || "{}");
    viewed[testId] = true;
    sessionStorage.setItem("viewedTests", JSON.stringify(viewed));
};

export function shouldIncreaseView(testId) {
    return !hasViewedThisSession(testId);
};

export function incrementView(testId, viewsCountSpan) {
    if (!hasViewedThisSession(testId)) {
        markViewedThisSession(testId);

        // Increment localStorage counter for UI
        let views = JSON.parse(localStorage.getItem('testViews') || '{}');
        views[testId] = (views[testId] || 0) + 1;
        localStorage.setItem('testViews', JSON.stringify(views));

        if (viewsCountSpan) {
            viewsCountSpan.textContent = views[testId];
        }

        // Correct POST URL
        fetch(`/api/tests/view/${testId}`, { method: 'POST' })
            .catch(err => console.error('Failed to update view in DB:', err));
    } 
    else {
        // Already viewed in this session — just update UI from localStorage
        let views = JSON.parse(localStorage.getItem('testViews') || '{}');
        if (viewsCountSpan) viewsCountSpan.textContent = views[testId] || 0;
    }
}