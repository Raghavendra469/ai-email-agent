import { google } from "googleapis";

import {
  createOAuthClient
} from "./gmail.service.js";

import {
  getTokens
} from "../utils/tokenstore.js";

import { convert }
from "html-to-text";

import {
  cleanEmailBody
} from "../utils/cleanEmail.js";


export const fetchLatestUnreadEmail =
  async () => {

    try {

      const oauth2Client =
        createOAuthClient();

      oauth2Client.setCredentials(
        getTokens()
      );

      const gmail =
        google.gmail({

          version: "v1",

          auth: oauth2Client

        });


      // GET LATEST UNREAD EMAIL
      const response =
        await gmail.users.messages.list({

          userId: "me",

          maxResults: 1,

          q: "is:unread"

        });


      const messages =
        response.data.messages;


      if (
        !messages ||
        messages.length === 0
      ) {

        console.log(
          "📭 No unread emails"
        );

        return null;

      }


      const messageId =
        messages[0].id;


      // FETCH FULL EMAIL
      const email =
        await gmail.users.messages.get({

          userId: "me",

          id: messageId

        });


      const headers =
        email.data.payload.headers;


      const subject =
        headers.find(
          h => h.name === "Subject"
        )?.value;


      const from =
        headers.find(
          h => h.name === "From"
        )?.value;


      let body = "";


      if (
        email.data.payload.parts
      ) {

        const part =
          email.data.payload.parts.find(

            part =>
              part.mimeType ===
              "text/plain"

          );


        if (
          part &&
          part.body.data
        ) {

          body = Buffer.from(

            part.body.data,

            "base64"

          ).toString("utf-8");

        }

      } else if (

        email.data.payload.body.data

      ) {

        body = Buffer.from(

          email.data.payload.body.data,

          "base64"

        ).toString("utf-8");

      }


      body = convert(body, {
        wordwrap: 130,
      });

      body =
        cleanEmailBody(body);


      // MARK EMAIL AS READ
      await gmail.users.messages.modify({

        userId: "me",

        id: messageId,

        requestBody: {

          removeLabelIds: [
            "UNREAD"
          ]

        }

      });


      return {

        id: messageId,

        from,

        subject,

        body

      };

    } catch (error) {

      console.log(
        "❌ Fetch Latest Email Error"
      );

      console.log(error);

      return null;

    }

};