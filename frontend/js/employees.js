document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();

    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleAddEmployee);
    }
    
    document.getElementById('employeeSearch')?.addEventListener('input', () => { currentPage = 1; renderEmployees(); });
    document.getElementById('employeeFilter')?.addEventListener('change', () => { currentPage = 1; renderEmployees(); });

    // Hide 'Add Employee' button if not admin
    const addEmployeeBtn = document.querySelector('.btn-primary[onclick="openModal()"]');
    if (addEmployeeBtn && localStorage.getItem('role') !== 'admin') {
        addEmployeeBtn.style.display = 'none';
    }
});

let allEmployees = [];
let currentPage = 1;
const rowsPerPage = 5;
let editEmployeeId = null;

async function loadEmployees() {
    try {
        const response = await fetch('/api/employees', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch employees');
        
        allEmployees = await response.json();
        renderEmployees();
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function renderEmployees() {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const isAdmin = localStorage.getItem('role') === 'admin';
    
    const searchTerm = document.getElementById('employeeSearch')?.value.toLowerCase() || '';
    const filterDept = document.getElementById('employeeFilter')?.value || 'All';

    let filteredEmployees = allEmployees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm) || 
                              emp.id.toString().includes(searchTerm) ||
                              (emp.role && emp.role.toLowerCase().includes(searchTerm));
        const matchesFilter = filterDept === 'All' || emp.department === filterDept;
        return matchesSearch && matchesFilter;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

    paginatedEmployees.forEach(emp => {
        const tr = document.createElement('tr');
        
        let actionHtml = '';
        if (isAdmin) {
            actionHtml = `
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-small" onclick="editEmployee(${emp.id})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteEmployee(${emp.id})">Delete</button>
                </div>
            </td>`;
        } else {
            actionHtml = `<td><span class="badge" style="background:#ddd;color:#666;">Read Only</span></td>`;
        }

        tr.innerHTML = `
            <td>${emp.id}</td>
            <td><strong>${emp.name}</strong></td>
            <td>${emp.email || 'N/A'}</td>
            <td>${emp.phone || 'N/A'}</td>
            <td>${emp.department || 'N/A'}</td>
            <td><span class="badge badge-active">${emp.role || 'User'}</span></td>
            ${actionHtml}
        `;
        tbody.appendChild(tr);
    });
}

function changePage(delta) {
    currentPage += delta;
    renderEmployees();
}

function openModal() {
    document.getElementById('employeeModal')?.classList.add('active');
}

function closeModal() {
    document.getElementById('employeeModal')?.classList.remove('active');
    document.getElementById('employeeForm')?.reset();
    editEmployeeId = null;
    document.querySelector('#employeeModal h3').textContent = 'Add New Employee';
}

function editEmployee(id) {
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;
    
    editEmployeeId = id;
    document.getElementById('employeeName').value = emp.name;
    document.getElementById('employeeEmail').value = emp.email || '';
    document.getElementById('employeePhone').value = emp.phone || '';
    document.getElementById('employeeDepartment').value = emp.department || 'IT';
    document.getElementById('employeeRole').value = emp.role || 'User';
    
    document.querySelector('#employeeModal h3').textContent = 'Edit Employee';
    openModal();
}

async function handleAddEmployee(e) {
    e.preventDefault();
    const name = document.getElementById('employeeName').value;
    const email = document.getElementById('employeeEmail').value;
    const phone = document.getElementById('employeePhone').value;
    const department = document.getElementById('employeeDepartment').value;
    const role = document.getElementById('employeeRole').value;

    try {
        const url = editEmployeeId ? `/api/employees/${editEmployeeId}` : '/api/employees';
        const method = editEmployeeId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, email, phone, department, role })
        });
        
        if (response.ok) {
            closeModal();
            e.target.reset();
            editEmployeeId = null;
            loadEmployees();
        } else {
            const err = await response.json();
            alert(err.error || 'Failed to save employee');
        }
    } catch (error) {
        console.error('Error adding employee:', error);
    }
}

async function deleteEmployee(id) {
    if(confirm('Are you sure you want to delete this employee?')) {
        try {
            const response = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                loadEmployees();
            } else {
                alert('Failed to delete employee');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    }
}