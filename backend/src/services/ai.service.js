import axios from "axios";


export const analyzeEmail = async (
  email
) => {

  try {

    const response = await axios.post(

      "http://127.0.0.1:8000/analyze",

      {
        email,
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