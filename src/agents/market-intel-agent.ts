import OpenAI from "openai";
import {
  getAllEntities,
  getSectors,
  searchEntities,
  getEntitiesBySector,
  type MarketMapEntity,
} from "@/lib/market-map";

export interface MarketIntelInput {
  query: string;
  sector?: string;
  filters?: Record<string, string>;
}

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_entities",
      description: "Search the 190-entity Hedera market map by keyword",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sector_entities",
      description: "Get all entities in a specific sector",
      parameters: {
        type: "object",
        properties: { sector: { type: "string" } },
        required: ["sector"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_sectors",
      description: "List all sectors with entity counts",
      parameters: { type: "object", properties: {} },
    },
  },
];

function executeTool(
  name: string,
  args: Record<string, string>
): MarketMapEntity[] | ReturnType<typeof getSectors> {
  switch (name) {
    case "search_entities":
      return searchEntities(args.query);
    case "get_sector_entities":
      return getEntitiesBySector(args.sector);
    case "list_sectors":
      return getSectors();
    default:
      return [];
  }
}

export async function runMarketIntelAgent(
  intake: MarketIntelInput
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const totalEntities = getAllEntities().length;
  const sectorSummary = getSectors()
    .map((s) => `${s.sector} (${s.count})`)
    .join(", ");

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are the CanHav Market Intel Agent — an expert analyst on the Hedera ecosystem. You have access to an institutional-grade market map with ${totalEntities} entities across these sectors: ${sectorSummary}. Use the tools to search and query the data, then provide insightful analysis. Include entity names, organizations, websites, statuses, and practitioner notes when relevant.`,
    },
    {
      role: "user",
      content: intake.sector
        ? `Sector focus: ${intake.sector}\n\nQuery: ${intake.query}`
        : intake.query,
    },
  ];

  let response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    tools,
    max_tokens: 2000,
    temperature: 0.3,
  });

  let msg = response.choices[0]?.message;

  // Handle up to 3 rounds of tool calls
  for (let i = 0; i < 3 && msg?.tool_calls?.length; i++) {
    messages.push(msg);
    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      const result = executeTool(call.function.name, args);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result, null, 2).slice(0, 12000),
      });
    }
    response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      max_tokens: 2000,
      temperature: 0.3,
    });
    msg = response.choices[0]?.message;
  }

  return msg?.content ?? "No response generated.";
}
