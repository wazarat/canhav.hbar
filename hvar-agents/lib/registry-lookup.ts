import { AccountId } from "@hiero-ledger/sdk";
import { getAgentRegistry, getReputationRegistry } from "@/lib/contracts";

export interface RegistryLookupResult {
  registered: boolean;
  agentId?: number;
  reputation?: number;
  feedbackCount?: number;
  error?: string;
}

function recipientToEvmAddress(recipientId: string): string {
  try {
    if (recipientId.startsWith("0x") && recipientId.length === 42) {
      return recipientId.toLowerCase();
    }
    return (
      "0x" + AccountId.fromString(recipientId).toSolidityAddress()
    ).toLowerCase();
  } catch {
    return recipientId.toLowerCase();
  }
}

export async function lookupAgentByRecipient(
  recipientId: string,
  knownAgentId?: number
): Promise<RegistryLookupResult> {
  try {
    const registry = getAgentRegistry();
    const reputationRegistry = getReputationRegistry();
    const recipientEvm = recipientToEvmAddress(recipientId);

    if (knownAgentId !== undefined) {
      const wallet = (await registry.getAgentWallet(knownAgentId)) as string;
      if (wallet.toLowerCase() === recipientEvm) {
        const summary = await reputationRegistry.getSummary(knownAgentId);
        const count = Number(summary.count ?? summary[0] ?? 0);
        const totalValue = Number(summary.totalValue ?? summary[1] ?? 0);
        return {
          registered: true,
          agentId: knownAgentId,
          reputation: totalValue,
          feedbackCount: count,
        };
      }
    }

    const nextId = Number(await registry.nextAgentId());
    for (let agentId = 0; agentId < nextId; agentId++) {
      try {
        const wallet = (await registry.getAgentWallet(agentId)) as string;
        if (wallet.toLowerCase() === recipientEvm) {
          const summary = await reputationRegistry.getSummary(agentId);
          const count = Number(summary.count ?? summary[0] ?? 0);
          const totalValue = Number(summary.totalValue ?? summary[1] ?? 0);
          return {
            registered: true,
            agentId,
            reputation: totalValue,
            feedbackCount: count,
          };
        }
      } catch {
        // skip invalid agent ids
      }
    }

    return { registered: false };
  } catch (error) {
    return {
      registered: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function isRecipientAllowedByRegistry(
  recipientId: string,
  minReputation: number,
  knownAgentId?: number
): Promise<{ allowed: boolean; reason?: string }> {
  const lookup = await lookupAgentByRecipient(recipientId, knownAgentId);

  if (lookup.error) {
    return {
      allowed: false,
      reason: `Registry lookup failed: ${lookup.error}`,
    };
  }

  if (!lookup.registered) {
    return {
      allowed: false,
      reason: `Counterparty not allowlisted: ${recipientId} is not a registered agent`,
    };
  }

  const reputation = lookup.reputation ?? 0;
  if (reputation < minReputation) {
    return {
      allowed: false,
      reason: `Counterparty reputation ${reputation} below minimum ${minReputation}`,
    };
  }

  return { allowed: true };
}
