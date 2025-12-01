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