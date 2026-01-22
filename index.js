const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json()); // parse JSON body

// ======================
// Environment Variables
// ======================
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_verify_token"; // same as in Meta webhook
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Check env vars at startup
if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
  console.error("Error: WHATSAPP_TOKEN or PHONE_NUMBER_ID is missing!");
  process.exit(1); // stop app if env vars are missing
}

console.log("✅ WHATSAPP_TOKEN loaded");
console.log("✅ PHONE_NUMBER_ID loaded");

// ======================
// Health Check Route
// ======================
app.get("/", (req, res) => {
  res.send("WhatsApp bot is running ✅");
});

// ======================
// Webhook Verification
// ======================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification request:", req.query);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully!");
    return res.status(200).send(challenge);
  }

  console.warn("⚠️ Webhook verification failed.");
  return res.sendStatus(403);
});

// ======================
// Receive WhatsApp Messages
// ======================
app.post("/webhook", async (req, res) => {
  console.log("Incoming webhook POST:", JSON.stringify(req.body, null, 2));

  const message =
    req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) return res.sendStatus(200); // nothing to process

  const from = message.from;
  const text = message.text?.body?.toLowerCase() || "";

  let reply = "Sorry, I didn't understand that.";

  if (text.includes("hello")) {
    reply = "Hello 👋 How can I help you?";
  } else if (text.includes("price")) {
    reply = "Our prices start from $99.";
  } else if (text.includes("contact")) {
    reply = "You can contact us at support@example.com";
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`✅ Replied to ${from}: "${reply}"`);
  } catch (err) {
    console.error("❌ Error sending message:", err.response?.data || err.message);
  }

  res.sendStatus(200);
});

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp bot running on port ${PORT}`);
});
