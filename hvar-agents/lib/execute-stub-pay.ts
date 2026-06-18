import { buildHvarRuntime } from "./agent-runtime";
import { HVAR_STUB_PAY_TOOL, hvarStubPlugin } from "./x402/pay";
import { getHvarClient } from "./hedera-client";
import { getLastApprovalId } from "./policies";
import { getLatestPolicyEvent } from "./policy-state";
import { logPolicyDecisionToHcs } from "./policies/audit-trail";
import type { BudgetConfig, ApprovalConfig } from "./policy-state";
import { stubAgentConfig, STUB_TASK_PRICE_HBAR, getStubCounterpartyConfig } from "@hvar/agents/stub/config";

export interface PayRequest {
  sessionId: string;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  amountHbar?: number;
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
    case "approval_required":
      return "needs your approval";
    case "rejected":
      return "rejected";
    default:
      return "within policy";
  }
}

export async function executeStubPayment(req: PayRequest): Promise<PayResponse> {
  const amountHbar = req.amountHbar ?? STUB_TASK_PRICE_HBAR;
  const counterparty = getStubCounterpartyConfig();
  const { spendPolicy, context } = buildHvarRuntime({
    sessionId: req.sessionId,
    budget: req.budget,
    approval: req.approval,
    counterparty,
    taskType: stubAgentConfig.taskType,
  });

  const client = getHvarClient();
  const rawTool = hvarStubPlugin.tools(context)[0];

  try {
    const result = await rawTool.execute(client, context, {
      amountHbar,
      recipientId: counterparty.allowlist[0],
    });

    spendPolicy.recordSuccessfulSpend(
      amountHbar,
      HVAR_STUB_PAY_TOOL,
      counterparty.allowlist[0]
    );

    let txId: string | undefined;
    if (typeof result === "object" && result !== null && "raw" in result) {
      const raw = (result as { raw?: { payment?: { txId?: string } } }).raw;
      txId = raw?.payment?.txId;
    }

    const auditTopic = process.env.HVAR_AUDIT_TOPIC_ID;
    if (auditTopic) {
      await logPolicyDecisionToHcs(auditTopic, {
        sessionId: req.sessionId,
        tool: HVAR_STUB_PAY_TOOL,
        amountHbar,
        decision: "allowed",
        txId,
      });
    }

    return {
      status: "success",
      result,
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
        recipient: counterparty.allowlist[0],
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
