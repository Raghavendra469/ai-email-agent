import { Worker } from "bullmq";

import { redisConnection } from "../config/redis.js";

import { analyzeEmail } from "../services/ai.service.js";

import {
  prisma
} from "../config/prisma.js";

import axios from "axios";


const worker = new Worker(

  "email-processing",

  async (job) => {

    try {

      console.log(
        "📩 Processing Email Job"
      );

      const emailBody =
        job.data.body;

        // CHECK DUPLICATE
        const existingEmail =

        await prisma.email.findUnique({

            where: {

            gmailMessageId:
                job.data.id

            }

        });


        if (existingEmail) {

        console.log(
            "⚠️ Duplicate email skipped"
        );

        return;

        }


      // AI ANALYSIS
      const result =
        await analyzeEmail(
          emailBody
        );


      console.log(
        "🤖 AI Result:",
        result
      );

      // SAVE EMAIL TO DB
        await prisma.email.create({

        data: {

            gmailMessageId:
            job.data.id,

            from:
            job.data.from,

            subject:
            job.data.subject,

            body:
            job.data.body,

            summary:
            result.summary,

            classification:
            result.classification,

            urgency:
            result.urgency,

            finalAction:
            result.final_action

        }

        });


      // Safety check
      if (!result) {

        console.log(
          "❌ AI returned null"
        );

        return;
      }


      console.log(
        "📌 Final Action:",
        result.final_action
      );


      // ROUTING
      if (

        result.final_action ===
        "notify_and_ask_approval"

      ) {

        console.log(
          "🚨 Urgent email detected"
        );


        // CREATE CUSTOM APPROVAL ID
        const approvalId =
          Date.now().toString();

        await prisma.approval.create({

        data: {

            approvalId,

            gmailMessageId:
            job.data.id,

            recipient:
            job.data.from,

            subject:
            job.data.subject,

            reply:
            result.suggested_reply

        }

        });


        console.log(
          "🧠 Stored Approvals:"
        );

        // WHATSAPP MESSAGE
        const urgentMessage = `

        🚨 URGENT EMAIL

        Subject:
        ${job.data.subject}

        Summary:
        ${result.summary}

        Suggested Reply:
        ${result.suggested_reply}

        Reply with:

        YES ${approvalId}

        or

        NO ${approvalId}

        `;


        // SEND WHATSAPP
        await axios.post(
          `http://localhost:7000/send-message/`,
          {
            number:
              process.env.WHATSAPP_PHONE_NUMBER,
            message:
              urgentMessage
          }
        );


        console.log(
          "✅ Urgent notification sent"
        );

      }
      // NORMAL EMAILS
        else if (

        result.final_action ===
        "dashboard_only"

        ) {

        const normalMessage = `

        📩 New Email

        From:
        ${job.data.from}

        Subject:
        ${job.data.subject}

        Summary:
        ${result.summary}

        `;


        await axios.post(
          `http://localhost:7000/send-message/`,
          {
            number:
              process.env.WHATSAPP_PHONE_NUMBER,
            message:
              normalMessage
          }
        );


        console.log(
            "✅ Normal email summary sent"
        );

        }



        // SPAM
        else if (

        result.final_action ===
        "ignore"

        ) {

        console.log(
            "🗑️ Spam email ignored"
        );

        }

    } catch (error) {

      console.log(
        "❌ Worker Processing Error:"
      );

      console.log(error);

    }

  },

  {
    connection: redisConnection,
  }

);


// SUCCESS EVENT
worker.on(

  "completed",

  () => {

    console.log(
      "🎉 Worker completed job"
    );

  }

);


worker.on(

  "failed",

  (job, err) => {

    console.log(
      "❌ Worker failed"
    );

    console.log(
      "Job ID:",
      job.id
    );

    console.log(
      "Attempts:",
      job.attemptsMade
    );

    console.log(
      "Error:",
      err.message
    );

  }

);


