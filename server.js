const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors'); // Import cors middleware
const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors: {
        origin: ['http://localhost:3000', 'https://updatetik.onrender.com/'],
        methods: ["GET", "POST"]
    }});

    app.use(cors());
    
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));  // Serve index.html from root
    });

// const tiktokUsername = 'ac_grosshandel';
const tiktokUsername = 'kitty_the_queen';

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



const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});


