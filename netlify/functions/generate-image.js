import { GoogleGenerativeAI } from "@google/generative-ai";

export async function handler(event) {
  try {
    const { prompt } = JSON.parse(event.body || "{}");

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No prompt provided" }),
      };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const result = await model.generateContent(prompt);

    const imageBase64 =
      result.response.candidates[0].content.parts[0].inlineData.data;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: `data:image/png;base64,${imageBase64}`,
      }),
    };
  } catch (err) {
    console.error("Gemini error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Image generation failed" }),
    };
  }
}

