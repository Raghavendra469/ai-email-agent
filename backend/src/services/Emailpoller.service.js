import cron from "node-cron";
import { google } from "googleapis";
import { convert } from "html-to-text";
import { createOAuthClient } from "./gmail.service.js";
import { getTokens } from "../utils/tokenstore.js";
import { emailQueue } from "../queues/email.queue.js";
import { cleanEmailBody } from "../utils/cleanEmail.js";

let pollerStarted = false;
let lastHistoryId = null; // tracks where we left off

export const startEmailPoller = () => {
  if (pollerStarted) {
    console.log("⚠️ Poller already running");
    return;
  }
  pollerStarted = true;
  console.log("📬 Email poller started — checking every 2 minutes");

  // Run once immediately on startup
  pollEmails();

  // Then every 2 minutes
  cron.schedule("*/2 * * * *", pollEmails);
};

const pollEmails = async () => {
  try {
    const tokens = getTokens();
    if (!tokens || Object.keys(tokens).length === 0) {
      console.log("⚠️ Poller: no tokens yet, skipping");
      return;
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Build query — only unread emails
    // If we have a historyId, use history API to get only NEW emails
    // Otherwise fall back to listing unread
    let newEmails = [];

    if (lastHistoryId) {
      newEmails = await getEmailsSinceHistory(gmail, lastHistoryId);
    } else {
      newEmails = await getUnreadEmails(gmail);
    }

    if (newEmails.length === 0) {
      console.log("📭 No new emails");
      return;
    }

    console.log(`📬 Found ${newEmails.length} new email(s)`);

    for (const email of newEmails) {
      console.log("➕ Queuing:", email.subject);
      await emailQueue.add("process-email", email);

      // Update historyId to latest
      if (email.historyId) {
        lastHistoryId = email.historyId;
      }
    }

  } catch (error) {
    console.error("❌ Poller error:", error.message);
  }
};

// Get unread emails (first run only)
const getUnreadEmails = async (gmail) => {
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 5,
    q: "is:unread",
  });

  const messages = response.data.messages || [];
  const emails = [];

  for (const message of messages) {
    const parsed = await parseEmail(gmail, message.id);
    if (parsed) emails.push(parsed);
  }

  // Set historyId from the first email so next poll uses history API
  if (emails.length > 0) {
    const profile = await gmail.users.getProfile({ userId: "me" });
    lastHistoryId = profile.data.historyId;
  }

  return emails;
};

// Get only NEW emails since last check using Gmail History API
const getEmailsSinceHistory = async (gmail, startHistoryId) => {
  try {
    const response = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
      labelId: "INBOX",
    });

    const history = response.data.history || [];

    // Update to latest historyId
    if (response.data.historyId) {
      lastHistoryId = response.data.historyId;
    }

    const emails = [];
    const seenIds = new Set();

    for (const record of history) {
      for (const added of record.messagesAdded || []) {
        const msgId = added.message.id;
        if (seenIds.has(msgId)) continue;
        seenIds.add(msgId);

        const parsed = await parseEmail(gmail, msgId);
        if (parsed) emails.push(parsed);
      }
    }

    return emails;

  } catch (error) {
    // historyId expired — reset and do a fresh unread fetch next time
    if (error.code === 404) {
      console.log("⚠️ History expired, resetting...");
      lastHistoryId = null;
    }
    return [];
  }
};

// Parse a Gmail message into clean email object
const parseEmail = async (gmail, messageId) => {
  try {
    const email = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
    });

    // Only process unread emails
    const labels = email.data.labelIds || [];
    if (!labels.includes("UNREAD")) return null;

    const headers = email.data.payload.headers || [];

    let body = "";

    if (email.data.payload.parts) {
      const part = email.data.payload.parts.find(
        (p) => p.mimeType === "text/plain"
      );
      if (part?.body?.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
    } else if (email.data.payload.body?.data) {
      body = Buffer.from(email.data.payload.body.data, "base64").toString("utf-8");
    }

    body = convert(body, { wordwrap: 130 });
    body = cleanEmailBody(body);

    const subject = headers.find((h) => h.name === "Subject")?.value || "No Subject";
    const from    = headers.find((h) => h.name === "From")?.value    || "Unknown";

    return {
      id:        messageId,
      historyId: email.data.historyId,
      subject,
      from,
      body,
    };

  } catch (error) {
    console.error("❌ Failed to parse email:", messageId, error.message);
    return null;
  }
};