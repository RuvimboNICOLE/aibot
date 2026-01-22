const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "my_verify_token";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

console.log('WHATSAPP_TOKEN:', process.env.WHATSAPP_TOKEN ? 'Loaded' : 'Missing');
console.log('PHONE_NUMBER_ID:', process.env.PHONE_NUMBER_ID ? 'Loaded' : 'Missing');


/* Webhook verification */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/* Receive messages */
app.post("/webhook", async (req, res) => {
  const message =
    req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!message) return res.sendStatus(200);

  const from = message.from;
  const text = message.text?.body?.toLowerCase();

  let reply = "Sorry, I didn't understand that.";

  if (text.includes("hello")) {
    reply = "Hello 👋 How can I help you?";
  } else if (text.includes("price")) {
    reply = "Our prices start from $99.";
  } else if (text.includes("contact")) {
    reply = "You can contact us at support@example.com";
  }

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

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("WhatsApp bot running on port 3000");
});

