/**
 * Optional news sentiment stub for macro gate.
 * Default: returns false (not negative). Set BONZO_NEWS_SENTIMENT_STUB=negative for dev testing.
 */
export async function fetchNewsSentiment(options: {
  enabled: boolean;
}): Promise<boolean | undefined> {
  if (!options.enabled) return undefined;

  const stub = process.env.BONZO_NEWS_SENTIMENT_STUB;
  if (stub === "negative") return true;
  if (stub === "positive") return false;

  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI();
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Assess crypto/DeFi market headline risk. Reply JSON: { "negative": boolean }',
          },
          {
            role: "user",
            content: "Any major negative DeFi or macro headlines in the last 24h?",
          },
        ],
        max_tokens: 64,
      });
      const content = res.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content) as { negative?: boolean };
      return Boolean(parsed.negative);
    } catch (error) {
      console.warn("[bonzo-vault] news sentiment LLM failed:", error);
    }
  }

  return false;
}
