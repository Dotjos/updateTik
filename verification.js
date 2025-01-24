const verifyInfo = document.querySelector(".verificationInfo")
const loadingText = document.querySelector(".load")
const clearButton = document.querySelector(".clearBtn") 

const socket = io('http://localhost:3000'); // Adjust to your server's URL if needed
import {verifyBidder} from "./wooCommerce.js"

document.addEventListener('DOMContentLoaded', loadStoredComments);

function loadStoredComments() {
    const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
    storedMessages.forEach(displayComment); // Display each comment
}

// Function to display a comment dynamically on the page
function displayComment(messageData) {
    // If input is an array, process each messageData individually
    if (Array.isArray(messageData)) {
        messageData.forEach((message) => displayComment(message));
        return; // Exit the function after processing the array
    }

    // Handle a single messageData object
    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");
    commentDiv.style.color = messageData.isVerified ? "green" : "red";
    commentDiv.innerHTML = `
        <p><strong>${messageData.username}</strong>: ${messageData.comment}</p>
        <p>Status: <strong>${messageData.isVerified ? "Verified ✅" : "Not Verified ❌"}</strong></p>
    `;
    verifyInfo.appendChild(commentDiv);
}


// Listen for the 'chat-message' event

socket.on('chat-message', async (messageData) => {
loadingText.textContent=""
    if (!messageData.username || !messageData.comment) {
        console.warn("Malformed message data:", messageData);
        return;
    }
    const orderNum = extractNumber(messageData.comment);
    if (orderNum) {
        messageData.isVerified = await verifyBidder(orderNum, messageData.username); // Verify and add result
    } else {
        messageData.isVerified = false; // If no order number, mark as not verified
    }

    // Update localStorage with the verification result
    const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
    storedMessages.push(messageData);
    localStorage.setItem('liveComments', JSON.stringify(storedMessages));

    // Display the updated comment
    // displayComment(messageData);
    displayComment(storedMessages)

});


function extractNumber(comment){
    const numberMatch = comment.match(/\d+/);
    let orderNum
    if (numberMatch) {
        orderNum = numberMatch[0];
        return orderNum
     } else {
        return 0
     }
}
               
clearButton.addEventListener("click", () => {
    // Clear all data stored in localStorage
    localStorage.clear();
});