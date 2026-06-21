import type {
  BudgetConfig,
  ApprovalConfig,
  CounterpartyConfig,
} from "../../lib/policy-state";
import { getBonzoVaultStrategistWorkerId } from "../../lib/hedera-client";

export const BONZO_VAULT_STRATEGIST_TASK_PRICE_HBAR = 0.01;

export const bonzoVaultStrategistAgentConfig = {
  id: "bonzo-vault-strategist" as const,
  name: "Bonzo Vault Strategist",
  taskType: "write" as const,
  defaultBudget: {
    perTaskCapHbar: 1,
    dailyBudgetHbar: 10,
  } satisfies BudgetConfig,
  defaultApproval: {
    autoApproveBelowHbar: 0.05,
    alwaysApproveTaskTypes: ["write"],
  } satisfies ApprovalConfig,
};

function registryEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS &&
      process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS
  );
}

export function getBonzoVaultStrategistCounterpartyConfig(): CounterpartyConfig {
  const worker = getBonzoVaultStrategistWorkerId();
  const operator = process.env.HEDERA_OPERATOR_ID ?? worker;
  const minReputation = Number(process.env.HBAR_MIN_REPUTATION ?? "0");
  const agentId = process.env.HBAR_BONZO_VAULT_STRATEGIST_AGENT_ID
    ? Number(process.env.HBAR_BONZO_VAULT_STRATEGIST_AGENT_ID)
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

export async function getBonzoVaultStrategistWorkerEvmAddress(): Promise<string> {
  const workerId = getBonzoVaultStrategistWorkerId();
  const { AccountId } = await import("@hiero-ledger/sdk");
  return ("0x" + AccountId.fromString(workerId).toSolidityAddress()).toLowerCase();
}
