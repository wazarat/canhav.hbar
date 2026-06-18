/** Client-safe stub agent defaults (no Hedera SDK imports). */
import type { BudgetConfig, ApprovalConfig } from "../../lib/policy-state";

export const STUB_TASK_PRICE_HBAR = 1;

export const stubAgentConfig = {
  id: "stub",
  name: "Policy Stub",
  taskType: "read" as const,
  defaultBudget: {
    perTaskCapHbar: 2,
    dailyBudgetHbar: 10,
  } satisfies BudgetConfig,
  defaultApproval: {
    autoApproveBelowHbar: 0.5,
    alwaysApproveTaskTypes: ["write"],
  } satisfies ApprovalConfig,
};
