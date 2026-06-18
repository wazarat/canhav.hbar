/** Client-safe Price-Feed Verifier defaults (no Hedera SDK imports). */
import type { BudgetConfig, ApprovalConfig } from "../../lib/policy-state";

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
