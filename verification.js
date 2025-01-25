// const verifyInfo = document.querySelector(".verificationInfo")
// const loadingText = document.querySelector(".load")
// const clearButton = document.querySelector(".clearBtn") 
// const socket = io('https://updatetik.onrender.com'); // Adjust to your server's URL if needed
// import {getAllOrders, verifyBidder} from "./wooCommerce.js"

// document.addEventListener('DOMContentLoaded', loadStoredComments);

// function loadStoredComments() {
//     const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
//     const uniqueMessages = storedMessages.filter((msg, index, self) =>
//         index === self.findIndex(m => m.comment === msg.comment && m.username === msg.username)
//     );
//     uniqueMessages.forEach(displayComment);
//     getAllOrders()
// }


// // Function to display a comment dynamically on the page
// function displayComment(messageData) {
//     const commentDiv = document.createElement("div");
//     commentDiv.classList.add("comment");
    
//     commentDiv.style.color = messageData.isVerified || checkTiktokUsernameInOrders(messageData) ? "green" : "red";
    
//     commentDiv.innerHTML = `
//         <p><strong>${messageData.username}</strong>: ${messageData.comment}</p>
//     `;
//     verifyInfo.appendChild(commentDiv);
// }

// // Listen for the 'chat-message' event

// socket.on('chat-message', async (messageData) => {
//     loadingText.textContent = "";

//     if (!messageData.username || !messageData.comment) {
//         console.warn("Malformed message data:", messageData);
//         return;
//     }

//     const orderNum = Number(extractNumber(messageData.comment));
//     messageData.orderNum = orderNum;

//     if (orderNum && orderNum > 0) {
//         try {
//             messageData.isVerified = await verifyBidder(orderNum, messageData.username);
//         } catch (error) {
//             console.error(`Error verifying bidder (OrderNum: ${orderNum}, Username: ${messageData.username}):`, error);
//             messageData.isVerified = false;
//         }
//     } else {
//         messageData.isVerified = false;
//     }

//     try {
//         const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
//         if (!storedMessages.some(msg => msg.comment === messageData.comment && msg.username === messageData.username)) {
//             storedMessages.push(messageData);
//             localStorage.setItem('liveComments', JSON.stringify(storedMessages));
//         }
//     } catch (error) {
//         console.error("Error updating localStorage:", error);
//     }

//     if (messageData.orderNum !== 0) {
//         displayComment(messageData);
//     } else {
//         console.log("Ignoring comment with orderNum 0:", messageData);
//     }
// });

// function extractNumber(comment){
//     const numberMatch = comment.match(/^\d+/);
//     let orderNum
//     if (numberMatch) {
//         orderNum = numberMatch[0];
//         return orderNum
//      } else {
//         return 0
//      }
// }

// // Function to check if any order has the same TikTok username as messageData.username
// function checkTiktokUsernameInOrders(messageData) {
//     // Use some() to check each order in the array
//     const isPresent = ordersArray.some(order => {
//         const lineItems = order.line_items;

//         // Iterate through each item in line_items
//         for (const item of lineItems) {
//             const metaData = item.meta_data || [];

//             // Find TikTok username in "Dein TikTok Username" key
//             const tiktokMeta = metaData.find(meta => meta.key === "Dein TikTok Username");

//             // Extract username from "_wapf_meta" if available
//             let tiktokUsername = tiktokMeta ? tiktokMeta.value : null;

//             if (!tiktokUsername) {
//                 // If "Dein TikTok Username" is not found, check "_wapf_meta"
//                 const wapfMeta = metaData.find(meta => meta.key === "_wapf_meta");
//                 if (wapfMeta && wapfMeta.value) {
//                     const wapfData = wapfMeta.value;
//                     const wapfEntry = Object.values(wapfData).find(entry => entry.label === "Dein TikTok Username");
//                     tiktokUsername = wapfEntry ? wapfEntry.value : null;
//                 }
//             }

//             // If the TikTok username matches, return true
//             if (tiktokUsername && tiktokUsername === messageData.username) {
//                 return true;
//             }
//         }
        
//         // If no match found for this order, continue to the next order
//         return false;
//     });

//     return isPresent; // Return whether the TikTok username is found
// }

               
// clearButton.addEventListener("click", () => {
//     // Remove the 'liveComments' key from localStorage
//     localStorage.removeItem('liveComments');
//     verifyInfo.textContent=""
// });


const verifyInfo = document.querySelector(".verificationInfo");
const loadingText = document.querySelector(".load");
const clearButton = document.querySelector(".clearBtn");
const socket = io('https://updatetik.onrender.com'); // Adjust to your server's URL if needed
import { getAllOrders, verifyBidder } from "./wooCommerce.js";

document.addEventListener('DOMContentLoaded', loadStoredComments);

async function loadStoredComments() {
    const storedMessages = JSON.parse(localStorage.getItem('liveComments')) || [];
    const uniqueMessages = storedMessages.filter((msg, index, self) =>
        index === self.findIndex(m => m.comment === msg.comment && m.username === msg.username)
    );
    uniqueMessages.forEach(displayComment);

    try {
        const orders = await getAllOrders(); // Get orders asynchronously
        // Use the fetched orders to check TikTok usernames in comments
        socket.on('chat-message', async (messageData) => {
            await handleMessageData(messageData, orders);
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
    }
}

// Function to display a comment dynamically on the page
function displayComment(messageData) {
    const commentDiv = document.createElement("div");
    commentDiv.classList.add("comment");

    // You may want to call checkTiktokUsernameInOrders(messageData, orders) here after orders are fetched
    commentDiv.style.color = messageData.isVerified ? "green" : "red";

    commentDiv.innerHTML = `
        <p><strong>${messageData.username}</strong>: ${messageData.comment}</p>
    `;
    verifyInfo.appendChild(commentDiv);
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

    // Check for TikTok username in orders
    const isTiktokUsernamePresent = await checkTiktokUsernameInOrders(messageData, ordersArray);
    console.log(`TikTok Username ${messageData.username} found in orders: ${isTiktokUsernamePresent}`);
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
