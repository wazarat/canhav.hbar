const ALLOWED_TOPICS = new Set([
  "hts",
  "hcs",
  "account",
  "evm",
  "defi",
  "transactions",
]);

export { ALLOWED_TOPICS };

type PluginEntry = {
  name: string;
  description: string;
};

const TOPIC_PLUGIN_MAP: Record<string, PluginEntry[]> = {
  hts: [
    { name: "coreHTSPlugin", description: "Hedera Token Service operations" },
    { name: "coreTokenQueryPlugin", description: "HTS token queries via Mirror Node" },
  ],
  hcs: [
    { name: "coreConsensusPlugin", description: "Hedera Consensus Service operations" },
    { name: "coreConsensusQueryPlugin", description: "HCS topic queries" },
  ],
  account: [
    { name: "coreAccountPlugin", description: "Hedera Account Service operations" },
    { name: "coreAccountQueryPlugin", description: "Account balance and info queries" },
  ],
  evm: [
    { name: "coreEVMPlugin", description: "EVM smart contract interactions (ERC-20, ERC-721)" },
    { name: "coreEVMQueryPlugin", description: "Smart contract query operations" },
  ],
  defi: [
    { name: "coreHTSPlugin", description: "Hedera Token Service operations" },
    { name: "coreTokenQueryPlugin", description: "HTS token queries via Mirror Node" },
    { name: "coreAccountQueryPlugin", description: "Account balance and info queries" },
  ],
  transactions: [
    { name: "coreTransactionsPlugin", description: "General Hedera transaction operations" },
  ],
};

const QUERY_ONLY_FALLBACK: PluginEntry[] = [
  { name: "coreTokenQueryPlugin", description: "HTS token queries via Mirror Node" },
  { name: "coreAccountQueryPlugin", description: "Account balance and info queries" },
  { name: "coreConsensusQueryPlugin", description: "HCS topic queries" },
];

function resolvePluginNames(topics: string[]): PluginEntry[] {
  const validated = topics.filter((t) => ALLOWED_TOPICS.has(t));
  if (validated.length === 0) return QUERY_ONLY_FALLBACK;

  const seen = new Set<string>();
  const result: PluginEntry[] = [];

  for (const topic of validated) {
    const plugins = TOPIC_PLUGIN_MAP[topic] ?? QUERY_ONLY_FALLBACK;
    for (const p of plugins) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        result.push(p);
      }
    }
  }

  return result;
}

export interface AIStudioConfig {
  topics: string[];
  skillContext?: string;
}

export async function buildAIStudioToolkit(config: AIStudioConfig) {
  try {
    const { HederaAgentKit } = await import("hedera-agent-kit");

    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      return { tools: {}, pluginNames: resolvePluginNames(config.topics), fallback: true };
    }

    const agentKit = new HederaAgentKit(accountId, privateKey, "testnet");

    const pluginEntries = resolvePluginNames(config.topics);

    return {
      agentKit,
      pluginNames: pluginEntries,
      tools: {},
      fallback: false,
    };
  } catch {
    return {
      tools: {},
      pluginNames: resolvePluginNames(config.topics),
      fallback: true,
    };
  }
}

export function getActivePluginDescriptions(topics: string[]): string {
  const plugins = resolvePluginNames(topics);
  return plugins.map((p) => `- ${p.name}: ${p.description}`).join("\n");
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
