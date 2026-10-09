document.addEventListener('DOMContentLoaded', () => {
    loadAssets();

    const assetForm = document.getElementById('assetForm');
    if (assetForm) {
        assetForm.addEventListener('submit', handleAddAsset);
    }
    
    // Strict restriction: Purchase date cannot be future date
    const dateInput = document.getElementById('assetPurchaseDate');
    const warrantyInput = document.getElementById('assetWarranty');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('max', today);
        if (warrantyInput) {
            warrantyInput.setAttribute('min', today);
        }
    }

    document.getElementById('assetSearch')?.addEventListener('input', () => { currentPage = 1; renderAssets(); });
    document.getElementById('assetFilter')?.addEventListener('change', () => { currentPage = 1; renderAssets(); });

    // Hide 'Add Asset' button if not admin
    const addAssetBtn = document.querySelector('.btn-primary[onclick="openModal()"]');
    if (addAssetBtn && localStorage.getItem('role') !== 'admin') {
        addAssetBtn.style.display = 'none';
    }
});

let allAssets = [];
let currentPage = 1;
const rowsPerPage = 10;
let editAssetId = null;

async function loadAssets() {
    try {
        const response = await fetch('/api/assets', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch assets');
        
        allAssets = await response.json();
        renderAssets();
    } catch (error) {
        console.error('Error loading assets:', error);
    }
}

function renderAssets() {
    const tbody = document.getElementById('assetsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const isAdmin = localStorage.getItem('role') === 'admin';
    
    const searchTerm = document.getElementById('assetSearch')?.value.toLowerCase() || '';
    const filterCat = document.getElementById('assetFilter')?.value || 'All';

    let filteredAssets = allAssets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm) || 
                              asset.id.toString().includes(searchTerm) ||
                              (asset.assignedTo && asset.assignedTo.toLowerCase().includes(searchTerm));
        const matchesFilter = filterCat === 'All' || asset.category === filterCat;
        return matchesSearch && matchesFilter;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredAssets.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedAssets = filteredAssets.slice(startIndex, startIndex + rowsPerPage);

    paginatedAssets.forEach(asset => {
        const tr = document.createElement('tr');
        
        // Badge class determination
        let badgeClass = 'badge-active';
        if (asset.status === 'Under Repair') badgeClass = 'badge-maintenance';
        if (asset.status === 'Retired') badgeClass = 'badge-retired';

        let actionHtml = `
        <td>
            <div class="action-btns">
                <button class="btn btn-small" style="background:#17a2b8; color:white; border:none;" onclick="showQR(${asset.id})">QR Code</button>
                ${isAdmin ? `<button class="btn btn-primary btn-small" onclick="editAsset(${asset.id})">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteAsset(${asset.id})">Delete</button>` 
                : `<button class="btn btn-danger btn-small" onclick="openReportIssueModal(${asset.id})">Report Issue</button>`}
            </div>
        </td>`;

        tr.innerHTML = `
            <td>${asset.id}</td>
            <td><strong>${asset.name}</strong></td>
            <td>${asset.category}</td>
            <td><span class="badge ${badgeClass}">${asset.status}</span></td>
            <td>${asset.assignedTo}</td>
            <td>${asset.purchaseDate}</td>
            <td>₹${parseFloat(asset.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>${asset.warranty || 'N/A'}</td>
            ${actionHtml}
        `;
        tbody.appendChild(tr);
    });
}

function changePage(delta) {
    currentPage += delta;
    renderAssets();
}

async function handleAddAsset(e) {
    e.preventDefault();
    const name = document.getElementById('assetName').value;
    const category = document.getElementById('assetCategory').value;
    const status = document.getElementById('assetStatus').value;
    const assignedTo = document.getElementById('assetAssignedTo').value;
    const purchaseDate = document.getElementById('assetPurchaseDate').value;
    const price = document.getElementById('assetPrice').value;
    const warranty = document.getElementById('assetWarranty').value;

    try {
        const url = editAssetId ? `/api/assets/${editAssetId}` : '/api/assets';
        const method = editAssetId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, category, status, assignedTo: assignedTo || 'Unassigned', purchaseDate, price, warranty })
        });
        
        if (response.ok) {
            e.target.reset();
            closeModal();
            editAssetId = null;
            loadAssets();
        } else {
            const err = await response.json();
            alert(err.error || 'Failed to save asset');
        }
    } catch (error) {
        console.error('Error adding asset:', error);
    }
}

async function deleteAsset(id) {
    if(confirm('Are you sure you want to delete this asset?')) {
        try {
            const response = await fetch(`/api/assets/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                loadAssets();
            } else {
                console.error('Failed to delete asset');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
        }
    }
}

function closeQRModal() {
    document.getElementById('qrModal')?.classList.remove('active');
}

async function showQR(id) {
    document.getElementById('qrModal')?.classList.add('active');
    const container = document.getElementById('qrImageContainer');
    container.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await fetch(`/api/assets/${id}/qrcode`);
        if (!response.ok) throw new Error('Failed to fetch QR');
        
        const data = await response.json();
        if (data.qrImage) {
            container.innerHTML = `<img src="${data.qrImage}" alt="QR Code" style="max-width:100%; border-radius:8px;">`;
        }
    } catch (error) {
        console.error('Error fetching QR:', error);
        container.innerHTML = '<p class="error-text">Failed to load QR code.</p>';
    }
}

function editAsset(id) {
    const asset = allAssets.find(a => a.id === id);
    if (!asset) return;

    editAssetId = id;
    
    document.getElementById('assetName').value = asset.name;
    document.getElementById('assetCategory').value = asset.category;
    document.getElementById('assetStatus').value = asset.status;
    document.getElementById('assetPurchaseDate').value = asset.purchaseDate || '';
    document.getElementById('assetPrice').value = asset.price || '';
    document.getElementById('assetWarranty').value = asset.warranty || '';
    
    // Set AssignedTo after opening modal (which fetches employees)
    openModal().then(() => {
        document.getElementById('assetAssignedTo').value = asset.assignedTo || 'Unassigned';
    });

    document.querySelector('#assetModal h3').textContent = 'Edit Asset';
}

// Modal handling

async function openModal() {
    document.getElementById('assetModal')?.classList.add('active');
    
    // Fetch employees for the dropdown
    try {
        const res = await fetch('/api/employees', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (res.ok) {
            const employees = await res.json();
            const select = document.getElementById('assetAssignedTo');
            if (select) {
                // Keep the current selected value if editing
                const currentValue = select.value;
                select.innerHTML = '<option value="Unassigned">Unassigned</option>';
                employees.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.name;
                    option.textContent = emp.name;
                    select.appendChild(option);
                });
                if (currentValue) select.value = currentValue;
            }
        }
    } catch (e) {
        console.error('Error fetching employees:', e);
    }
}

function closeModal() {
    document.getElementById('assetModal')?.classList.remove('active');
    document.getElementById('assetForm')?.reset();
    editAssetId = null;
    document.querySelector('#assetModal h3').textContent = 'Add New Asset';
}

// -----------------------------------------
// REPORT ISSUE LOGIC (Standard Users)
// -----------------------------------------
function openReportIssueModal(assetId) {
    document.getElementById('reportAssetId').value = assetId;
    document.getElementById('reportDesc').value = '';
    const modal = document.getElementById('reportIssueModal');
    if (modal) modal.classList.add('active');
}

function closeReportIssueModal() {
    const modal = document.getElementById('reportIssueModal');
    if (modal) modal.classList.remove('active');
}

document.getElementById('reportIssueForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const assetId = document.getElementById('reportAssetId').value;
    const description = document.getElementById('reportDesc').value;
    const date = new Date().toISOString().split('T')[0]; // Current date

    try {
        const response = await fetch('/api/report-issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ assetId, description, date })
        });
        
        if (response.ok) {
            closeReportIssueModal();
            loadAssets();
            alert("Issue reported successfully!");
        } else {
            const err = await response.json();
            alert(err.error || 'Failed to report issue');
        }
    } catch (error) {
        console.error('Error reporting issue:', error);
    }
});
