import express from "express";

import dotenv from "dotenv";

import {
  initializeWhatsApp,
  sendWhatsAppMessage
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