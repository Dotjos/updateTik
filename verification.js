const verifyInfo = document.querySelector(".verificationInfo");
const loadingText = document.querySelector(".load");
const clearButton = document.querySelector(".clearBtn");
import { getAllOrders, verifyBidder } from "./wooCommerce.js";
const socket = io('https://updatetik.onrender.com/'); // Adjust to your server


document.addEventListener('DOMContentLoaded', loadStoredComments);
    
async function loadStoredComments() {
    const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
    const uniqueMessages = Array.from(
        new Map(storedMessages.map(msg => [`${msg.username}|${msg.comment}`, msg])).values()
    );
    // uniqueMessages.forEach(displayComment);    
    let orders=[]
    //initial order fetching
    try {
         orders = await getAllOrders(); // Get orders asynchronously
    } catch (error) {
        console.error("Error fetching orders:", error);
    }

    // reload of the orders data every 60secs in case of addition to orders while in session

    setInterval(async () => {
        try {
            orders = await getAllOrders();
        } catch (error) {
            console.error("Error updating orders:", error);
        }
    }, 60000); 

    socket.on('chat-message', async (messageData) => {
        try {
            await handleMessageData(messageData, orders);
        } catch (error) {
            console.error("Error handling message data:", error);
        }
    });
}

// Function to display a comment dynamically on the page
function displayComment(messageData) {
    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");

    // You may want to call checkTiktokUsernameInOrders(messageData, orders) here after orders are fetched
    commentDiv.style.color = messageData.isVerified || messageData.isTiktokUsernamePresent ? "green" : "red";

    commentDiv.innerHTML = `
    ${messageData.isVerified ? `<span>${messageData.orderNum}</span>` : ""} <span><strong>${messageData.username}</strong>: ${messageData.comment}</span>
`;

    verifyInfo.appendChild(commentDiv);
    console.log("Comment added:", commentDiv.innerHTML); // Debugging

}

// Handle chat-message and check TikTok username
async function handleMessageData(messageData, ordersArray) {
    loadingText.textContent = "";

    if (!messageData.username || !messageData.comment) {
        console.warn("Malformed message data:", messageData);
        return;
    }

    const orderNum = Number(extractNumber(messageData.comment));
    messageData.orderNum = orderNum;
    messageData.isVerified = false;
    messageData.isTiktokUsernamePresent = false;

    if (orderNum && orderNum > 0) {
        try {
            messageData.isVerified = await verifyBidder(orderNum, messageData.username);
        } catch (error) {
            console.error(`Error verifying bidder (OrderNum: ${orderNum}, Username: ${messageData.username}):`, error);
            messageData.isVerified = false;
        }
    } 

    try {
        const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
        if (!storedMessages.some(msg => msg.comment === messageData.comment && msg.username === messageData.username)) {
            storedMessages.push(messageData);
            localStorage.setItem('liveComments', JSON.stringify(storedMessages));
        }
    } catch (error) {
        console.error("Error updating localStorage:", error);
    }
    // Check for TikTok username in orders
    try {
        messageData.isTiktokUsernamePresent = await checkTiktokUsernameInOrders(messageData, ordersArray);
    } catch (error) {
        console.error("Error checking TikTok username in orders:", error);
    }
    displayComment(messageData);
    console.log(messageData)
}

// Function to extract the order number from a comment
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
    const isPresent = ordersArray.some(order => {
        const lineItems = order.line_items;

        // Iterate through each item in line_items
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

            // If the TikTok username matches, return true
            if (tiktokUsername && tiktokUsername === messageData.username) {
                return true;
            }
        }

        // If no match found for this order, continue to the next order
        return false;
    });

    return isPresent; // Return whether the TikTok username is found
}

clearButton.addEventListener("click", () => {
    // Remove the 'liveComments' key from localStorage
    localStorage.removeItem('liveComments');
    verifyInfo.textContent = "";
});
