// Handle Login Form Submission
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    // Reset UI
    errorMsg.textContent = "";
    loginBtn.textContent = "Logging in...";

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('name', data.name);
            localStorage.setItem('userId', data.userId);
            
            if (data.role === 'admin') {
                window.location.href = 'dashboard.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        } else {
            errorMsg.textContent = data.message || "Invalid credentials.";
            loginBtn.textContent = "Log In";
        }
    } catch (error) {
        console.error("Error connecting to server:", error);
        errorMsg.textContent = "Cannot connect to server.";
        loginBtn.textContent = "Log In";
    }
});

// Utility to check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    if (!token && currentPage !== 'index.html' && currentPage !== '') {
        window.location.href = 'index.html';
    } else if (token && (currentPage === 'index.html' || currentPage === '')) {
        const role = localStorage.getItem('role');
        window.location.href = role === 'admin' ? 'dashboard.html' : 'user-dashboard.html';
    }

    // Strictly enforce role-based access for the Admin Dashboard and Admin Pages
    const adminOnlyPages = ['dashboard.html', 'assets.html', 'employees.html', 'vendors.html', 'maintenance.html', 'audit.html', 'reports.html'];
    if (token && localStorage.getItem('role') === 'user' && adminOnlyPages.includes(currentPage)) {
        window.location.href = 'user-dashboard.html';
    }

    // Set User Name in Topbar
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = localStorage.getItem('name') || 'Admin User';
    }

    // Role-Based Sidebar Navigation (Admin logic only)
    const role = localStorage.getItem('role');
    if (role === 'user') {
        // Users shouldn't even see the nav menu as it's isolated on user-dashboard.html
        // but just in case, we hide all links
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') !== 'user-dashboard.html') {
                link.parentElement.style.display = 'none';
            }
        });
    }
}

// Logout Utility
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Call checkAuth on every page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Attach logout event listener
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});