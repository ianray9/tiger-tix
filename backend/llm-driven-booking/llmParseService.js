require('dotenv').config();
const OpenAI = require('openai');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function askLLMToParse(text) {
  const prompt = `
You are a JSON-only parser for ticket booking requests.
Parse the user message and respond ONLY with a valid JSON object:
{ "intent": "book" | "list" | "unknown", "event": string or null, "tickets": number or null }

Examples:
"Book two tickets for Jazz Night." -> {"intent":"book","event":"Jazz Night","tickets":2}
"Show me the events." -> {"intent":"list","event":null,"tickets":null}
"Hey" -> {"intent":"unknown","event":null,"tickets":null}

User: "${text}"
`;

  if (!openai) return fallbackParse(text);

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0
    });

    const content = resp.choices?.[0]?.message?.content || "";
    const jsonText = content.slice(content.indexOf("{"));
    const parsed = JSON.parse(jsonText);
    if (parsed.intent) return parsed;
  } catch (err) {
    console.warn("LLM parse failed:", err.message);
  }

  return fallbackParse(text);
}

function fallbackParse(text) {
  const t = text.toLowerCase();
  if (/(show|list|events|available)/.test(t))
    return { intent: "list", event: null, tickets: null };

  const numMatch = t.match(/(\d+)\s*(tickets?|seats?)/);
  const tickets = numMatch ? parseInt(numMatch[1], 10) : null;

  const eventMatch = text.match(/for\s+(.+)$/i);
  const event = eventMatch ? eventMatch[1].replace(/\.$/, '').trim() : null;

  if (event || tickets)
    return { intent: "book", event: event || null, tickets: tickets || 1 };

  return { intent: "unknown", event: null, tickets: null };
}

module.exports = { askLLMToParse };
