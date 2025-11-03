const { askLLMToParse } = require("../path/to/llmParser");

describe("LLM Request/Response Parsing", () => {

  test("parses booking request correctly", async () => {
    const input = "Book 2 tickets for Jazz Night.";
    const result = await askLLMToParse(input);

    expect(result).toEqual({
      intent: "book",
      event: "Jazz Night",
      tickets: 2
    });
  });

  test("parses list request correctly", async () => {
    const input = "Show me the events.";
    const result = await askLLMToParse(input);

    expect(result).toEqual({
      intent: "list",
      event: null,
      tickets: null
    });
  });

  test("parses unknown request correctly", async () => {
    const input = "Hello there!";
    const result = await askLLMToParse(input);

    expect(result).toEqual({
      intent: "unknown",
      event: null,
      tickets: null
    });
  });

  test("parses booking request with implied tickets as 1", async () => {
    const input = "Book tickets for Rock Concert.";
    const result = await askLLMToParse(input);

    expect(result).toEqual({
      intent: "book",
      event: "Rock Concert",
      tickets: 1
    });
  });

  test("handles invalid or malformed input gracefully", async () => {
    const input = "";
    const result = await askLLMToParse(input);

    expect(result.intent).toBe("unknown");
  });

});
