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
  SlippagePolicy,
} from "./policies";
import { createAuditTrailHookForOperator } from "./policies/audit-trail";
import { getPolicyStateStore } from "./policy-state";
import {
  getPluginsForAgent,
  buildSystemPrompt,
  buildStubSystemPrompt,
  buildYieldScoutSystemPrompt,
  buildSwapExecutorSystemPrompt,
  type HbarAgentId,
} from "./agent-config";
import type {
  BudgetConfig,
  ApprovalConfig,
  CounterpartyConfig,
} from "./policy-state";
import { bindSessionCounterparty } from "./runtime-session";
import { applySaucerSwapContextConfig } from "./plugins/saucerswap";

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
  pluginsOverride?: Plugin[];
}

export interface BuiltRuntime {
  toolkit: HederaAIToolkit;
  spendPolicy: SpendLimitPolicy;
  context: Context;
}

export function buildHbarRuntime(config: HbarRuntimeConfig): BuiltRuntime {
  const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
  const hooks = auditTopicId
    ? [createAuditTrailHookForOperator(auditTopicId)]
    : [];
  const store = getPolicyStateStore();

  const spendPolicy = new SpendLimitPolicy(
    store,
    config.sessionId,
    config.budget
  );
  const counterpartyPolicy = new AllowedCounterpartyPolicy(
    store,
    config.sessionId,
    config.counterparty
  );
  const approvalPolicy = new ContextualApprovalPolicy(
    store,
    config.sessionId,
    config.approval,
    config.taskType ?? "read"
  );
  const slippagePolicy =
    (config.taskType ?? "read") === "write"
      ? new SlippagePolicy(store, config.sessionId)
      : null;

  const context: Context & { sessionId?: string } = {
    mode: AgentMode.AUTONOMOUS,
    accountId: process.env.HEDERA_OPERATOR_ID,
    sessionId: config.sessionId,
    hooks: [
      spendPolicy,
      counterpartyPolicy,
      approvalPolicy,
      ...(slippagePolicy ? [slippagePolicy] : []),
      ...hooks,
    ],
  };

  const agentId = config.agentId ?? "stub";
  if (
    agentId === "swap-executor" ||
    agentId === "price-feed-verifier" ||
    agentId === "custom"
  ) {
    applySaucerSwapContextConfig(context);
  }

  bindSessionCounterparty(config.sessionId, config.counterparty);

  const plugins: Plugin[] =
    config.pluginsOverride ?? getPluginsForAgent(agentId, config.extraPlugins);

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

/** HederaAIToolkit emits `inputSchema`; AI SDK v4 generateText expects `parameters`. */
export function normalizeHederaToolsForAiSdk<T extends Record<string, unknown>>(
  tools: T
): T {
  const normalized = {} as T;
  for (const name of Object.keys(tools)) {
    const toolDef = tools[name] as {
      parameters?: unknown;
      inputSchema?: unknown;
    };
    const schema = toolDef.parameters ?? toolDef.inputSchema;
    if (!schema) {
      throw new Error(`Hedera tool "${name}" is missing a Zod parameters schema`);
    }
    (normalized as Record<string, unknown>)[name] = {
      ...toolDef,
      parameters: schema,
    };
  }
  return normalized;
}

export function defaultStubCounterpartyConfig(): CounterpartyConfig {
  const worker = getStubWorkerId();
  const operator = process.env.HEDERA_OPERATOR_ID ?? worker;
  return {
    allowlist: [worker, operator],
    minReputation: 0,
  };
}
