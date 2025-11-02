require('dotenv').config();
const OpenAI = require('openai');

// Initialize OpenAI client if key exists
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * askLLMToParse
 * ----------------
 * Accepts a natural language text (like "Book two tickets for Jazz Night")
 * and returns a structured JSON object:
 *   { intent: "book"|"list"|"unknown", event: string|null, tickets: number|null }
 */
async function askLLMToParse(text) {
  const prompt = `
You are a JSON-only parser for ticket booking requests.
Respond ONLY with a valid JSON object and nothing else.

Output format:
{
  "intent": "book" | "list" | "unknown",
  "event": string | null,
  "tickets": number | null
}

Examples:
"Book two tickets for Jazz Night." -> {"intent":"book","event":"Jazz Night","tickets":2}
"Show me the events." -> {"intent":"list","event":null,"tickets":null}
"Hey" -> {"intent":"unknown","event":null,"tickets":null}

User input: "${text}"
`;

  // If no OpenAI key, use fallback parser
  if (!openai) {
    console.warn("⚠️ No OpenAI API key found, using fallback parser.");
    return fallbackParse(text);
  }

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0
    });

    const raw = resp.choices?.[0]?.message?.content?.trim() || "";
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonStr = raw.slice(jsonStart, jsonEnd + 1);

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (jsonErr) {
      console.warn("⚠️ JSON parse error from LLM output:", raw);
      return fallbackParse(text);
    }

    // Normalize response
    return {
      intent: parsed.intent || "unknown",
      event: parsed.event || null,
      tickets: parsed.tickets || null
    };
  } catch (err) {
    console.error("❌ LLM request failed:", err.message);
    return fallbackParse(text);
  }
}

/**
 * fallbackParse
 * ----------------
 * Simple keyword-based and regex parsing for offline or error fallback.
 */
function fallbackParse(text) {
  const lower = text.toLowerCase();

  // Case 1: show/list events
  if (/(show|list|events|available)/.test(lower)) {
    return { intent: "list", event: null, tickets: null };
  }

  // Case 2: book tickets
  const ticketMatch = lower.match(/(\d+)\s*(tickets?|seats?)/);
  const tickets = ticketMatch ? parseInt(ticketMatch[1], 10) : null;

  // Extract event name after "for"
  const eventMatch = text.match(/for\s+(.+)$/i);
  const event = eventMatch ? eventMatch[1].replace(/\.$/, '').trim() : null;

  if (event || tickets) {
    return { intent: "book", event: event || null, tickets: tickets || 1 };
  }

  // Case 3: unrecognized input
  return { intent: "unknown", event: null, tickets: null };
}

module.exports = { askLLMToParse };
