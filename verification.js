const verifyInfo = document.querySelector(".verificationInfo")
const loadingText = document.querySelector(".load")
const clearButton = document.querySelector(".clearBtn") 
const socket = io('https://updatetik.onrender.com'); // Adjust to your server's URL if needed
import {getOrders, verifyBidder} from "./wooCommerce.js"

document.addEventListener('DOMContentLoaded', loadStoredComments);

function loadStoredComments() {
    const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
    const uniqueMessages = storedMessages.filter((msg, index, self) =>
        index === self.findIndex(m => m.comment === msg.comment && m.username === msg.username)
    );
    uniqueMessages.forEach(displayComment);
    getOrders()
}


// Function to display a comment dynamically on the page
function displayComment(messageData) {
    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");
    commentDiv.style.color = messageData.isVerified ? "green" : "red";
    commentDiv.innerHTML = `
        <p><strong>${messageData.username}</strong>: ${messageData.comment}</p>
    `;
    verifyInfo.appendChild(commentDiv);
}


// Listen for the 'chat-message' event

// socket.on('chat-message', async (messageData) => {
//     if (loadingText) loadingText.textContent = "";

//     if (!messageData.username || !messageData.comment) {
//         console.warn("Malformed message data:", messageData);
//         return;
//     }

//     const orderNum = Number( extractNumber(messageData.comment))
//     if (orderNum) {
//         try {
//             messageData.isVerified = await verifyBidder(orderNum, messageData.username);
//         } catch (error) {
//             console.error("Error verifying bidder:", error);
//             messageData.isVerified = false; // Default to not verified on error
//         }
//     } else {
//         messageData.isVerified = false;
//     }

//     messageData.orderNum = orderNum; // Add orderNum to the message object

//     try {
//         const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
//         storedMessages.push(messageData); // Add the message object to the stored array
//         localStorage.setItem('liveComments', JSON.stringify(storedMessages));
//     } catch (error) {
//         console.error("Error updating localStorage:", error);
//     }

//     // Display the updated comment
//     if(messageData.orderNum !==0){
//         displayComment(messageData); // Display the latest message only
//     }
// });

socket.on('chat-message', async (messageData) => {
    if (loadingText) loadingText.textContent = "";

    if (!messageData.username || !messageData.comment) {
        console.warn("Malformed message data:", messageData);
        return;
    }

    const orderNum = Number(extractNumber(messageData.comment));
    messageData.orderNum = orderNum;

    if (orderNum && orderNum > 0) {
        try {
            messageData.isVerified = await verifyBidder(orderNum, messageData.username);
        } catch (error) {
            console.error(`Error verifying bidder (OrderNum: ${orderNum}, Username: ${messageData.username}):`, error);
            messageData.isVerified = false;
        }
    } else {
        messageData.isVerified = false;
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

    if (messageData.orderNum !== 0) {
        displayComment(messageData);
    } else {
        console.log("Ignoring comment with orderNum 0:", messageData);
    }
});



function extractNumber(comment){
    const numberMatch = comment.match(/^\d+/);
    let orderNum
    if (numberMatch) {
        orderNum = numberMatch[0];
        return orderNum
     } else {
        return 0
     }
}

               
clearButton.addEventListener("click", () => {
    // Remove the 'liveComments' key from localStorage
    localStorage.removeItem('liveComments');
    verifyInfo.textContent=""
});