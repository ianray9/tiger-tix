require('dotenv').config();
const OpenAI = require('openai');

// Initialize OpenAI client if key exists
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

// Purpose: Update an event's info to show one less available ticket from client model
// Inputs: text - Accepts a natural language text (like "Book two tickets for Jazz Night")
// Output: returns a structured JSON object:
//   { intent: "book"|"list"|"unknown", event: string|null, tickets: number|null }
async function askLLMToParse(text) {
    if (!text || !text.trim()) {
        return { intent: "unknown", event: null, tickets: null };
    }
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
            tickets: parsed.tickets ?? null
        };
    } catch (err) {
        console.error("❌ LLM request failed:", err.message);
        return fallbackParse(text);
    }
}

// Purpose: Tries to find a ticket quantity from digits ("2 tickets") or 
// number words ("two tickets", "a ticket").
// Inputs: text - Accepts a natural language text (like "Book two tickets for Jazz Night")
// Output: number of tickets to book for event
function extractTicketQuantity(text) {
    const lower = text.toLowerCase();

    // 1) Look for a digit: "2 tickets", "3 seats"
    const digitMatch = lower.match(/\b(\d+)\s*(tickets?|seats?)\b/);
    if (digitMatch) {
        return parseInt(digitMatch[1], 10);
    }

    // 2) Look for small number words: "two tickets", "a pair of seats"
    const wordToNumber = {
        one: 1,
        a: 1,        // "a ticket"
        an: 1,
        two: 2,
        pair: 2,
        couple: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10
    };

    for (const [word, value] of Object.entries(wordToNumber)) {
        const re = new RegExp(`\\b${word}\\b\\s*(tickets?|seats?)`);
        if (re.test(lower)) {
            return value;
        }
    }

    // 3) No explicit quantity found
    return null;
}

// Purpose: Simple keyword-based and regex parsing for offline or error fallback 
// Inputs: text - Accepts a natural language text (like "Book two tickets for Jazz Night")
// Output: JSON object of parsed message
function fallbackParse(text) {
    const lower = text.toLowerCase();

    // Case 1: show/list events
    if (/(show|list|events|available)/.test(lower)) {
        return { intent: "list", event: null, tickets: null };
    }

    // Case 2: book tickets
    const tickets = extractTicketQuantity(text);

    // Extract event name after "for"
    const eventMatch = text.match(/for\s+(.+)$/i);
    const event = eventMatch ? eventMatch[1].replace(/\.$/, "").trim() : null;

    if (event || tickets !== null) {
        return {
            intent: "book",
            event: event || null,
            // default to 1 only if booking but no explicit quantity
            tickets: tickets !== null ? tickets : 1
        };
    }

    // Case 3: unrecognized input
    return { intent: "unknown", event: null, tickets: null };
}

module.exports = { askLLMToParse };
