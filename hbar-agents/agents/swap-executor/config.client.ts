/** Client-safe Swap Executor defaults (no Hedera SDK imports). */
import type { BudgetConfig, ApprovalConfig } from "../../lib/policy-state";

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
