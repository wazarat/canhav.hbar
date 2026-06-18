import type { BudgetConfig, ApprovalConfig, CounterpartyConfig } from "../../lib/policy-state";
import { getStubWorkerId } from "../../lib/hedera-client";

export const STUB_TASK_PRICE_HBAR = 1;

export function getStubCounterpartyConfig(): CounterpartyConfig {
  const worker = getStubWorkerId();
  const operator = process.env.HEDERA_OPERATOR_ID ?? worker;
  return {
    allowlist: [worker, operator],
    minReputation: 0,
  };
}

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
