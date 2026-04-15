import { getHederaClient } from "@/lib/hedera";

const ALLOWED_TOPICS = new Set([
  "hts",
  "hcs",
  "account",
  "evm",
  "defi",
  "transactions",
]);

export { ALLOWED_TOPICS };

const TOPIC_PLUGIN_MAP: Record<string, string[]> = {
  hts: ["coreHTSPlugin", "coreTokenQueryPlugin"],
  hcs: ["coreConsensusPlugin", "coreConsensusQueryPlugin"],
  account: ["coreAccountPlugin", "coreAccountQueryPlugin"],
  evm: ["coreEVMPlugin", "coreEVMQueryPlugin"],
  defi: ["coreHTSPlugin", "coreTokenQueryPlugin", "coreAccountQueryPlugin"],
  transactions: ["coreTransactionQueryPlugin"],
};

const QUERY_ONLY_FALLBACK = [
  "coreTokenQueryPlugin",
  "coreAccountQueryPlugin",
  "coreConsensusQueryPlugin",
];

const PLUGIN_DESCRIPTIONS: Record<string, string> = {
  coreHTSPlugin: "Hedera Token Service operations",
  coreTokenPlugin: "Token create, mint, transfer, burn",
  coreTokenQueryPlugin: "HTS token queries via Mirror Node",
  coreConsensusPlugin: "Hedera Consensus Service operations",
  coreConsensusQueryPlugin: "HCS topic queries",
  coreAccountPlugin: "Hedera Account Service operations",
  coreAccountQueryPlugin: "Account balance and info queries",
  coreEVMPlugin: "EVM smart contract interactions (ERC-20, ERC-721)",
  coreEVMQueryPlugin: "Smart contract query operations",
  coreSCSPlugin: "Smart Contract Service operations",
  coreTransactionQueryPlugin: "Transaction query operations",
  coreQueriesPlugin: "General Hedera query operations",
};

function resolvePluginNames(topics: string[]): string[] {
  const validated = topics.filter((t) => ALLOWED_TOPICS.has(t));
  if (validated.length === 0) return QUERY_ONLY_FALLBACK;

  const seen = new Set<string>();
  const result: string[] = [];

  for (const topic of validated) {
    const plugins = TOPIC_PLUGIN_MAP[topic] ?? QUERY_ONLY_FALLBACK;
    for (const p of plugins) {
      if (!seen.has(p)) {
        seen.add(p);
        result.push(p);
      }
    }
  }

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolvePlugins(topics: string[]): Promise<any[]> {
  const names = resolvePluginNames(topics);
  const kit = await import("hedera-agent-kit");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pluginMap: Record<string, any> = {
    coreHTSPlugin: kit.coreHTSPlugin,
    coreTokenPlugin: kit.coreTokenPlugin,
    coreTokenQueryPlugin: kit.coreTokenQueryPlugin,
    coreConsensusPlugin: kit.coreConsensusPlugin,
    coreConsensusQueryPlugin: kit.coreConsensusQueryPlugin,
    coreAccountPlugin: kit.coreAccountPlugin,
    coreAccountQueryPlugin: kit.coreAccountQueryPlugin,
    coreEVMPlugin: kit.coreEVMPlugin,
    coreEVMQueryPlugin: kit.coreEVMQueryPlugin,
    coreSCSPlugin: kit.coreSCSPlugin,
    coreTransactionQueryPlugin: kit.coreTransactionQueryPlugin,
    coreQueriesPlugin: kit.coreQueriesPlugin,
  };

  return names.map((n) => pluginMap[n]).filter(Boolean);
}

export interface AIStudioConfig {
  topics: string[];
  skillContext?: string;
}

export async function buildAIStudioToolkit(config: AIStudioConfig) {
  try {
    const { HederaAIToolkit, AgentMode } = await import("hedera-agent-kit");
    const client = getHederaClient();
    const plugins = await resolvePlugins(config.topics);

    const toolkit = new HederaAIToolkit({
      client,
      configuration: {
        tools: [],
        plugins,
        context: { mode: AgentMode.AUTONOMOUS },
      },
    });

    return {
      tools: toolkit.getTools(),
      pluginNames: resolvePluginNames(config.topics),
      fallback: false,
    };
  } catch {
    return {
      tools: {} as Record<string, never>,
      pluginNames: resolvePluginNames(config.topics),
      fallback: true,
    };
  }
}

export function getActivePluginDescriptions(topics: string[]): string {
  const names = resolvePluginNames(topics);
  return names
    .map((n) => `- ${n}: ${PLUGIN_DESCRIPTIONS[n] ?? "Hedera plugin"}`)
    .join("\n");
}

export function buildSystemPrompt(topics: string[], skillContext?: string): string {
  const pluginDesc = getActivePluginDescriptions(topics);
  const topicList = topics.filter((t) => ALLOWED_TOPICS.has(t)).join(", ") || "general queries";

  const base = `You are the CanHav AI Studio Agent — a Hedera-native AI assistant that can explain AND execute on-chain actions on Hedera TESTNET.

IMPORTANT: All actions run on Hedera Testnet. No real HBAR value is at risk. Always confirm this to the user before executing transactions.

You are currently scoped to these Hedera capabilities (${topicList}):
${pluginDesc}

When the user asks you to perform an action:
1. Explain what you're about to do and which Hedera service is involved
2. Execute the action using the available tools
3. Return the result with the transaction ID and a HashScan testnet link (https://hashscan.io/testnet/transaction/<txId>)

When the user asks a knowledge question, draw from the Hedera skills context below. Be specific — cite costs, SDK methods, and code examples.

If a request falls outside your active plugins, explain which plugin they'd need and suggest switching topics.`;

  if (skillContext) {
    return `${base}\n\n--- HEDERA SKILLS KNOWLEDGE BASE ---\n${skillContext.slice(0, 25000)}\n--- END KNOWLEDGE BASE ---`;
  }

  return base;
}
