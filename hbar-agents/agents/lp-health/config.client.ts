/** Client-safe LP Health defaults (no Hedera SDK imports). */
import type { BudgetConfig, ApprovalConfig } from "../../lib/policy-state";

export const LP_HEALTH_TASK_PRICE_HBAR = 1;

export const lpHealthAgentConfig = {
  id: "lp-health" as const,
  name: "LP Health Check",
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
