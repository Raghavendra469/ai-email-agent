import fs from "fs";

const TOKEN_PATH =
  "./tokens.json";


// SAVE TOKENS
export const saveTokens =
  (tokens) => {

    fs.writeFileSync(

      TOKEN_PATH,

      JSON.stringify(
        tokens,
        null,
        2
      )

    );

    console.log(
      "✅ Tokens Saved"
    );

};


// GET TOKENS
export const getTokens =
  () => {

    try {

      if (
        !fs.existsSync(
          TOKEN_PATH
        )
      ) {

        return null;

      }

      const data =
        fs.readFileSync(
          TOKEN_PATH
        );

      return JSON.parse(data);

    } catch (error) {

      console.log(
        "❌ Token Read Error"
      );

      console.log(error);

      return null;

    }

};