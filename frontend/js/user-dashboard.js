document.addEventListener('DOMContentLoaded', () => {
    // Only standard users belong here
    if (localStorage.getItem('role') !== 'user') {
        window.location.href = 'index.html';
        return;
    }

    loadUserProfile();
    loadUserAssets();
});

async function loadUserProfile() {
    try {
        const response = await fetch('/api/employees', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch profile');
        
        const employees = await response.json();
        const profileDetails = document.getElementById('profileDetails');
        
        if (employees.length === 0) {
            profileDetails.innerHTML = '<p>No profile data found.</p>';
            return;
        }

        const profile = employees[0];
        profileDetails.innerHTML = `
            <div><strong>Name:</strong> ${profile.name}</div>
            <div><strong>Email:</strong> ${profile.email}</div>
            <div><strong>Phone:</strong> ${profile.phone}</div>
            <div><strong>Department:</strong> <span class="badge badge-active">${profile.department}</span></div>
            <div><strong>Role:</strong> <span class="badge badge-maintenance">${profile.role}</span></div>
        `;
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('profileDetails').innerHTML = '<p style="color:red;">Error loading profile data.</p>';
    }
}

async function loadUserAssets() {
    try {
        const response = await fetch('/api/assets', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch assets');
        
        const assets = await response.json();
        const tbody = document.getElementById('userAssetsTableBody');
        tbody.innerHTML = '';
        
        if (assets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">You have no assets assigned to you.</td></tr>';
            return;
        }

        assets.forEach(asset => {
            const tr = document.createElement('tr');
            
            let badgeClass = 'badge-active';
            if (asset.status === 'Under Repair' || asset.status === 'Maintenance') badgeClass = 'badge-maintenance';
            if (asset.status === 'Retired') badgeClass = 'badge-retired';

            tr.innerHTML = `
                <td>${asset.id}</td>
                <td><strong>${asset.name}</strong></td>
                <td>${asset.category}</td>
                <td><span class="badge ${badgeClass}">${asset.status}</span></td>
                <td>${asset.purchaseDate}</td>
                <td>${asset.warranty || 'N/A'}</td>
                <td>
                    <button class="btn btn-danger btn-small" onclick="openReportIssueModal(${asset.id})">Report Issue</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading assets:', error);
    }
}

// -----------------------------------------
// REPORT ISSUE LOGIC
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
    const date = new Date().toISOString().split('T')[0];

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
            loadUserAssets();
            alert("Issue reported successfully!");
        } else {
            const err = await response.json();
            alert(err.error || 'Failed to report issue');
        }
    } catch (error) {
        console.error('Error reporting issue:', error);
    }
});
