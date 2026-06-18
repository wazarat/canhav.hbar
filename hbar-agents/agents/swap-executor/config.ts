import type {
  BudgetConfig,
  ApprovalConfig,
  CounterpartyConfig,
} from "../../lib/policy-state";
import { getSwapExecutorWorkerId } from "../../lib/hedera-client";

export const SWAP_EXECUTOR_TASK_PRICE_HBAR = 1;

export const swapExecutorAgentConfig = {
  id: "swap-executor" as const,
  name: "Swap Executor",
  taskType: "write" as const,
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

export function getSwapExecutorCounterpartyConfig(): CounterpartyConfig {
  const worker = getSwapExecutorWorkerId();
  const operator = process.env.HEDERA_OPERATOR_ID ?? worker;
  const minReputation = Number(process.env.HBAR_MIN_REPUTATION ?? "0");
  const agentId = process.env.HBAR_SWAP_EXECUTOR_AGENT_ID
    ? Number(process.env.HBAR_SWAP_EXECUTOR_AGENT_ID)
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
export async function getSwapExecutorWorkerEvmAddress(): Promise<string> {
  const workerId = getSwapExecutorWorkerId();
  const { AccountId } = await import("@hiero-ledger/sdk");
  return ("0x" + AccountId.fromString(workerId).toSolidityAddress()).toLowerCase();
}
