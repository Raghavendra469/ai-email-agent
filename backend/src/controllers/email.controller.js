import { google } from "googleapis";
import { convert } from "html-to-text";

import { createOAuthClient } from "../services/gmail.service.js";

import { getTokens } from "../utils/tokenstore.js";
import { cleanEmailBody } from "../utils/cleanEmail.js";

import { emailQueue } from "../queues/email.queue.js";

export const getEmails = async (req, res) => {

  console.log("GET /emails request received");

  try {

    // Create OAuth client
    const oauth2Client = createOAuthClient();

    // Get saved tokens
    const tokens = getTokens();

    const hasTokens = tokens && Object.keys(tokens).length > 0;
    console.log("Saved tokens present:", hasTokens);
    if (!hasTokens) {
      console.log("No saved Gmail tokens found. Redirect to /auth/google first.");
      return res.status(401).json({
        success: false,
        error: "No Gmail authentication tokens found. Please authenticate via /auth/google.",
      });
    }

    oauth2Client.setCredentials(tokens);

    // Create Gmail API instance
    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    // Fetch latest emails
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
    });

    const messages = response.data.messages || [];

    const emailData = [];
    console.log("Fetching emails...");

    for (const message of messages) {
       console.log("Processing email:", message.id);
      // Get full email
      const email = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      const headers = email.data.payload.headers || [];

      let body = "";

      // Handle multipart emails
      if (email.data.payload.parts) {

        const part = email.data.payload.parts.find(
          part => part.mimeType === "text/plain"
        );

        if (part && part.body.data) {

          body = Buffer.from(
            part.body.data,
            "base64"
          ).toString("utf-8");

        }

      }

      // Handle simple emails
      else if (email.data.payload.body.data) {

        body = Buffer.from(
          email.data.payload.body.data,
          "base64"
        ).toString("utf-8");

      }

      // Convert HTML to readable text
      body = convert(body, {
        wordwrap: 130,
      });

      // Clean unwanted content
      body = cleanEmailBody(body);

      // Extract subject
      const subject = headers.find(
        h => h.name === "Subject"
      )?.value || "No Subject";

      // Extract sender
      const from = headers.find(
        h => h.name === "From"
      )?.value || "Unknown Sender";

      console.log("Adding job to queue...");

      // Add job to BullMQ queue
      await emailQueue.add(
        "analyze-email",
        {
          id: message.id,
          subject,
          from,
          body,
        }
      );

      console.log("Job added successfully");

      // Store clean email data
      emailData.push({
        id: message.id,
        subject,
        from,
        body,
        status: "Queued for AI processing",
      });

    }

    return res.json({
      success: true,
      totalEmails: emailData.length,
      emails: emailData,
    });

  } catch (error) {

    console.log("Email Fetch Error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch emails",
    });

  }

};