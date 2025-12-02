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