/** Client-safe Yield Scout defaults (no Hedera SDK imports). */
import type { BudgetConfig, ApprovalConfig } from "../../lib/policy-state";

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
