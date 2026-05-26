import { google } from "googleapis";

import {
  createOAuthClient
} from "../services/gmail.service.js";

import {
  getTokens
} from "../utils/tokenStore.js";

import {
  emailQueue
} from "../queues/email.queue.js";

import {
  fetchLatestUnreadEmail
} from "../services/fetchLatestEmail.service.js";

import { sendEmail }
from "../services/sendEmail.service.js";

import { prisma }
from "../config/prisma.js";


export const handleApproval =
  async (req, res) => {

    try {

      const {
        command,
        approvalId
      } = req.body;


      const approval =
        await prisma.approval.findUnique({

          where: {
            approvalId
          }

        });


      if (!approval) {

        return res.status(404).json({

          message:
            "Invalid approval ID"

        });

      }


      if (
        approval.status !== "pending"
      ) {

        return res.json({

          message:
            `Already ${approval.status}`

        });

      }


      // YES
      if (command === "YES") {

        const result =
          await sendEmail(

            approval.recipient,

            approval.subject,

            approval.reply

          );


        if (!result) {

          return res.status(500).json({

            message:
              "Email sending failed"

          });

        }


        await prisma.approval.update({

          where: {
            approvalId
          },

          data: {
            status: "approved"
          }

        });

        await prisma.email.update({

          where: {

            gmailMessageId:
              approval.gmailMessageId

          },

          data: {

            status:
              "approved"

          }

        });


        return res.json({

          message:
            "✅ Email sent successfully"

        });

      }


      // NO
      if (command === "NO") {

        await prisma.approval.update({

          where: {
            approvalId
          },

          data: {
            status: "rejected"
          }

        });

        await prisma.email.update({

          where: {

            gmailMessageId:
              approval.gmailMessageId

          },

          data: {

            status:
              "rejected"
          }

        });
        return res.json({

          message:
            "❌ Reply rejected"

        });

      }

    } catch (error) {

      console.log(
        "❌ Approval Error:"
      );

      console.log(error);


      res.status(500).json({

        message:
          "Approval failed"

      });

    }

  };



// START GMAIL WATCH
export const startWatch =
  async (req, res) => {

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


      const response =
        await gmail.users.watch({

          userId: "me",

          requestBody: {

            topicName:
              "projects/ai-email-agent-496906/topics/gmail-email-agent"

          }

        });


      console.log(
        "✅ Gmail Watch Started"
      );

      console.log(
        response.data
      );


      res.json({

        success: true,

        data: response.data

      });

    } catch (error) {

      console.log(
        "❌ Gmail Watch Error"
      );

      console.log(error);

      res.status(500).json({

        error:
          "Failed to start Gmail watch"

      });

    }

};



export const gmailWebhook =
  async (req, res) => {

    try {

      console.log(
        "📩 Gmail Push Notification Received"
      );


      // ACK GOOGLE IMMEDIATELY
      res.sendStatus(200);


      // FETCH LATEST EMAIL
      const latestEmail =
        await fetchLatestUnreadEmail();


      if (!latestEmail) {

        return;

      }


      console.log(
        "📨 Latest Email:"
      );

      console.log(
        latestEmail.subject
      );


      // ADD TO QUEUE
      await emailQueue.add(

        "process-email",

        latestEmail

      );


      console.log(
        "✅ Email added to queue"
      );

    } catch (error) {

      console.log(
        "❌ Gmail Webhook Error"
      );

      console.log(error);

    }

};