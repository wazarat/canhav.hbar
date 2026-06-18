import { buildHbarRuntime } from "./agent-runtime";
import { HBAR_STUB_PAY_TOOL, hbarStubPlugin } from "./x402/pay";
import { getHbarClient } from "./hedera-client";
import { getLastApprovalId } from "./policies";
import { getLatestPolicyEvent } from "./policy-state";
import { logPolicyDecisionToHcs } from "./policies/audit-trail";
import { validateCounterpartyBeforePayment } from "./validate-counterparty";
import type { BudgetConfig, ApprovalConfig } from "./policy-state";
import {
  stubAgentConfig,
  STUB_TASK_PRICE_HBAR,
  getStubCounterpartyConfig,
} from "@hbar/agents/stub/config";
import {
  yieldScoutAgentConfig,
  YIELD_SCOUT_TASK_PRICE_HBAR,
  getYieldScoutCounterpartyConfig,
} from "@hbar/agents/yield-scout/config";
import {
  swapExecutorAgentConfig,
  SWAP_EXECUTOR_TASK_PRICE_HBAR,
  getSwapExecutorCounterpartyConfig,
} from "@hbar/agents/swap-executor/config";
import {
  lpHealthAgentConfig,
  LP_HEALTH_TASK_PRICE_HBAR,
  getLpHealthCounterpartyConfig,
} from "@hbar/agents/lp-health/config";
import {
  priceFeedVerifierAgentConfig,
  PRICE_FEED_VERIFIER_TASK_PRICE_HBAR,
  getPriceFeedVerifierCounterpartyConfig,
} from "@hbar/agents/price-feed-verifier/config";
import { CUSTOM_TASK_PRICE_HBAR } from "@hbar/lib/custom-agent";
import type { HbarAgentId } from "./agent-config";
import { getAgentConfig } from "./agent-config";
import { buildStubTaskResult, buildYieldScoutTaskResult } from "./x402/facilitator";

export interface PayRequest {
  sessionId: string;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  amountHbar?: number;
  agentId?: HbarAgentId;
  taskType?: string;
}

export type PayResponse =
  | { status: "success"; result: unknown; txId?: string; policyState: string }
  | { status: "blocked"; policy: string; reason: string; policyState: string }
  | {
      status: "pending_approval";
      approvalId: string;
      recipient: string;
      amountHbar: number;
      policyState: string;
    };

function resolveAgent(agentId?: HbarAgentId) {
  const id = agentId ?? "stub";
  if (id === "yield-scout") {
    return {
      agentId: id as HbarAgentId,
      config: yieldScoutAgentConfig,
      counterparty: getYieldScoutCounterpartyConfig(),
      defaultPrice: YIELD_SCOUT_TASK_PRICE_HBAR,
    };
  }
  if (id === "swap-executor") {
    return {
      agentId: id as HbarAgentId,
      config: swapExecutorAgentConfig,
      counterparty: getSwapExecutorCounterpartyConfig(),
      defaultPrice: SWAP_EXECUTOR_TASK_PRICE_HBAR,
    };
  }
  if (id === "lp-health") {
    return {
      agentId: id as HbarAgentId,
      config: lpHealthAgentConfig,
      counterparty: getLpHealthCounterpartyConfig(),
      defaultPrice: LP_HEALTH_TASK_PRICE_HBAR,
    };
  }
  if (id === "price-feed-verifier") {
    return {
      agentId: id as HbarAgentId,
      config: priceFeedVerifierAgentConfig,
      counterparty: getPriceFeedVerifierCounterpartyConfig(),
      defaultPrice: PRICE_FEED_VERIFIER_TASK_PRICE_HBAR,
    };
  }
  if (id === "custom") {
    return {
      agentId: "custom" as HbarAgentId,
      config: {
        id: "custom" as const,
        name: "Custom Agent",
        taskType: "read" as const,
        defaultBudget: yieldScoutAgentConfig.defaultBudget,
        defaultApproval: yieldScoutAgentConfig.defaultApproval,
      },
      counterparty: getYieldScoutCounterpartyConfig(),
      defaultPrice: CUSTOM_TASK_PRICE_HBAR,
    };
  }
  return {
    agentId: "stub" as HbarAgentId,
    config: stubAgentConfig,
    counterparty: getStubCounterpartyConfig(),
    defaultPrice: STUB_TASK_PRICE_HBAR,
  };
}

function policyStateLabel(sessionId: string): string {
  const latest = getLatestPolicyEvent(sessionId);
  if (!latest) return "within policy";
  switch (latest.decision) {
    case "allowed":
      return "within policy";
    case "blocked_spend_limit":
      return "blocked by SpendLimit";
    case "blocked_counterparty":
      return "counterparty not allowlisted";
    case "blocked_slippage":
      return "blocked: slippage exceeded";
    case "approval_required":
      return "needs your approval";
    case "rejected":
      return "rejected";
    default:
      return "within policy";
  }
}

export async function executeAgentPayment(req: PayRequest): Promise<PayResponse> {
  const { agentId, config, counterparty, defaultPrice } = resolveAgent(
    req.agentId
  );
  const amountHbar = req.amountHbar ?? defaultPrice;
  const taskType = req.taskType ?? config.taskType;

  const { spendPolicy, context } = buildHbarRuntime({
    sessionId: req.sessionId,
    budget: req.budget,
    approval: req.approval,
    counterparty,
    taskType,
    agentId,
  });

  const client = getHbarClient();
  const rawTool = hbarStubPlugin.tools(context)[0];
  const recipientId = counterparty.allowlist[0];

  try {
    await validateCounterpartyBeforePayment(
      req.sessionId,
      HBAR_STUB_PAY_TOOL,
      recipientId,
      amountHbar,
      counterparty
    );

    const result = await rawTool.execute(client, context, {
      amountHbar,
      recipientId,
      taskDescription:
        agentId === "yield-scout"
          ? "yield-scout task purchase"
          : agentId === "swap-executor"
            ? "swap-executor task purchase"
            : agentId === "lp-health"
              ? "lp-health task purchase"
            : agentId === "price-feed-verifier"
              ? "price-feed-verifier task purchase"
              : agentId === "custom"
                ? "custom agent task purchase"
                : "stub task",
    });

    spendPolicy.recordSuccessfulSpend(
      amountHbar,
      HBAR_STUB_PAY_TOOL,
      recipientId
    );

    let txId: string | undefined;
    if (typeof result === "object" && result !== null && "raw" in result) {
      const raw = (result as { raw?: { payment?: { txId?: string } } }).raw;
      txId = raw?.payment?.txId;
    }

    const auditTopic = process.env.HBAR_AUDIT_TOPIC_ID;
    if (auditTopic) {
      await logPolicyDecisionToHcs(auditTopic, {
        sessionId: req.sessionId,
        tool: HBAR_STUB_PAY_TOOL,
        amountHbar,
        decision: "allowed",
        txId,
        agentId,
      });
    }

    const taskResult =
      agentId === "yield-scout"
        ? buildYieldScoutTaskResult(txId ?? "pending")
        : buildStubTaskResult(txId ?? "pending");

    return {
      status: "success",
      result: { ...(result as object), taskResult },
      txId,
      policyState: "within policy",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const policyState = policyStateLabel(req.sessionId);

    if (
      message.includes("ContextualApprovalPolicy") ||
      policyState === "needs your approval"
    ) {
      const approvalId = getLastApprovalId(req.sessionId);
      return {
        status: "pending_approval",
        approvalId: approvalId ?? "",
        recipient: recipientId,
        amountHbar,
        policyState: "needs your approval",
      };
    }

    if (message.includes("SpendLimitPolicy")) {
      return {
        status: "blocked",
        policy: "SpendLimitPolicy",
        reason: message,
        policyState: "blocked by SpendLimit",
      };
    }

    if (message.includes("AllowedCounterpartyPolicy")) {
      return {
        status: "blocked",
        policy: "AllowedCounterpartyPolicy",
        reason: message,
        policyState: "counterparty not allowlisted",
      };
    }

    return {
      status: "blocked",
      policy: "unknown",
      reason: message,
      policyState,
    };
  }
}

/** @deprecated Use executeAgentPayment */
export const executeStubPayment = executeAgentPayment;

export function getDefaultTaskPrice(agentId?: HbarAgentId): number {
  return getAgentConfig(agentId ?? "stub").taskPriceHbar;
}
