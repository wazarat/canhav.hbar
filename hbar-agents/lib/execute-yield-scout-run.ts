import { buildHbarRuntime } from "./agent-runtime";
import { generateText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import type { BudgetConfig, ApprovalConfig } from "./policy-state";
import {
  getYieldScoutCounterpartyConfig,
  YIELD_SCOUT_TASK_PRICE_HBAR,
} from "@hbar/agents/yield-scout/config";
import { buildSystemPrompt } from "./agent-config";
import { getLastApprovalId } from "./policies";
import { getLatestPolicyEvent } from "./policy-state";
import type { YieldScoutReport } from "@hbar/agents/yield-scout/types";
import type { PayResponse } from "./execute-agent-payment";

export interface YieldScoutRunRequest {
  sessionId: string;
  goal: string;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  amountHbar?: number;
  skipPayment?: boolean;
  paymentTxId?: string;
}

export type YieldScoutRunResponse =
  | {
      status: "success";
      report: YieldScoutReport;
      txId?: string;
      policyState: string;
    }
  | PayResponse;

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

function parseYieldScoutReport(text: string, paymentTxId?: string): YieldScoutReport | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as YieldScoutReport;
    if (!parsed.recommendation || !Array.isArray(parsed.ranked)) return null;
    return {
      ...parsed,
      paymentTxId: paymentTxId ?? parsed.paymentTxId,
      completedAt: parsed.completedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function executeYieldScoutRun(
  req: YieldScoutRunRequest
): Promise<YieldScoutRunResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "blocked",
      policy: "configuration",
      reason: "OPENAI_API_KEY not configured",
      policyState: "within policy",
    };
  }

  const amountHbar = req.amountHbar ?? YIELD_SCOUT_TASK_PRICE_HBAR;
  const counterparty = getYieldScoutCounterpartyConfig();

  const { toolkit } = buildHbarRuntime({
    sessionId: req.sessionId,
    budget: req.budget,
    approval: req.approval,
    counterparty,
    taskType: "read",
    agentId: "yield-scout",
  });

  const tools = toolkit.getTools();
  const messages: CoreMessage[] = [
    {
      role: "user",
      content: req.skipPayment
        ? `Yield goal: ${req.goal}\n\nPayment already completed (tx: ${req.paymentTxId ?? "approved"}). Fetch Bonzo markets, normalize with Pyth, and return the JSON report. Do NOT call hbar_stub_pay.`
        : `Yield goal: ${req.goal}\n\nTask price: ${amountHbar} HBAR. Fetch Bonzo markets, normalize with Pyth, pay for the task, then return the JSON report.`,
    },
  ];

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: buildSystemPrompt("yield-scout", req.budget),
      messages,
      maxSteps: 8,
      temperature: 0.2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
    });

    let paymentTxId: string | undefined;
    for (const step of result.steps ?? []) {
      for (const tr of step.toolResults ?? []) {
        const raw = (tr as { result?: { raw?: { payment?: { txId?: string } } } })
          .result?.raw;
        if (raw?.payment?.txId) {
          paymentTxId = raw.payment.txId;
        }
      }
    }

    const report =
      parseYieldScoutReport(result.text, paymentTxId ?? req.paymentTxId) ??
      ({
        recommendation:
          "Analysis completed — see ranked markets below (planner returned non-JSON; using fallback).",
        ranked: [],
        paymentTxId,
        completedAt: new Date().toISOString(),
      } satisfies YieldScoutReport);

    return {
      status: "success",
      report,
      txId: paymentTxId ?? req.paymentTxId,
      policyState: "within policy",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const policyState = policyStateLabel(req.sessionId);

    if (
      message.includes("ContextualApprovalPolicy") ||
      policyState === "needs your approval"
    ) {
      return {
        status: "pending_approval",
        approvalId: getLastApprovalId(req.sessionId) ?? "",
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
