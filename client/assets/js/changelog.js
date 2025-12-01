// src/js/changelog.js
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

    pager.innerHTML = `
        <nav>
            <ul class="pagination justify-content-center my-3 gap-3">

                <li class="page-item ${page <= 1 ? 'disabled' : ''}">
                    <button class="page-link pager-btn" id="prev">Previous</button>
                </li>

                <li class="page-item disabled">
                    <span class="page-link pager-status">Page ${page} / ${totalPages}</span>
                </li>

                <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
                    <button class="page-link pager-btn" id="next">Next</button>
                </li>

            </ul>
        </nav>
    `;

    pager.querySelector('#prev').onclick = () => loadPage(page - 1);
    pager.querySelector('#next').onclick = () => loadPage(page + 1);
}

function renderEntries(entries) {
    const container = document.getElementById("changelogList");
    container.innerHTML = "";

    entries.forEach(item => {
        const div = document.createElement("div");

        div.innerHTML = `
        <h5 class="mt-4">
            <span class="version-pill p-2 bg-light shadow rounded text-success">
                Version ${item.version}
            </span> - ${new Date(item.date).toLocaleDateString()}
        </h5>
        <ul class="list-unstyled mt-3">
        ${item.body.split("\n").map(line => `
            <li class="text-muted">
                <i class="mdi mdi-circle-medium me-2"></i> ${line}
            </li>
        `).join("")}
        </ul>
        `;

        container.appendChild(div);
    });
}

loadPage(1);