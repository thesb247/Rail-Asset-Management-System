let allAudits = [];
let currentPage = 1;
const rowsPerPage = 5;

document.addEventListener('DOMContentLoaded', () => {
    loadAudits();
});

async function loadAudits() {
    try {
        const response = await fetch('/api/audits');
        if (!response.ok) throw new Error('Failed to fetch audits');
        
        allAudits = await response.json();
        // Sort by date/id descending (newest first)
        allAudits.sort((a, b) => b.id - a.id);
        
        renderAudits();
    } catch (error) {
        console.error('Error loading audits:', error);
    }
}

function renderAudits() {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Pagination Logic
    const totalPages = Math.ceil(allAudits.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedAudits = allAudits.slice(startIndex, startIndex + rowsPerPage);

    paginatedAudits.forEach(audit => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge-active';
            if (audit.status === 'Logged') badgeClass = 'badge-maintenance';

            tr.innerHTML = `
                <td>${audit.id}</td>
                <td><strong>${audit.description}</strong></td>
                <td>${audit.date}</td>
                <td><span class="badge ${badgeClass}">${audit.status}</span></td>
                <td>${audit.auditor}</td>
            `;
            tbody.appendChild(tr);
    });
}

function changePage(delta) {
    currentPage += delta;
    renderAudits();
}
