const verifyInfo = document.querySelector(".verificationInfo");
const loadingText = document.querySelector(".load");
const clearButton = document.querySelector(".clearBtn");
const connectBtn = document.querySelector(".connectBtn");
let ordersCache = [];
let socket = null;
import { getAllOrders, verifyBidder } from "./wooCommerce.js";
// ✅ Load stored comments on page load

document.addEventListener('DOMContentLoaded', () => {
    loadStoredComments(); // ✅ Only load stored comments (No WebSocket connection)
    fetchOrdersPeriodically();
    setInterval(fetchOrdersPeriodically, 60000);
});

async function fetchOrdersPeriodically() {
    try {
        ordersCache = await getAllOrders();
    } catch (error) {
        console.error("Error updating orders:", error);
    }
}

async function loadStoredComments() {
    let storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];

    // ✅ Convert usernames && nicknames to lowercase for case-insensitive uniqueness
    storedMessages = storedMessages.map(msg => ({
        ...msg,
        username: msg.username.toLowerCase(),
        nickname: msg.nickname.toLowerCase()
    }));
 
    // ✅ Ensure unique messages are preserved
    const uniqueMessages = Array.from(
        new Map(storedMessages.map(msg => [`${msg.username}|${msg.comment}`, msg])).values()
    );

    // ✅ Display stored comments on page load
    uniqueMessages.forEach(displayComment);
}
// ✅ Function to initialize WebSocket only when button is clicked
function initializeSocket() {
    if (socket) {
        console.log("⚠️ WebSocket already initialized.");
        return; // Prevent multiple WebSocket connections
    }

    socket = io('https://updatetik-t9b6.onrender.com/', { transports: ["websocket"] });

    socket.on('chat-message', async (messageData) => {
        try {
            messageData.username = messageData.username.toLowerCase();
            messageData.nickname = messageData.nickname.toLowerCase();
            await handleMessageData(messageData);
        } catch (error) {
            console.error("Error handling message data:", error);
        }
    });

    socket.emit("start-tiktok"); // ✅ Start TikTok connection only ONCE

    // ✅ Disable button to prevent multiple connections
    connectBtn.disabled = true;
}

async function handleMessageData(messageData, ordersArray=ordersCache) {
        loadingText.textContent = "";


    if (!messageData.username || !messageData.comment) {
        console.warn("Malformed message data:", messageData);
        return;
    }

    messageData.username = (messageData.username?.toString() || "").toLowerCase();   // ✅ Convert username to lowercase
    messageData.nickname = (messageData.nickname?.toString() || "").toLowerCase();   // ✅ Convert nickname to lowercase
    const orderNum = Number(extractNumber(messageData.comment));
    messageData.orderNum = orderNum;
    messageData.isVerified = false;
    messageData.isTiktokUsernamePresent = false;

    if (orderNum && orderNum > 0) {
        try {
            messageData.isVerified = await verifyBidder(orderNum, messageData.username,messageData.nickname);
        } catch (error) {
            console.error(`Error verifying bidder (OrderNum: ${orderNum}, Username: ${messageData.username}):`, error);
            messageData.isVerified = false;
        }
    }

    try {
        const result= await checkTiktokUsernameInOrders(messageData, ordersArray);
        messageData.isTiktokUsernamePresent = result.isPresent
        messageData.orderNum=result.orderNumber
    } catch (error) {
        console.error("Error checking TikTok username in orders:", error);
    }

    // ✅ Append new messages to `localStorage` before displaying
    try {
        const storedMessages = JSON.parse(localStorage.getItem("liveComments")) || [];
        const messageKey = `${messageData.username.toLowerCase()}|${messageData.comment}`;

        if (!storedMessages.some(msg => `${msg.username.toLowerCase()}|${msg.comment}` === messageKey)) {
            storedMessages.push(messageData);
            localStorage.setItem("liveComments", JSON.stringify(storedMessages));
        }
    } catch (error) {
        console.error("Error updating localStorage:", error);
    }

    displayComment(messageData);
}
// Function to display a comment dynamically on the page
function displayComment(messageData) {
    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");

    // ✅ Convert username to lowercase for consistency
    const username = messageData.username.toLowerCase();

    // ✅ Set color based on verification status
    commentDiv.style.color = messageData.isVerified || messageData.isTiktokUsernamePresent ? "green" : "red";

    commentDiv.innerHTML = `
        ${messageData.orderNum ? `<span>${messageData.orderNum}</span>` : ""} 
        <span><strong>${username}</strong>:<strong>${messageData.nickname}</strong>:${messageData.comment}</span>
    `;


    // console.log(verifyInfo)
    verifyInfo.appendChild(commentDiv);

    // ✅ Ensure smooth scrolling when a new comment is added
    setTimeout(() => {
        verifyInfo.scrollTop = verifyInfo.scrollHeight;
    }, 200);
}

function extractNumber(comment) {
    const numberMatch = comment.match(/^\d+/);
    let orderNum;
    if (numberMatch) {
        orderNum = numberMatch[0];
        return orderNum;
    } else {
        return 0;
    }
}
// Function to check if any order has the same TikTok username as messageData.username
async function checkTiktokUsernameInOrders(messageData, ordersArray) {
    for (const order of ordersArray) {
        const lineItems = order.line_items;

        for (const item of lineItems) {
            const metaData = item.meta_data || [];

            // Find TikTok username in "Dein TikTok Username" key
            const tiktokMeta = metaData.find(meta => meta.key === "Dein TikTok Username");

            // Extract username from "_wapf_meta" if available
            let tiktokUsername = tiktokMeta ? tiktokMeta.value : null;

            if (!tiktokUsername) {
                // If "Dein TikTok Username" is not found, check "_wapf_meta"
                const wapfMeta = metaData.find(meta => meta.key === "_wapf_meta");
                if (wapfMeta && wapfMeta.value) {
                    const wapfData = wapfMeta.value;
                    const wapfEntry = Object.values(wapfData).find(entry => entry.label === "Dein TikTok Username");
                    tiktokUsername = wapfEntry ? wapfEntry.value : null;
                }
            }

            // ✅ Check if the username or nickname matches
            if (
                (tiktokUsername?.toString().toLowerCase() || "") === (messageData.username?.toString().toLowerCase() || "") ||
                (tiktokUsername?.toString().toLowerCase() || "") === (messageData.nickname?.toString().toLowerCase() || "")
            ) {
                return { isPresent: true, orderNumber: order.id }; // Return order number if found
            }
        }
    }

    return { isPresent: false, orderNumber: null }; // Return false if not found
}
// ✅ Start WebSocket only when button is clicked
connectBtn.addEventListener("click", () => {
    initializeSocket();
});
 

function disconnectSocket() {
    if (socket) {
        socket.emit("stop-tiktok"); // Notify server if needed
        socket.disconnect();
        socket = null;
        console.log("✅ WebSocket disconnected.");
    }
}

clearButton.addEventListener("click", () => {
    // Remove the 'liveComments' key from localStorage
    localStorage.removeItem('liveComments');
    verifyInfo.textContent = "";
});




