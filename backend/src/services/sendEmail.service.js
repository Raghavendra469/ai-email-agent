import { google } from "googleapis";

import { createOAuthClient }
from "./gmail.service.js";

import { getTokens }
from "../utils/tokenstore.js";


export const sendEmail = async (

  to,
  subject,
  replyText

) => {

  try {

    const oauth2Client =
      createOAuthClient();

    const tokens =
      getTokens();

    console.log(
      "sendEmail tokens:",
      tokens && Object.keys(tokens).length > 0
    );

    if (!tokens || Object.keys(tokens).length === 0) {
      console.log("❌ No Gmail tokens available to send email.");
      return null;
    }

    oauth2Client.setCredentials(
      tokens
    );

    const gmail = google.gmail({

      version: "v1",

      auth: oauth2Client

    });


    const emailLines = [

      `To: ${to}`,

      "Content-Type: text/plain; charset=utf-8",

      "MIME-Version: 1.0",

      `Subject: Re: ${subject}`,

      "",

      replyText

    ];


    const email = emailLines.join(
      "\n"
    );


    const encodedMessage =
      Buffer.from(email)

      .toString("base64")

      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");


    const result =
      await gmail.users.messages.send({

        userId: "me",

        requestBody: {

          raw: encodedMessage

        }

      });


    console.log(
      "✅ Email Sent Successfully"
    );

    return result.data;

  } catch (error) {

    console.log(
      "❌ Email Send Error:"
    );

    console.log(error);

    return null;

  }

}; 