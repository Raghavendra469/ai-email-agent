import { google } from "googleapis";

import {
  saveTokens,
  getTokens
} from "../utils/tokenStore.js";


export const createOAuthClient = () => {

  const oauth2Client =
    new google.auth.OAuth2(

      process.env.GOOGLE_CLIENT_ID,

      process.env.GOOGLE_CLIENT_SECRET,

      process.env.GOOGLE_REDIRECT_URI

    );


  // AUTO SAVE REFRESHED TOKENS
  oauth2Client.on(
    "tokens",
    (tokens) => {

      console.log(
        "🔄 Tokens Refreshed"
      );

      const existingTokens =
        getTokens() || {};

      saveTokens({

        ...existingTokens,

        ...tokens

      });

    }
  );

  return oauth2Client;

};


export const getAuthUrl = () => {

  const oauth2Client =
    createOAuthClient();

//   const scopes = [

//     "https://www.googleapis.com/auth/gmail.readonly",

//     "https://www.googleapis.com/auth/gmail.send"

//   ];

    const scopes = [

    "https://mail.google.com/"

    ];

  return oauth2Client.generateAuthUrl({

    access_type: "offline",

    prompt: "consent",

    scope: scopes,

  });

};