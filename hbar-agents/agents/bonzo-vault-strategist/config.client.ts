/** Client-safe Bonzo Vault Strategist defaults (no Hedera SDK imports). */
import type { BudgetConfig, ApprovalConfig } from "../../lib/policy-state";

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
