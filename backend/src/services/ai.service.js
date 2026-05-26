import axios from "axios";
import dotenv from "dotenv";

dotenv.config();


export const analyzeEmail = async (
  email
) => {

  try {

    const response =
    await axios.post(

      `${process.env.AI_AGENT_URL}/analyze`,

      {
        email: email
      }

    );

    return response.data;

  } catch (error) {

    console.log(
      "AI Service Error:",
      error.message
    );

    return null;

  }

};