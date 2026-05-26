import express from "express";

import dotenv from "dotenv";
import QRCode from "qrcode"; 

import {
  initializeWhatsApp,
  sendWhatsAppMessage,
  getLatestQR
} from "./services/whatsapp.service.js";


dotenv.config();

const app = express();

app.use(express.json());

initializeWhatsApp();

app.post(

  "/send-message",

  async (req, res) => {

    try {

      const {
        number,
        message
      } = req.body;

      await sendWhatsAppMessage(
        number,
        message
      );

      res.json({
        success: true
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error:
          "Failed to send message"
      });

    }

  }

);

app.get("/qr", async (req, res) => {
  const qr = getLatestQR();
  if (!qr) {
    return res.send(`
      <html><body style="font-family:sans-serif;padding:20px">
        <h2>QR not ready yet</h2>
        <p>Wait 10 seconds and <a href="/qr">refresh</a></p>
      </body></html>
    `);
  }
  const img = await QRCode.toBuffer(qr);
  res.setHeader("Content-Type", "image/png");
  res.send(img);
});


app.get("/health", (req, res) => {

  res.json({

    status: "ok",

    service: "whatsapp-gateway"

  });

});

app.listen(

  7000,

  () => {

    console.log(
      "🚀 WhatsApp Gateway Running"
    );

  }

);