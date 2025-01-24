const consumerKey = 'ck_d09ce8555ee69d3916c97e421c56f17ae46817c5';
const consumerSecret = 'cs_89808cafba133c1ab50c00c5e087f1cc7218d307';
const authString = consumerKey + ':' + consumerSecret;


// Function to verify bidder
export async function verifyBidder(bidderNumber, tiktokName) {
    try {
        // Construct the Basic Auth header
        const authHeader = 'Basic ' + btoa(authString);

        // Fetch the order details using bidderNumber (order ID)
        const response = await fetch(`${'https://tiktoknummer.de/wp-json/wc/v3/orders'}/${bidderNumber}`, {
            method: 'GET',
            headers: {
                'Authorization': authHeader
            }
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const order = await response.json(); // Parse the JSON response
        const orderId = order.id; // Correctly get the order ID from the response
        const lineItems = order.line_items || []; // Extract line items from the order
        for (const item of lineItems) {
            const metaData = item.meta_data || [];

            // Find TikTok username in "Dein TikTok Username" key
            const tiktokMeta = metaData.find(meta => meta.key === "Dein TikTok Username");

            // Extract username from "_wapf_meta" if available
            let tiktokUsername = tiktokMeta ? tiktokMeta.value : null;

            if (!tiktokUsername) {
                const wapfMeta = metaData.find(meta => meta.key === "_wapf_meta");
                if (wapfMeta && wapfMeta.value) {
                    const wapfData = wapfMeta.value;
                    const wapfEntry = Object.values(wapfData).find(entry => entry.label === "Dein TikTok Username");
                    tiktokUsername = wapfEntry ? wapfEntry.value : null;
                }
            }

            // Check if the extracted TikTok username matches
            if (tiktokUsername === tiktokName && parseInt(bidderNumber) === orderId) {
                return true; // Valid bidder found, exit the function
            }
        }

        // If no valid bidder was found
        return false;

    } catch (err) {
        console.error("Error verifying bidder:", err.message);
        return false; // Return false if an error occurs
    }
}

    

