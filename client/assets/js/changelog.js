// src/js/changelog.js
import { fetchChangelog } from './api.js'; // implement wrapper

let current = 1;
const per_page = 5;

async function loadPage(page = 1) {
    const res = await fetch(`/api/changelog?page=${page}&per_page=${per_page}`);
    const payload = await res.json();
    renderEntries(payload.data);
    renderPager(payload.page, Math.ceil(payload.total / per_page));
}

function renderPager(page, totalPages) {
    const pager = document.getElementById('pager');

    pager.innerHTML = `<button id="prev" ${page <= 1 ? 'disabled' : ''}>Prev</button>
    <span> Page ${page} / ${totalPages} </span>
    <button id="next" ${page >= totalPages ? 'disabled' : ''}>Next</button>`;

    pager.querySelector('#prev').onclick = () => loadPage(page - 1);
    pager.querySelector('#next').onclick = () => loadPage(page + 1);
}

loadPage(1);