import {
  AgentMode,
  type Context,
  type Plugin,
} from "@hashgraph/hedera-agent-kit";
import { HederaAIToolkit } from "@hashgraph/hedera-agent-kit-ai-sdk";
import { getHvarClient, getStubWorkerId } from "./hedera-client";
import {
  SpendLimitPolicy,
  AllowedCounterpartyPolicy,
  ContextualApprovalPolicy,
  createAuditTrailHook,
} from "./policies";
import { hvarStubPlugin } from "./x402/pay";
import type {
  BudgetConfig,
  ApprovalConfig,
  CounterpartyConfig,
} from "./policy-state";

export { AGENT_CATALOG } from "./agent-catalog";

export interface HvarRuntimeConfig {
  sessionId: string;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  counterparty: CounterpartyConfig;
  taskType?: string;
  extraPlugins?: Plugin[];
}

export interface BuiltRuntime {
  toolkit: HederaAIToolkit;
  spendPolicy: SpendLimitPolicy;
  context: Context;
}

export function buildHvarRuntime(config: HvarRuntimeConfig): BuiltRuntime {
  const auditTopicId = process.env.HVAR_AUDIT_TOPIC_ID;
  const hooks = auditTopicId ? [createAuditTrailHook(auditTopicId)] : [];

  const spendPolicy = new SpendLimitPolicy(config.sessionId, config.budget);
  const counterpartyPolicy = new AllowedCounterpartyPolicy(
    config.sessionId,
    config.counterparty
  );
  const approvalPolicy = new ContextualApprovalPolicy(
    config.sessionId,
    config.approval,
    config.taskType ?? "read"
  );

  const context: Context = {
    mode: AgentMode.AUTONOMOUS,
    accountId: process.env.HEDERA_OPERATOR_ID,
    hooks: [spendPolicy, counterpartyPolicy, approvalPolicy, ...hooks],
  };

  const plugins: Plugin[] = [
    hvarStubPlugin,
    ...(config.extraPlugins ?? []),
  ];

  const client = getHvarClient();
  const toolkit = new HederaAIToolkit({
    client,
    configuration: {
      plugins,
      context,
    },
  });

  return { toolkit, spendPolicy, context };
}

export function defaultStubCounterpartyConfig(): CounterpartyConfig {
  const worker = getStubWorkerId();
  const operator = process.env.HEDERA_OPERATOR_ID ?? worker;
  return {
    allowlist: [worker, operator],
    minReputation: 0,
  };
}

export function buildStubSystemPrompt(budget: BudgetConfig): string {
  return `You are the HVAR Skills stub agent on Hedera testnet.

Your job: when the user asks to run the stub task, call the hvar_stub_pay tool to pay exactly 1 HBAR for the task.

Policy constraints (enforced automatically):
- Per-task cap: ${budget.perTaskCapHbar} HBAR
- Daily budget: ${budget.dailyBudgetHbar} HBAR

Never use mainnet. Explain policy blocks clearly if a payment fails.`;
}
