async function exportAssetsCSV() {
    try {
        const response = await fetch('/api/assets', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch assets');
        
        const assets = await response.json();
        
        if (assets.length === 0) {
            alert('No assets found to export.');
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Name,Category,Status,Assigned To,Purchase Date,Price,Warranty\n";

        // Rows
        assets.forEach(a => {
            const row = [
                a.id,
                `"${a.name}"`,
                `"${a.category || ''}"`,
                a.status,
                `"${a.assignedTo || ''}"`,
                a.purchaseDate || '',
                a.price || '',
                a.warranty || ''
            ];
            csvContent += row.join(",") + "\n";
        });

        triggerDownload(csvContent, 'inventory_report.csv');
    } catch (error) {
        console.error('Error exporting assets:', error);
        alert('Failed to export assets.');
    }
}

async function exportMaintenanceCSV() {
    try {
        const response = await fetch('/api/maintenance', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch maintenance logs');
        
        const logs = await response.json();
        
        if (logs.length === 0) {
            alert('No maintenance logs found to export.');
            return;
        }

        // CSV Header
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Asset ID,Description,Date,Cost,Status\n";

        // Rows
        logs.forEach(m => {
            const row = [
                m.id,
                m.assetId,
                `"${m.description}"`,
                m.date,
                m.cost,
                m.status
            ];
            csvContent += row.join(",") + "\n";
        });

        triggerDownload(csvContent, 'maintenance_report.csv');
    } catch (error) {
        console.error('Error exporting maintenance:', error);
        alert('Failed to export maintenance logs.');
    }
}

function triggerDownload(csvContent, fileName) {
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}