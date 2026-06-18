import type {
  BudgetConfig,
  ApprovalConfig,
  CounterpartyConfig,
} from "../../lib/policy-state";
import {
  getYieldScoutWorkerId,
} from "../../lib/hedera-client";

export const YIELD_SCOUT_TASK_PRICE_HBAR = 1;

export const yieldScoutAgentConfig = {
  id: "yield-scout" as const,
  name: "Yield Scout",
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

export function getYieldScoutCounterpartyConfig(): CounterpartyConfig {
  const worker = getYieldScoutWorkerId();
  const operator = process.env.HEDERA_OPERATOR_ID ?? worker;
  const minReputation = Number(process.env.HBAR_MIN_REPUTATION ?? "0");
  const agentId = process.env.HBAR_YIELD_SCOUT_AGENT_ID
    ? Number(process.env.HBAR_YIELD_SCOUT_AGENT_ID)
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

/** Resolve worker EVM address for on-chain registration checks. */
export async function getYieldScoutWorkerEvmAddress(): Promise<string> {
  const workerId = getYieldScoutWorkerId();
  const { AccountId } = await import("@hiero-ledger/sdk");
  return ("0x" + AccountId.fromString(workerId).toSolidityAddress()).toLowerCase();
}
