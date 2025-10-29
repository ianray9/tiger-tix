// llmService.js
require('dotenv').config();
const OpenAI = require('openai');

// Initialize OpenAI
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

/**
 * askLLM(text, context)
 * A conversational ticket assistant — understands natural language,
 * responds conversationally, and confirms before booking.
 */
async function askLLM(text, context = []) {
  if (!openai) {
    return {
      reply: "I'm sorry, the LLM service is not available right now.",
      intent: "unavailable"
    };
  }

  const systemPrompt = `
You are TigerTix, a friendly ticket booking assistant for a university events platform.
You help users browse and book event tickets through natural conversation.
You can:
- Show available events when asked (e.g., "What events are coming up?")
- Help users book tickets (e.g., "I want 2 tickets for the Jazz Night show")
- Ask clarifying questions if details are missing (e.g., "How many tickets would you like?")
- Always confirm before completing a booking ("Should I go ahead and book those?")
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...context,
        { role: "user", content: text }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const reply = response.choices?.[0]?.message?.content?.trim() || "Sorry, I didn't catch that.";
    return { reply };
  } catch (err) {
    console.error("LLM request failed:", err?.message || err);
    return { reply: "Sorry, something went wrong while processing your request." };
  }
}

module.exports = { askLLM };
