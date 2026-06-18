import {
  AgentMode,
  type Context,
  type Plugin,
} from "@hashgraph/hedera-agent-kit";
import { HederaAIToolkit } from "@hashgraph/hedera-agent-kit-ai-sdk";
import { getHbarClient, getStubWorkerId } from "./hedera-client";
import {
  SpendLimitPolicy,
  AllowedCounterpartyPolicy,
  ContextualApprovalPolicy,
  createAuditTrailHook,
} from "./policies";
import type {
  BudgetConfig,
  ApprovalConfig,
  CounterpartyConfig,
} from "./policy-state";
import {
  getPluginsForAgent,
  buildSystemPrompt,
  buildStubSystemPrompt,
  buildYieldScoutSystemPrompt,
  buildSwapExecutorSystemPrompt,
  type HbarAgentId,
} from "./agent-config";
import { bindSessionCounterparty } from "./runtime-session";

export { AGENT_CATALOG } from "./agent-catalog";
export {
  getPluginsForAgent,
  getAgentConfig,
  buildSystemPrompt,
  buildStubSystemPrompt,
  buildYieldScoutSystemPrompt,
  buildSwapExecutorSystemPrompt,
  type HbarAgentId,
} from "./agent-config";

export interface HbarRuntimeConfig {
  sessionId: string;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  counterparty: CounterpartyConfig;
  taskType?: string;
  agentId?: HbarAgentId;
  extraPlugins?: Plugin[];
}

export interface BuiltRuntime {
  toolkit: HederaAIToolkit;
  spendPolicy: SpendLimitPolicy;
  context: Context;
}

export function buildHbarRuntime(config: HbarRuntimeConfig): BuiltRuntime {
  const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
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

  const context: Context & { sessionId?: string } = {
    mode: AgentMode.AUTONOMOUS,
    accountId: process.env.HEDERA_OPERATOR_ID,
    sessionId: config.sessionId,
    hooks: [spendPolicy, counterpartyPolicy, approvalPolicy, ...hooks],
  };

  bindSessionCounterparty(config.sessionId, config.counterparty);

  const agentId = config.agentId ?? "stub";
  const plugins: Plugin[] = getPluginsForAgent(agentId, config.extraPlugins);

  const client = getHbarClient();
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
