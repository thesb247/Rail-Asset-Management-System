document.addEventListener('DOMContentLoaded', () => {
    loadMaintenance();

    const maintForm = document.getElementById('maintenanceForm');
    if (maintForm) {
        maintForm.addEventListener('submit', handleAddMaintenance);
    }
    
    // Hide 'Log Maintenance' button if not admin
    const addMaintBtn = document.querySelector('.btn-primary[onclick="openModal()"]');
    if (addMaintBtn && localStorage.getItem('role') !== 'admin') {
        addMaintBtn.style.display = 'none';
    }
});

async function loadMaintenance() {
    try {
        const response = await fetch('/api/maintenance');
        if (!response.ok) throw new Error('Failed to fetch maintenance logs');
        
        const logs = await response.json();
        const tbody = document.getElementById('maintenanceTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        const isAdmin = localStorage.getItem('role') === 'admin';
        
        logs.forEach(log => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge-active';
            if (log.status === 'In Progress') badgeClass = 'badge-maintenance';

            let actionHtml = '';
            if (isAdmin) {
                actionHtml = `
                <td>
                    <div class="action-btns">
                        ${log.status === 'In Progress' ? `<button class="btn btn-primary btn-small" onclick="completeMaintenance(${log.id}, ${log.assetId || 1})">Complete</button>` : ''}
                        <button class="btn btn-danger btn-small" onclick="deleteMaintenance(${log.id})">Delete</button>
                    </div>
                </td>`;
            } else {
                actionHtml = `<td><span class="badge" style="background:#ddd;color:#666;">Read Only</span></td>`;
            }

            tr.innerHTML = `
                <td>${log.id}</td>
                <td><strong>${log.assetName}</strong></td>
                <td>${log.description}</td>
                <td>${log.date}</td>
                <td><span class="badge ${badgeClass}">${log.status}</span></td>
                ${actionHtml}
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading maintenance logs:', error);
    }
}

async function openModal() {
    const modal = document.getElementById('maintenanceModal');
    if (modal) {
        modal.classList.add('active');
        
        // Fetch assets to populate dropdown
        try {
            const res = await fetch('/api/assets', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const assets = await res.json();
                const select = document.getElementById('maintAssetSelect');
                if (select) {
                    select.innerHTML = '<option value="">-- Choose an Asset --</option>';
                    assets.forEach(a => {
                        const opt = document.createElement('option');
                        opt.value = `${a.id}|||${a.name}`;
                        opt.textContent = `${a.id} - ${a.name}`;
                        select.appendChild(opt);
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load assets for dropdown', err);
        }
    }
}

function closeModal() {
    document.getElementById('maintenanceModal')?.classList.remove('active');
}

async function handleAddMaintenance(e) {
    e.preventDefault();
    
    const assetSelect = document.getElementById('maintAssetSelect').value;
    if (!assetSelect) {
        alert("Please select an asset.");
        return;
    }
    
    const [assetIdStr, assetName] = assetSelect.split('|||');
    const assetId = parseInt(assetIdStr);
    
    const description = document.getElementById('maintDesc').value;
    const date = document.getElementById('maintDate').value;

    try {
        const response = await fetch('/api/maintenance', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ assetId, assetName, description, date })
        });
        
        if (response.ok) {
            closeModal();
            e.target.reset();
            loadMaintenance();
        } else {
            const err = await response.json();
            alert(err.error || 'Failed to log maintenance');
        }
    } catch (error) {
        console.error('Error logging maintenance:', error);
    }
}

async function completeMaintenance(id, assetId) {
    if(confirm('Mark this repair as completed? This will make the asset available again.')) {
        try {
            const response = await fetch(`/api/maintenance/${id}/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ assetId })
            });
            
            if (response.ok) {
                loadMaintenance();
            } else {
                alert('Failed to complete maintenance');
            }
        } catch (error) {
            console.error('Error completing maintenance:', error);
        }
    }
}

async function deleteMaintenance(id) {
    if(confirm('Are you sure you want to delete this maintenance record?')) {
        try {
            const response = await fetch(`/api/maintenance/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                loadMaintenance();
            } else {
                alert('Failed to delete record');
            }
        } catch (error) {
            console.error('Error deleting maintenance:', error);
        }
    }
}