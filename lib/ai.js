require("dotenv").config();
const { Groq } = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function summarizeNews(text) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional crypto analyst. Summarize the following news article into a single, punchy paragraph. Highlight the 'lowdown' or market implications. Provide the output strictly in JSON format with keys: `headline` (a catchy 1-sentence title), `ai_summary` (the summary), `sentiment` (one of: Mooning, Steady, Chilly, Bleeding, Heating Up), and `related_symbols` (array of uppercase coin tickers). Do not include markdown code block syntax.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "llama-3.1-8b-instant", // Updated to supported model
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error("❌ AI Summarization failed:", error);
    return null;
  }
}

module.exports = { summarizeNews };
