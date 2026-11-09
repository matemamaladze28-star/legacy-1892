const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// რენდერისთვის აუცილებელი პორტის დინამიური მისამართი
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// საჯარო ფაილების (HTML, CSS, JS) მიმაგრება მთავარი საქაღალდიდან
app.use(express.static(path.join(__dirname)));

// ბაზის ფაილის შემოწმება და ინიციალიზაცია
const DB_FILE = path.join(__dirname, 'database.json');

if (!fs.existsSync(DB_FILE)) {
    const initialData = { admins: [], users: [] }; // შენი სტრუქტურის მიხედვით შეგიძლია შეცვალო
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// მთავარი გვერდის როუტი (ინდექსი)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ადმინ პანელის როუტი
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// სერვერის გაშვება
app.listen(PORT, () => {
    console.log(`სერვერი წარმატებით ჩაირთო პორტზე: ${PORT}`);
});