// HCS-10 Agent Registration via @hashgraph-online/standards-sdk
// This will be used to register agents in the HOL Registry Broker

export interface HCS10AgentConfig {
  name: string;
  description: string;
  capabilities: string[];
  pricingUsd?: number;
}

// Deferred initialization — only called when credentials are available
export async function registerAgentHCS10(
  config: HCS10AgentConfig
): Promise<{ topicId: string } | null> {
  try {
    // Dynamic import to avoid build issues if SDK is not installed
    const { HCS10Client } = await import("@hashgraph-online/standards-sdk");

    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      console.warn("[hcs10] Missing HEDERA credentials, skipping registration");
      return null;
    }

    const hcs10Client = new HCS10Client({
      network: (process.env.HEDERA_NETWORK as "testnet" | "mainnet") || "testnet",
      operatorId: accountId,
      operatorKey: privateKey,
    });

    const result = await (hcs10Client as Record<string, unknown>).createAgent?.({
      name: config.name,
      description: config.description,
      capabilities: config.capabilities,
    });

    console.log(`[hcs10] Agent registered: ${config.name}`, result);
    return result as { topicId: string } | null;
  } catch (error) {
    console.error("[hcs10] Registration failed:", error);
    return null;
  }
}
