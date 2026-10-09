const fs = require('fs');

const DB_FILE = './database.json';

// Helper to convert DD-MM-YYYY to YYYY-MM-DD
function formatDate(dateStr) {
    if (!dateStr || dateStr.trim() === '-') return '';
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

// Helper to clean price (e.g., ₹72,000 -> 72000)
function cleanPrice(priceStr) {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanStr) || 0;
}

const rawAssets = [
  { id: 201, name: "Dell Latitude 5440 Laptop", category: "Electronics", status: "Available", assignedTo: "Unassigned", purchaseDate: "15-01-2025", price: "₹72,000", warranty: "15-01-2028" },
  { id: 202, name: "Samsung Galaxy S24", category: "Mobile Devices", status: "Available", assignedTo: "Unassigned", purchaseDate: "10-02-2025", price: "₹68,000", warranty: "10-02-2027" },
  { id: 203, name: "Cisco Catalyst 9200 Switch", category: "Network Equipment", status: "Available", assignedTo: "Unassigned", purchaseDate: "05-03-2025", price: "₹1,15,000", warranty: "05-03-2030" },
  { id: 204, name: "Microsoft Office 2021 License", category: "Software", status: "Available", assignedTo: "Unassigned", purchaseDate: "20-01-2025", price: "₹12,500", warranty: "20-01-2035" },
  { id: 205, name: "Ergonomic Office Chair", category: "Furniture", status: "Available", assignedTo: "Unassigned", purchaseDate: "12-12-2024", price: "₹9,500", warranty: "12-12-2027" },
  { id: 206, name: "Executive Wooden Desk", category: "Furniture", status: "Available", assignedTo: "Unassigned", purchaseDate: "18-11-2024", price: "₹18,000", warranty: "18-11-2029" },
  { id: 207, name: "HP LaserJet Pro Printer", category: "Electronics", status: "Available", assignedTo: "Unassigned", purchaseDate: "28-02-2025", price: "₹24,000", warranty: "28-02-2027" },
  { id: 208, name: "A4 Copier Paper (500 Sheets)", category: "Office Supplies", status: "Available", assignedTo: "Unassigned", purchaseDate: "02-06-2025", price: "₹350", warranty: "02-06-2025" },
  { id: 209, name: "Heavy Duty Drill Machine", category: "Machinery & Equipment", status: "Available", assignedTo: "Unassigned", purchaseDate: "16-10-2024", price: "₹32,000", warranty: "16-10-2026" },
  { id: 210, name: "Toyota Innova Crysta", category: "Vehicle", status: "Available", assignedTo: "Unassigned", purchaseDate: "25-08-2023", price: "₹22,50,000", warranty: "25-08-2028" },
  { id: 211, name: "Lenovo ThinkPad E16", category: "Electronics", status: "Available", assignedTo: "Unassigned", purchaseDate: "14-04-2025", price: "₹78,500", warranty: "14-04-2028" },
  { id: 212, name: "Apple iPad Air (M2)", category: "Mobile Devices", status: "Available", assignedTo: "Unassigned", purchaseDate: "30-05-2025", price: "₹59,900", warranty: "30-05-2026" },
  { id: 213, name: "Fortinet FortiGate 60F Firewall", category: "Network Equipment", status: "Available", assignedTo: "Unassigned", purchaseDate: "09-09-2024", price: "₹78,000", warranty: "09-09-2027" },
  { id: 214, name: "Adobe Creative Cloud License", category: "Software", status: "Available", assignedTo: "Unassigned", purchaseDate: "01-04-2025", price: "₹56,000", warranty: "01-04-2026" },
  { id: 215, name: "Conference Room Projector", category: "Electronics", status: "Available", assignedTo: "Unassigned", purchaseDate: "17-01-2025", price: "₹48,000", warranty: "17-01-2027" },
  { id: 216, name: "Whiteboard with Stand", category: "Office Supplies", status: "Available", assignedTo: "Unassigned", purchaseDate: "08-02-2025", price: "₹6,500", warranty: "08-02-2026" },
  { id: 217, name: "CNC Cutting Machine", category: "Machinery & Equipment", status: "Available", assignedTo: "Unassigned", purchaseDate: "15-07-2023", price: "₹4,80,000", warranty: "15-07-2028" },
  { id: 218, name: "Hyundai Creta", category: "Vehicle", status: "Available", assignedTo: "Unassigned", purchaseDate: "22-12-2023", price: "₹16,80,000", warranty: "22-12-2026" },
  { id: 219, name: "Corporate Office Building", category: "Real Estate", status: "Available", assignedTo: "Unassigned", purchaseDate: "01-04-2020", price: "₹5,25,00,000", warranty: "01-04-2050" },
  { id: 220, name: "Dell UltraSharp 27 Monitor", category: "Electronics", status: "Available", assignedTo: "Unassigned", purchaseDate: "11-06-2025", price: "₹32,500", warranty: "11-06-2028" }
];

function run() {
    let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    rawAssets.forEach(a => {
        const formattedAsset = {
            id: a.id,
            name: a.name,
            category: a.category,
            status: a.status,
            assignedTo: a.assignedTo,
            purchaseDate: formatDate(a.purchaseDate),
            price: cleanPrice(a.price),
            warranty: formatDate(a.warranty)
        };
        
        // Add to assets if not exists
        if (!db.assets.find(existing => existing.id === a.id)) {
            db.assets.push(formattedAsset);
        }
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log("Successfully imported 20 assets.");
}

run();
