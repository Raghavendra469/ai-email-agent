import pkg from "whatsapp-web.js";

import qrcode from "qrcode-terminal";
import QRCode from "qrcode";

import axios from "axios";
import chromium from "@sparticuz/chromium";
const { Client, LocalAuth } = pkg;


// =====================================
// CREATE CLIENT
// =====================================

export const whatsappClient = new Client({

  authStrategy: new LocalAuth(),

  puppeteer: {
    headless: true,
    executablePath: await chromium.executablePath(),
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",      // ← most important for Railway
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",             // ← helps on low memory envs
      "--disable-gpu",
    ],
    protocolTimeout: 60000,           // ← fixes the timeout error
    timeout: 60000,
  },

});


// =====================================
// QR EVENT
// =====================================
let latestQR = null;
whatsappClient.on(

  "qr",

  (qr) => {

    console.log(
      "📲 Scan this QR Code"
    );
    latestQR = qr;
    // const qrImage = await QRCode.toDataURL(qr);

    // console.log(qrImage);

    // qrcode.generate(qr, {

    //   small: true,

    // });

  }

);


// =====================================
// READY EVENT
// =====================================

whatsappClient.on(

  "ready",

  () => {

    console.log(
      "✅ WhatsApp Client Ready"
    );

  }

);


// =====================================
// AUTHENTICATED
// =====================================

whatsappClient.on(

  "authenticated",

  () => {

    console.log(
      "✅ WhatsApp Authenticated"
    );

  }

);


// =====================================
// AUTH FAILURE
// =====================================

whatsappClient.on(

  "auth_failure",

  (msg) => {

    console.log(
      "❌ WhatsApp Auth Failed"
    );

    console.log(msg);

  }

);


// =====================================
// DISCONNECTED
// =====================================

whatsappClient.on(

  "disconnected",

  () => {

    console.log(
      "⚠️ WhatsApp Disconnected"
    );

  }

);


// =====================================
// SEND MESSAGE
// =====================================

export const sendWhatsAppMessage =
  async (

    number,

    message

  ) => {

    try {

      if (!number) {

        console.log(
          "❌ WhatsApp number missing"
        );

        return;

      }


      const chatId =
        `${number}@c.us`;


      await whatsappClient.sendMessage(

        chatId,

        message

      );


      console.log(
        "✅ WhatsApp message sent"
      );

    } catch (error) {

      console.log(
        "❌ WhatsApp Send Error:"
      );

      console.log(error.message);

    }

  };


  whatsappClient.on(

  "message_create",

  async (message) => {

    try {

      console.log(
        "📩 Incoming WhatsApp Message:"
      );

      console.log(
        message.body
      );


      const text =
        message.body
          .trim()
          .toUpperCase();


      const approvalMatch =
        text.match(
          /^(YES|NO)\s+(\S+)/
        );


      if (!approvalMatch) {
        return;
      }


      const command =
        approvalMatch[1];

      const approvalId =
        approvalMatch[2];


      console.log(
        "✅ Approval Command:",
        command
      );

      console.log(
        "🆔 Approval ID:",
        approvalId
      );


      const response =
        await axios.post(

          "https://ai-email-backend-7z1f.onrender.com/gmail/approval",

          {

            command,

            approvalId

          }

        );


      console.log(
        "✅ Backend Approval Response:"
      );

      console.log(
        response.data
      );


      await message.reply(

        response.data.message

      );

    } catch (error) {

      console.log(
        "❌ Approval Listener Error:"
      );

      console.log(
        error.message
      );

    }

  }

);

export const getLatestQR = () => latestQR;


// =====================================
// INITIALIZE CLIENT
// =====================================

export const initializeWhatsApp =
  () => {

    whatsappClient.initialize();

  };