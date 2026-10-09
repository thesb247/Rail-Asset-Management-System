const fs = require('fs');
const bcrypt = require('bcrypt');

const DB_FILE = './database.json';

const newEmployees = [
  { id: 101, name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "9876543210", department: "IT", role: "user" },
  { id: 102, name: "Priya Verma", email: "priya.verma@example.com", phone: "9876543211", department: "HR", role: "user" },
  { id: 103, name: "Rahul Das", email: "rahul.das@example.com", phone: "9876543212", department: "Finance", role: "user" },
  { id: 104, name: "Sneha Patnaik", email: "sneha.patnaik@example.com", phone: "9876543213", department: "Marketing", role: "user" },
  { id: 105, name: "Vivek Mishra", email: "vivek.mishra@example.com", phone: "9876543214", department: "Sales", role: "user" },
  { id: 106, name: "Neha Singh", email: "neha.singh@example.com", phone: "9876543215", department: "Operations", role: "user" },
  { id: 107, name: "Karan Patel", email: "karan.patel@example.com", phone: "9876543216", department: "IT", role: "user" },
  { id: 108, name: "Ananya Roy", email: "ananya.roy@example.com", phone: "9876543217", department: "HR", role: "user" },
  { id: 109, name: "Rohit Kumar", email: "rohit.kumar@example.com", phone: "9876543218", department: "Finance", role: "user" },
  { id: 110, name: "Pooja Nair", email: "pooja.nair@example.com", phone: "9876543219", department: "Marketing", role: "user" },
  { id: 111, name: "Aditya Joshi", email: "aditya.joshi@example.com", phone: "9876543220", department: "Sales", role: "user" },
  { id: 112, name: "Kavya Reddy", email: "kavya.reddy@example.com", phone: "9876543221", department: "Operations", role: "user" },
  { id: 113, name: "Sandeep Mohanty", email: "sandeep.mohanty@example.com", phone: "9876543222", department: "IT", role: "user" },
  { id: 114, name: "Riya Gupta", email: "riya.gupta@example.com", phone: "9876543223", department: "HR", role: "user" },
  { id: 115, name: "Manish Yadav", email: "manish.yadav@example.com", phone: "9876543224", department: "Finance", role: "user" },
  { id: 116, name: "Ishita Bose", email: "ishita.bose@example.com", phone: "9876543225", department: "Marketing", role: "user" },
  { id: 117, name: "Akash Sahoo", email: "akash.sahoo@example.com", phone: "9876543226", department: "Sales", role: "user" },
  { id: 118, name: "Meera Iyer", email: "meera.iyer@example.com", phone: "9876543227", department: "Operations", role: "user" },
  { id: 119, name: "Nikhil Jain", email: "nikhil.jain@example.com", phone: "9876543228", department: "IT", role: "user" },
  { id: 120, name: "Shreya Kulkarni", email: "shreya.kulkarni@example.com", phone: "9876543229", department: "HR", role: "user" }
];

async function run() {
    let db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    // Default password hash
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    newEmployees.forEach(emp => {
        // Add to employees if not exists
        if (!db.employees.find(e => e.id === emp.id)) {
            db.employees.push(emp);
        }
        
        // Add to users if not exists
        if (!db.users.find(u => u.email === emp.email)) {
            db.users.push({
                id: emp.id, // match ID
                name: emp.name,
                email: emp.email,
                password: hashedPassword,
                role: emp.role
            });
        }
    });

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log("Successfully imported 20 employees and user accounts.");
}

run();
