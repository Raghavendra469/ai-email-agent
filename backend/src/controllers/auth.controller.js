import { google } from "googleapis";

import {
  getAuthUrl,
  createOAuthClient,
} from "../services/gmail.service.js";

import { saveTokens } from "../utils/tokenStore.js";

export const googleLogin = (req, res) => {
  const url = getAuthUrl();

  res.redirect(url);
};

export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;

    const oauth2Client = createOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);
    saveTokens(tokens);

    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const profile = await gmail.users.getProfile({
      userId: "me",
    });

    res.json({
      message: "Google Login Success",
      email: profile.data.emailAddress,
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Authentication Failed",
    });
  }
};