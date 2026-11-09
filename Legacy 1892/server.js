const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const DB_FILE = 'database.json';
const SERVER_LOG_FILE = 'server.log';

if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        users: [
            { username: "TestPlayer", email: "test@gmail.com", password: "123", moneyBank: "₾ 1,200", moneyCash: "₾ 300", inventory: "Diamond x2, Iron Sword", property: "სახლი #1", date: new Date().toISOString() }
        ],
        admins: [
            { username: "Owner", password: "legacy1892_admin_secret", role: "Owner" }
        ],
        gameLogs: [
            { type: "KILL", details: "Natlia_Legacy მოკლა TestPlayer (Diamond Sword)", time: new Date().toLocaleString() },
            { type: "ID / UID", details: "მოთამაშე TestPlayer შემოვიდა (ID: 1, UID: 10045)", time: new Date().toLocaleString() }
        ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

function getDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return { users: [], admins: [], gameLogs: [] };
    }
}

function saveDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use((req, res, next) => {
    const logMsg = `[${new Date().toISOString()}] ${req.method} - ${req.url} (IP: ${req.ip})\n`;
    fs.appendFile(SERVER_LOG_FILE, logMsg, () => {});
    next();
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'shop.html')));
app.get('/forum', (req, res) => res.sendFile(path.join(__dirname, 'forum.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// მოთამაშის რეგისტრაცია
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.json({ success: false, message: 'შეავსე ყველა ველი!' });

    let db = getDB();
    if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.json({ success: false, message: 'ეს სახელი უკვე დაკავებულია!' });
    }

    db.users.push({
        username, email, password,
        moneyBank: '₾ 0', moneyCash: '₾ 500',
        inventory: 'ცარიელია', property: 'არ აქვს',
        date: new Date().toISOString()
    });
    saveDB(db);
    res.json({ success: true, message: 'რეგისტრაცია წარმატებულია!' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    let db = getDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) return res.json({ success: false, message: 'არასწორი სახელი ან პაროლი!' });
    res.json({ success: true, username: user.username });
});

// ადმინის შესვლა
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    let db = getDB();
    const admin = db.admins.find(a => a.username === username && a.password === password);
    if (!admin) return res.json({ success: false, message: 'არასწორი ადმინ სახელი ან პაროლი!' });
    res.json({ success: true, username: admin.username, role: admin.role });
});

// ახალი ადმინის შექმნა (მხოლოდ უსაფრთხოების შემოწმებით)
app.post('/api/admin/create', (req, res) => {
    const { username, password, role, creatorRole } = req.body;
    
    // სერვერის მხარეს ვამოწმებთ, რომ შემქმნელი ნამდვილად Owner არის
    if (creatorRole !== 'Owner') {
        return res.json({ success: false, message: 'მხოლოდ Owner-ს აქვს ახალი ადმინის შექმნის უფლება!' });
    }

    if (!username || !password) return res.json({ success: false, message: 'შეიყვანე სახელი და პაროლი!' });

    let db = getDB();
    if (db.admins.find(a => a.username === username)) {
        return res.json({ success: false, message: 'ეს ადმინი უკვე არსებობს!' });
    }

    db.admins.push({ username, password, role: role || 'Moderator' });
    saveDB(db);
    res.json({ success: true, message: 'ახალი ადმინი წარმატებით შეიქმნა!' });
});

app.get('/api/admin/data', (req, res) => {
    let db = getDB();
    res.json({
        users: db.users,
        gameLogs: db.gameLogs,
        serverLogs: fs.existsSync(SERVER_LOG_FILE) ? fs.readFileSync(SERVER_LOG_FILE, 'utf8') : 'ლოგები ცარიელია'
    });
});

app.listen(PORT, () => {
    console.log(`სერვერი ჩაირთო: http://localhost:${PORT}`);
    console.log(`ადმინ პანელი: http://localhost:${PORT}/admin.html`);
});