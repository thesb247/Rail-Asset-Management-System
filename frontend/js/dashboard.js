document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Fetch data
        const fetchOptions = {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        };
        const [assetsRes, auditsRes] = await Promise.all([
            fetch('/api/assets', fetchOptions),
            fetch('/api/audits', fetchOptions)
        ]);
        
        if (!assetsRes.ok || !auditsRes.ok) throw new Error('Failed to fetch data');
        
        const assets = await assetsRes.json();
        const audits = await auditsRes.json();
        
        // 1. Calculate Stats
        let assigned = 0, available = 0, maintenance = 0, retired = 0;
        let activeForChart = 0; // For pie chart backward compatibility
        const categoryCounts = {};
        
        assets.forEach(a => {
            // Stats calculation
            if (a.assignedTo && a.assignedTo !== 'Unassigned') assigned++;
            if (a.status === 'Available') available++;
            if (a.status === 'Under Repair' || a.status === 'Maintenance') maintenance++;
            
            // Chart calculations
            if (a.status === 'Available' || a.status === 'Active' || a.status === 'In Use') activeForChart++;
            if (a.status === 'Retired') retired++;
            
            const cat = a.category || 'Other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        document.getElementById('totalAssetsCount').textContent = assets.length;
        document.getElementById('assignedAssetsCount').textContent = assigned;
        document.getElementById('availableAssetsCount').textContent = available;
        document.getElementById('maintenanceCount').textContent = maintenance;

        // 2. Render Charts
        renderCharts(activeForChart, maintenance, retired, categoryCounts);

        // 3. Render Recent Activity
        const recentActivityList = document.getElementById('recentActivityList');
        recentActivityList.innerHTML = '';
        
        const recentAudits = audits.sort((a, b) => b.id - a.id).slice(0, 5);
        if (recentAudits.length === 0) {
            recentActivityList.innerHTML = '<tr><td colspan="3" style="text-align:center;">No recent activity.</td></tr>';
        } else {
            recentAudits.forEach(audit => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${audit.description}</td>
                    <td>${audit.date}</td>
                    <td>${audit.auditor}</td>
                `;
                recentActivityList.appendChild(tr);
            });
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function renderCharts(active, maintenance, retired, categoryCounts) {
    // Colors based on our CSS variables
    const colors = {
        primary: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        danger: '#e74c3c',
        purple: '#9b59b6',
        text: '#333'
    };

    // Status Pie Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active', 'In Maintenance', 'Retired'],
            datasets: [{
                data: [active, maintenance, retired],
                backgroundColor: [colors.success, colors.warning, colors.danger],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: colors.text } }
            }
        }
    });

    // Category Bar Chart
    const categories = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: [
                    colors.primary, colors.success, colors.warning, 
                    colors.danger, colors.purple, '#1abc9c', '#34495e'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: colors.text } }
            }
        }
    });
}