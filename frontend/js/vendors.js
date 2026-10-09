let allVendors = [];
let currentPage = 1;
const rowsPerPage = 10;
let editVendorId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadVendors();

    const vendorForm = document.getElementById('vendorForm');
    if (vendorForm) {
        vendorForm.addEventListener('submit', handleAddVendor);
    }
    
    // Hide 'Add Vendor' button if not admin
    const addVendorBtn = document.querySelector('.btn-primary[onclick="openModal()"]');
    if (addVendorBtn && localStorage.getItem('role') !== 'admin') {
        addVendorBtn.style.display = 'none';
    }
});

async function loadVendors() {
    try {
        const response = await fetch('/api/vendors');
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        const tbody = document.getElementById('vendorsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        const isAdmin = localStorage.getItem('role') === 'admin';

        data.forEach(item => {
            const tr = document.createElement('tr');
            
            let actionHtml = '';
            if (isAdmin) {
                actionHtml = `
                <td>
                    <div class="action-btns">
                        <button class="btn btn-primary btn-small" onclick="editVendor(${item.id})">Edit</button>
                        <button class="btn btn-danger btn-small" onclick="deleteVendor(${item.id})">Delete</button>
                    </div>
                </td>`;
            } else {
                actionHtml = `<td><span class="badge" style="background:#ddd;color:#666;">Read Only</span></td>`;
            }

            tr.innerHTML = `
                <td>${item.id}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.contactPerson}</td>
                <td>${item.email}</td>
                ${actionHtml}
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

function openModal() {
    document.getElementById('vendorModal')?.classList.add('active');
}

function closeModal() {
    document.getElementById('vendorModal')?.classList.remove('active');
    document.getElementById('vendorForm')?.reset();
    editVendorId = null;
    document.querySelector('#vendorModal h3').textContent = 'Add New Vendor';
}

function editVendor(id) {
    const v = allVendors.find(x => x.id === id);
    if (!v) return;
    
    editVendorId = id;
    document.getElementById('vendorName').value = v.name;
    document.getElementById('vendorContact').value = v.contactPerson;
    document.getElementById('vendorEmail').value = v.email;
    document.getElementById('vendorPhone').value = v.phone || '';
    
    document.querySelector('#vendorModal h3').textContent = 'Edit Vendor';
    openModal();
}

async function handleAddVendor(e) {
    e.preventDefault();
    const name = document.getElementById('vendorName').value;
    const contactPerson = document.getElementById('vendorContact').value;
    const email = document.getElementById('vendorEmail').value;
    const phone = document.getElementById('vendorPhone').value;

    try {
        const url = editVendorId ? `/api/vendors/${editVendorId}` : '/api/vendors';
        const method = editVendorId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, contactPerson, email, phone })
        });
        
        if (response.ok) {
            closeModal();
            e.target.reset();
            editVendorId = null;
            loadVendors();
        } else {
            const err = await response.json();
            alert(err.error || 'Failed to save vendor');
        }
    } catch (error) {
        console.error('Error adding vendor:', error);
    }
}

async function deleteVendor(id) {
    if(confirm('Are you sure you want to delete this vendor?')) {
        try {
            const response = await fetch(`/api/vendors/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                loadVendors();
            } else {
                alert('Failed to delete vendor');
            }
        } catch (error) {
            console.error('Error deleting vendor:', error);
        }
    }
}