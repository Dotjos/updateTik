const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

const CORS_OPTIONS = {
    origin: ['http://localhost:3000', "https://updatetik-t9b6.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
};

app.use(cors(CORS_OPTIONS));
const io = new Server(server, { cors: CORS_OPTIONS });

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html on root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// TikTok username
const tiktokUsername = "attitude_mistress";

let tiktokLiveConnection = null;
let reconnectTimeout = null; // Store reconnect timeout

// 🔹 Start TikTok Live Connection
const startTikTokLive = async () => {
    if (tiktokLiveConnection && tiktokLiveConnection.isConnected) {
        console.log("TikTok Live connection already active.");
        return;
    }

    console.log("Attempting to connect to TikTok Live...");
    tiktokLiveConnection = new WebcastPushConnection(tiktokUsername, {
        fetchRoomInfoOnConnect: true
    });

    try {
        const state = await tiktokLiveConnection.connect();
        console.log(`✅ Connected to TikTok Live (Room ID: ${state.roomId})`);

        // Listen for chat messages
        tiktokLiveConnection.on('chat', (data) => {
            io.emit('chat-message', {
                username: data.uniqueId,
                comment: data.comment,
                nickname: data.nickname
            });
        });

        // Handle disconnections and attempt reconnect
        tiktokLiveConnection.on('disconnected', () => {
            console.warn("❌ Disconnected from TikTok Live.");
            reconnectTikTokLive();
        });

        // Handle stream end
        tiktokLiveConnection.on('streamEnd', (actionId) => {
            if (actionId === 3) {
                console.warn(`⚠️ Stream ended (Action ID: ${actionId}).`);
                io.emit("live-ended");
            }
            stopTikTokLive();
        });

        // Handle errors
        tiktokLiveConnection.on('error', (err) => {
            console.error("❌ TikTok Live error:", err);
            reconnectTikTokLive();
        });

    } catch (err) {
        console.error("❌ Failed to connect to TikTok Live:", err);
        tiktokLiveConnection = null;
    }
};

// 🔹 Stop TikTok Live Connection
const stopTikTokLive = () => {
    if (tiktokLiveConnection) {
        tiktokLiveConnection.disconnect();
        console.log('🛑 TikTok Live connection stopped.');
        tiktokLiveConnection = null;
    }

    // Clear any pending reconnection attempts
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
};

// 🔹 Attempt to Reconnect after Disconnection
const reconnectTikTokLive = () => {
    console.log("🔄 Attempting to reconnect in 5 seconds...");
    stopTikTokLive();
    reconnectTimeout = setTimeout(startTikTokLive, 5000);
};

// 🔹 Handle Client Connections via WebSocket
io.on('connection', (socket) => {
    console.log('⚡ Client connected');

    socket.on('start-tiktok', startTikTokLive);
    socket.on('stop-tiktok', stopTikTokLive);

    socket.on('disconnect', () => {
        console.log('⚡ Client disconnected');
    });
});

// 🔹 Handle Server Shutdown Gracefully
process.on('SIGINT', () => {
    console.log('🛑 Shutting down server...');
    stopTikTokLive();
    server.close(() => {
        console.log('🚀 Server closed.');
        process.exit(0);
    });
});

// 🔹 Set Server Timeouts (Prevent Idle Disconnects)
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000; // 120 seconds

// 🔹 Start Server
const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${port}`);
});



