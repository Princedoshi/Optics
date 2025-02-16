// const { Client } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");

// const client = new Client();

// client.on("qr", (qr) => {
    
//     console.log("Scan this QR code to log in:");
//     qrcode.generate(qr, { small: true });
// });

// client.on("ready", () => {
//     console.log("WhatsApp Web is ready!");
// });

// client.initialize();

// const sendMessage = async (req, res) => {
//     const { number, message } = req.body;

//     if (!number || !message) {
//         return res.status(400).json({ error: "Number and message are required" });
//     }

//     const formattedNumber = number.startsWith("91") 
//         ? `${number}@s.whatsapp.net`  
//         : `${number}@c.us`;

//     try {
//         await client.sendMessage(formattedNumber, message);
//         res.json({ success: true, message: `Message sent to ${number}` });
//     } catch (error) {
//         res.status(500).json({ error: "Failed to send message", details: error.message });
//     }
// };

// module.exports = { sendMessage };
