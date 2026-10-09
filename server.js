const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Configure email transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'dummy@gmail.com',
        pass: process.env.EMAIL_PASS || 'dummypass'
    }
});

// Database Helpers
function readDB() {
    const defaults = { assets: [], employees: [], audits: [], vendors: [], maintenance: [], users: [] };
    if (!fs.existsSync(DB_FILE)) {
        return defaults;
    }
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return { ...defaults, ...data };
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Audit Helper
function logAudit(actionType, description) {
    const db = readDB();
    const newId = db.audits.length > 0 ? Math.max(...db.audits.map(a => a.id)) + 1 : 1;
    const date = new Date().toISOString().split('T')[0];
    db.audits.push({ id: newId, description, date, status: 'Logged', auditor: 'System' });
    writeDB(db);
    console.log(`[AUDIT] ${actionType} - ${description}`);
}

// Initialize Admin and Standard User if missing
async function initDB() {
    const db = readDB();
    let updated = false;

    if (!db.users || db.users.length === 0) {
        db.users = [];
        const hashedPassword = await bcrypt.hash('password123', 10);
        db.users.push({ id: 1, name: 'admin', email: 'admin@system.com', password: hashedPassword, role: 'admin' });
        db.users.push({ id: 2, name: 'user', email: 'user@system.com', password: hashedPassword, role: 'user' });
        updated = true;
    }

    // Auto-generate User accounts for all Employees so they can actually log in
    if (db.employees && db.employees.length > 0) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        for (const emp of db.employees) {
            const userExists = db.users.find(u => u.name === emp.name);
            if (!userExists) {
                const newId = Math.max(...db.users.map(u => u.id)) + 1;
                db.users.push({ id: newId, name: emp.name, email: emp.email, password: hashedPassword, role: 'user' });
                updated = true;
            }
        }
    }

    if (updated) {
        writeDB(db);
    }
}
initDB();

// Middleware: Verify JWT Token and Admin Role
function requireAdmin(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admin access required' });
        req.user = decoded;
        next();
    });
}

function requireAuth(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.user = decoded;
        next();
    });
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------
app.post('/api/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const db = readDB();
        if (db.users.find(u => u.name === name || u.email === email)) {
            return res.status(400).json({ error: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: Date.now(), name, email, password: hashedPassword, role: role || 'user' };
        db.users.push(newUser);
        writeDB(db);
        logAudit('REGISTER', `User ${name} registered.`);
        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const db = readDB();
    const { email, password } = req.body;
    
    const user = db.users.find(u => u.email === email);
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: "Login successful!", token, role: user.role, name: user.name, userId: user.id });
});

// ----------------------------------------------------
// ASSET ROUTES
// ----------------------------------------------------
app.get('/api/assets', requireAuth, (req, res) => {
    const db = readDB();
    if (req.user.role === 'admin') {
        res.json(db.assets);
    } else {
        // RLS: User only sees assets assigned to them
        const userAssets = db.assets.filter(a => a.assignedTo === req.user.name);
        res.json(userAssets);
    }
});

app.post('/api/assets', requireAdmin, (req, res) => {
    const db = readDB();
    const newId = db.assets.length > 0 ? Math.max(...db.assets.map(a => a.id)) + 1 : 1;
    const newAsset = { id: newId, ...req.body, status: req.body.status || 'Available' };
    db.assets.push(newAsset);
    writeDB(db);
    logAudit('CREATE ASSET', `Asset '${newAsset.name}' was added.`);
    res.json(newAsset);
});

app.put('/api/assets/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.assets.findIndex(a => a.id === id);
    if (index === -1) return res.status(404).json({ error: "Asset not found" });
    
    db.assets[index] = { ...db.assets[index], ...req.body };
    writeDB(db);
    logAudit('UPDATE ASSET', `Asset '${db.assets[index].name}' was updated.`);
    res.json(db.assets[index]);
});

app.delete('/api/assets/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.assets = db.assets.filter(a => a.id !== id);
    writeDB(db);
    logAudit('DELETE ASSET', `Asset ID ${id} was deleted.`);
    res.json({ success: true });
});

// Assign Asset
app.put('/api/assets/:id/assign', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { assignedTo, email } = req.body; // email is optional
    const db = readDB();
    const asset = db.assets.find(a => a.id === id);
    if (asset) {
        asset.status = 'In Use';
        asset.assignedTo = assignedTo;
        writeDB(db);
        logAudit('ASSIGN ASSET', `Asset ${id} assigned to ${assignedTo}.`);
        
        // Optionally send email
        if (email && process.env.EMAIL_USER) {
            transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Asset Assigned',
                text: `You have been assigned ${asset.name}.`
            }).catch(console.error);
        }
        res.json({ message: "Assigned successfully" });
    } else {
        res.status(404).json({ error: "Asset not found" });
    }
});

// Return Asset
app.put('/api/assets/:id/return', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const db = readDB();
    const asset = db.assets.find(a => a.id === id);
    if (asset) {
        asset.status = 'Available';
        asset.assignedTo = 'Unassigned';
        writeDB(db);
        logAudit('RETURN ASSET', `Asset ${id} returned.`);
        res.json({ message: "Returned successfully" });
    } else {
        res.status(404).json({ error: "Asset not found" });
    }
});

// QR Code
app.get('/api/assets/:id/qrcode', async (req, res) => {
    const id = parseInt(req.params.id);
    const db = readDB();
    const asset = db.assets.find(a => a.id === id);
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const qrText = `Asset Details
-------------------
ID: ${asset.id}
Item: ${asset.name}
Category: ${asset.category || 'N/A'}
Status: ${asset.status}
Assigned To: ${asset.assignedTo || 'Unassigned'}
Purchase Date: ${asset.purchaseDate || 'N/A'}
Price: $${parseFloat(asset.price || 0).toFixed(2)}
Warranty Expiry: ${asset.warranty || 'N/A'}`;
    try {
        const qrImage = await QRCode.toDataURL(qrText);
        res.json({ qrImage });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate QR code." });
    }
});

// ----------------------------------------------------
// MAINTENANCE ROUTES
// ----------------------------------------------------
app.get('/api/maintenance', (req, res) => res.json(readDB().maintenance));

app.post('/api/maintenance', requireAdmin, (req, res) => {
    const db = readDB();
    const { assetId, assetName, description, date } = req.body;
    
    // Validate Asset exists
    const assetExists = db.assets.find(a => a.id === parseInt(assetId));
    if (!assetExists) return res.status(400).json({ error: `Asset ID ${assetId} does not exist.` });

    // Log maintenance
    const newId = db.maintenance.length > 0 ? Math.max(...db.maintenance.map(m => m.id)) + 1 : 1;
    const newMaint = { id: newId, assetId: parseInt(assetId), assetName, description, date, status: 'In Progress', cost: 0 };
    db.maintenance.push(newMaint);
    
    // Update asset status
    const assetIndex = db.assets.findIndex(a => a.id === parseInt(assetId));
    if (assetIndex !== -1) {
        db.assets[assetIndex].status = 'Under Repair';
    }
    
    writeDB(db);
    logAudit('MAINTENANCE LOGGED', `Maintenance logged for Asset ${assetId}.`);
    res.json(newMaint);
});

// User endpoint to report an issue
app.post('/api/report-issue', requireAuth, (req, res) => {
    const db = readDB();
    const { assetId, description, date } = req.body;
    
    // RLS: User can only report issues for their own assigned assets
    const asset = db.assets.find(a => a.id === parseInt(assetId));
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    if (asset.assignedTo !== req.user.name && req.user.role !== 'admin') {
        return res.status(403).json({ error: "You can only report issues for your assigned assets." });
    }

    const newId = db.maintenance.length > 0 ? Math.max(...db.maintenance.map(m => m.id)) + 1 : 1;
    const newMaint = { id: newId, assetId: parseInt(assetId), assetName: asset.name, description, date, status: 'In Progress', cost: 0 };
    db.maintenance.push(newMaint);
    
    asset.status = 'Under Repair';
    writeDB(db);
    
    logAudit('ISSUE REPORTED', `${req.user.name} reported an issue for Asset ${assetId}.`);
    res.json(newMaint);
});

app.put('/api/maintenance/:id/complete', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const { assetId } = req.body;
    
    const repair = db.maintenance.find(m => m.id === id);
    if (repair) repair.status = 'Completed';

    const asset = db.assets.find(a => a.id === parseInt(assetId));
    if (asset) asset.status = 'Available';

    writeDB(db);
    logAudit('COMPLETE MAINTENANCE', `Maintenance ${id} completed.`);
    res.json({ message: "Completed" });
});

app.delete('/api/maintenance/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.maintenance = db.maintenance.filter(m => m.id !== id);
    writeDB(db);
    logAudit('DELETE MAINTENANCE', `Maintenance record ${id} was deleted.`);
    res.json({ success: true });
});

// ----------------------------------------------------
// EMPLOYEE ROUTES
// ----------------------------------------------------
app.get('/api/employees', requireAuth, (req, res) => {
    const db = readDB();
    if (req.user.role === 'admin') {
        res.json(db.employees);
    } else {
        // RLS: User only sees their own profile
        const userProfile = db.employees.filter(e => e.name === req.user.name);
        res.json(userProfile);
    }
});

app.post('/api/employees', requireAdmin, (req, res) => {
    const db = readDB();
    
    // Check for unique email and phone
    const emailExists = db.employees.some(e => e.email === req.body.email && req.body.email);
    if (emailExists) return res.status(400).json({ error: "Email ID already exists" });
    
    const phoneExists = db.employees.some(e => e.phone === req.body.phone && req.body.phone);
    if (phoneExists) return res.status(400).json({ error: "Phone number already exists" });

    const newEmp = {
        id: db.employees.length > 0 ? Math.max(...db.employees.map(e => e.id)) + 1 : 1,
        ...req.body
    };
    db.employees.push(newEmp);
    writeDB(db);
    logAudit('CREATE EMPLOYEE', `Employee '${newEmp.name}' was added.`);
    res.json(newEmp);
});

app.put('/api/employees/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.employees.findIndex(e => e.id === id);
    if (index === -1) return res.status(404).json({ error: "Employee not found" });
    
    // Check for unique email and phone (excluding current employee)
    const emailExists = db.employees.some(e => e.id !== id && e.email === req.body.email && req.body.email);
    if (emailExists) return res.status(400).json({ error: "Email ID already exists" });
    
    const phoneExists = db.employees.some(e => e.id !== id && e.phone === req.body.phone && req.body.phone);
    if (phoneExists) return res.status(400).json({ error: "Phone number already exists" });

    db.employees[index] = { ...db.employees[index], ...req.body };
    writeDB(db);
    logAudit('UPDATE EMPLOYEE', `Employee '${db.employees[index].name}' was updated.`);
    res.json(db.employees[index]);
});

app.delete('/api/employees/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.employees = db.employees.filter(e => e.id !== id);
    writeDB(db);
    logAudit('DELETE EMPLOYEE', `Employee ID ${id} was deleted.`);
    res.json({ success: true });
});

// ----------------------------------------------------
// OTHER ROUTES
// ----------------------------------------------------
app.get('/api/vendors', (req, res) => res.json(readDB().vendors));

app.post('/api/vendors', requireAdmin, (req, res) => {
    const db = readDB();
    const newId = db.vendors.length > 0 ? Math.max(...db.vendors.map(v => v.id)) + 1 : 1;
    const newVendor = { id: newId, ...req.body };
    db.vendors.push(newVendor);
    writeDB(db);
    logAudit('CREATE VENDOR', `Vendor '${newVendor.name}' was added.`);
    res.json(newVendor);
});

app.put('/api/vendors/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const index = db.vendors.findIndex(v => v.id === id);
    if (index === -1) return res.status(404).json({ error: "Vendor not found" });
    
    db.vendors[index] = { ...db.vendors[index], ...req.body };
    writeDB(db);
    logAudit('UPDATE VENDOR', `Vendor '${db.vendors[index].name}' was updated.`);
    res.json(db.vendors[index]);
});

app.delete('/api/vendors/:id', requireAdmin, (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.vendors = db.vendors.filter(v => v.id !== id);
    writeDB(db);
    logAudit('DELETE VENDOR', `Vendor ID ${id} was deleted.`);
    res.json({ success: true });
});
app.get('/api/audits', (req, res) => res.json(readDB().audits));

app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
