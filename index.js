const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let hungerStates = {
    block1: 0,
    block2: 0,
    block3: 0
};

// Serve the main menu page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the vtm project page
app.get('/vtm.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'vtm.html'));
});

// Handle client connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Send initial hunger states to the new client
    socket.emit('initialValues', hungerStates);

    // Handle hunger changes from clients
    socket.on('hungerChange', (data) => {
        const { blockId, value } = data;
        hungerStates[blockId] = value;

        // Broadcast hunger change to all clients
        io.emit('updateHunger', { blockId, value });
    });

    // Handle client disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Чтение данных из JSON-файла
app.get('/api/hunger', (req, res) => {
    fs.readFile('hunger.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Error reading the file' });
        }
        res.json(JSON.parse(data));
    });
});

// Запись данных в JSON-файл
app.post('/api/hunger', (req, res) => {
    const newData = req.body; // Здесь мы ожидаем массив

    // Проверяем, что данные — это массив
    if (!Array.isArray(newData) || newData.length === 0) {
        return res.status(400).json({ message: 'Invalid data format. Expected a non-empty array.' });
    }

    // Преобразуем данные в строку JSON и записываем в файл
    fs.writeFile('hunger.json', JSON.stringify(newData, null, 2), (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error writing the file' });
        }
        res.json({ message: 'Data successfully saved' });
    });
});

// ping
app.get('/api/ping', (req, res) => {
    const currentTime = new Date().toLocaleString();
    console.log(`ping ${currentTime}`);
    res.json({ message: `ping ${currentTime}` });
});