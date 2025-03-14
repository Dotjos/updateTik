const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // Import cors middleware
const app = express();
const server = http.createServer(app);
const path = require('path')

const io = new Server(server,{
    cors: {
        origin: ['http://localhost:3000',"https://updatetik-t9b6.onrender.com/"],
        methods: ["GET", "POST"]
    }});

    app.use(cors());

    // Serve static files from the root directory (if needed, for CSS/JS files)
    app.use(express.static(path.join(__dirname)));

    // Root route will send the index.html from the root directory
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));  // Serve index.html from root
    });

// const tiktokUsername = 'AC Grosshandel';
const tiktokUsername = "ac_grosshandel"

const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

tiktokLiveConnection.connect().then((state) => {
    console.log(`Connected to roomId ${state.roomId}`);
}).catch((err) => {
    console.error('Failed to connect', err);
});

tiktokLiveConnection.on('chat', (data) => {
    const messageData = {
        username: data.uniqueId,
        comment: data.comment,
        nickname:data.nickname
    };
    // console.log(messageData)
    io.emit('chat-message', messageData); // Send message to all connected clients
});

io.on('connection', (socket) => {
    console.log('Client connected');
});

server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000; // 120 seconds

const port = process.env.PORT || 10000; // Use 10000 as the default port
server.listen(port, '0.0.0.0', () => {
    // console.log(`Server listening on http://0.0.0.0:${port}`);
});

