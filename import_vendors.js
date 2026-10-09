const fs = require('fs');

const DB_FILE = './database.json';

const rawVendors = [
  { name: "TechNova Solutions", contactPerson: "Amit Sharma", email: "amit.sharma@gmail.com", phone: "9876543210" },
  { name: "Elite IT Supplies", contactPerson: "Priya Verma", email: "priya.verma@outlook.com", phone: "9876543211" },
  { name: "Global Office Mart", contactPerson: "Rahul Das", email: "rahul.das@gmail.com", phone: "9876543212" },
  { name: "Prime Electronics", contactPerson: "Sneha Patnaik", email: "sneha.patnaik@outlook.com", phone: "9876543213" },
  { name: "SecureNet Systems", contactPerson: "Vivek Mishra", email: "vivek.mishra@gmail.com", phone: "9876543214" },
  { name: "SmartTech Distributors", contactPerson: "Neha Singh", email: "neha.singh@outlook.com", phone: "9876543215" },
  { name: "Office Essentials India", contactPerson: "Karan Patel", email: "karan.patel@gmail.com", phone: "9876543216" },
  { name: "Digital World Enterprises", contactPerson: "Ananya Roy", email: "ananya.roy@outlook.com", phone: "9876543217" },
  { name: "Vertex Technologies", contactPerson: "Rohit Kumar", email: "rohit.kumar@gmail.com", phone: "9876543218" },
  { name: "NextGen Hardware", contactPerson: "Pooja Nair", email: "pooja.nair@outlook.com", phone: "9876543219" },
  { name: "BluePeak Solutions", contactPerson: "Aditya Joshi", email: "aditya.joshi@gmail.com", phone: "9876543220" },
  { name: "Infinity Office Supplies", contactPerson: "Kavya Reddy", email: "kavya.reddy@outlook.com", phone: "9876543221" },
  { name: "Zenith Equipments", contactPerson: "Sandeep Mohanty", email: "sandeep.mohanty@gmail.com", phone: "9876543222" },
  { name: "Metro Business Systems", contactPerson: "Riya Gupta", email: "riya.gupta@outlook.com", phone: "9876543223" },
  { name: "Fusion Technologies", contactPerson: "Manish Yadav", email: "manish.yadav@gmail.com", phone: "9876543224" },
  { name: "Apex Industrial Supplies", contactPerson: "Ishita Bose", email: "ishita.bose@outlook.com", phone: "9876543225" },
  { name: "Innovatech Solutions", contactPerson: "Akash Sahoo", email: "akash.sahoo@gmail.com", phone: "9876543226" },
  { name: "Alpha Office Products", contactPerson: "Meera Iyer", email: "meera.iyer@outlook.com", phone: "9876543227" },
  { name: "Reliable Asset Suppliers", contactPerson: "Nikhil Jain", email: "nikhil.jain@gmail.com", phone: "9876543228" },
  { name: "FutureLink Technologies", contactPerson: "Shreya Kulkarni", email: "shreya.kulkarni@outlook.com", phone: "9876543229" }
];

function run() {
    let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    // Start IDs at 301
    let nextId = 301;
    
    rawVendors.forEach(v => {
        // Only add if email doesn't already exist
        if (!db.vendors.find(existing => existing.email === v.email)) {
            db.vendors.push({
                id: nextId++,
                name: v.name,
                contactPerson: v.contactPerson,
                email: v.email,
                phone: v.phone
            });
        }
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log("Successfully imported 20 vendors.");
}

run();
