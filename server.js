const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // Import cors middleware
const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors: {
        origin: "*", // Allow all origins (use specific origins in production for security)
        methods: ["GET", "POST"]
    }});

    app.use(cors());

const tiktokUsername = 'ac_grosshandel';
const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

tiktokLiveConnection.connect().then((state) => {
    console.log(`Connected to roomId ${state.roomId}`);
}).catch((err) => {
    console.error('Failed to connect', err);
});

tiktokLiveConnection.on('chat', (data) => {
    const messageData = {
        username: data.uniqueId,
        comment: data.comment
    };
    io.emit('chat-message', messageData); // Send message to all connected clients
});

io.on('connection', (socket) => {
    console.log('Client connected');
});

server.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
});


