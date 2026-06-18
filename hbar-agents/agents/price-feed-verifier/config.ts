import type {
  BudgetConfig,
  ApprovalConfig,
  CounterpartyConfig,
} from "../../lib/policy-state";
import { getPriceFeedVerifierWorkerId } from "../../lib/hedera-client";

export const PRICE_FEED_VERIFIER_TASK_PRICE_HBAR = 1;

export const priceFeedVerifierAgentConfig = {
  id: "price-feed-verifier" as const,
  name: "Price-Feed Verifier",
  taskType: "read" as const,
  defaultBudget: {
    perTaskCapHbar: 5,
    dailyBudgetHbar: 20,
  } satisfies BudgetConfig,
  defaultApproval: {
    autoApproveBelowHbar: 2,
    alwaysApproveTaskTypes: ["write"],
  } satisfies ApprovalConfig,
};

function registryEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS &&
      process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS
  );
}

export function getPriceFeedVerifierCounterpartyConfig(): CounterpartyConfig {
  const worker = getPriceFeedVerifierWorkerId();
  const operator = process.env.HEDERA_OPERATOR_ID ?? worker;
  const minReputation = Number(process.env.HBAR_MIN_REPUTATION ?? "0");
  const agentId = process.env.HBAR_PRICE_FEED_VERIFIER_AGENT_ID
    ? Number(process.env.HBAR_PRICE_FEED_VERIFIER_AGENT_ID)
    : undefined;

  return {
    allowlist: [worker, operator],
    minReputation,
    registry: {
      enabled: registryEnabled(),
      minReputation,
      agentId,
      fallbackToAllowlist:
        process.env.HBAR_REGISTRY_FALLBACK_ALLOWLIST !== "false",
    },
  };
}

export async function getPriceFeedVerifierWorkerEvmAddress(): Promise<string> {
  const workerId = getPriceFeedVerifierWorkerId();
  const { AccountId } = await import("@hiero-ledger/sdk");
  return ("0x" + AccountId.fromString(workerId).toSolidityAddress()).toLowerCase();
}
