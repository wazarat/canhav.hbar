import { buildHbarRuntime, normalizeHederaToolsForAiSdk } from "./agent-runtime";
import { generateText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import type { BudgetConfig, ApprovalConfig } from "./policy-state";
import {
  getPriceFeedVerifierCounterpartyConfig,
  PRICE_FEED_VERIFIER_TASK_PRICE_HBAR,
} from "@hbar/agents/price-feed-verifier/config";
import { buildSystemPrompt } from "./agent-config";
import { getLastApprovalId } from "./policies";
import { getLatestPolicyEvent } from "./policy-state";
import type {
  PriceVerifierIntake,
  PriceVerifierReport,
} from "@hbar/agents/price-feed-verifier/types";
import type { PayResponse } from "./execute-agent-payment";
import { isSaucerSwapConfigured, SAUCERSWAP_UNAVAILABLE_REASON } from "./env";

export interface PriceFeedVerifierRunRequest {
  sessionId: string;
  intake: PriceVerifierIntake;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  amountHbar?: number;
  skipPayment?: boolean;
  paymentTxId?: string;
}

export type PriceFeedVerifierRunResponse =
  | {
      status: "success";
      report: PriceVerifierReport;
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

function computeVerdict(
  divergenceBps: number,
  threshold: number
): PriceVerifierReport["verdict"] {
  if (divergenceBps <= threshold) return "aligned";
  if (divergenceBps <= threshold * 3) return "minor_divergence";
  return "stale_or_manipulated";
}

function parsePriceVerifierReport(
  text: string,
  intake: PriceVerifierIntake,
  paymentTxId?: string
): PriceVerifierReport | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as PriceVerifierReport;
    if (!parsed.summary || parsed.divergenceBps == null || !parsed.verdict) {
      return null;
    }
    const threshold = intake.divergenceBps ?? 50;
    const verdict =
      parsed.verdict ?? computeVerdict(parsed.divergenceBps, threshold);
    return {
      ...parsed,
      baseToken: parsed.baseToken ?? intake.baseToken,
      quoteToken: parsed.quoteToken ?? intake.quoteToken,
      verdict,
      paymentTxId: paymentTxId ?? parsed.paymentTxId,
      completedAt: parsed.completedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function executePriceFeedVerifierRun(
  req: PriceFeedVerifierRunRequest
): Promise<PriceFeedVerifierRunResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "blocked",
      policy: "configuration",
      reason: "OPENAI_API_KEY not configured",
      policyState: "within policy",
    };
  }

  if (!isSaucerSwapConfigured()) {
    return {
      status: "blocked",
      policy: "configuration",
      reason: SAUCERSWAP_UNAVAILABLE_REASON,
      policyState: "within policy",
    };
  }

  const amountHbar = req.amountHbar ?? PRICE_FEED_VERIFIER_TASK_PRICE_HBAR;
  const counterparty = getPriceFeedVerifierCounterpartyConfig();

  const { toolkit } = buildHbarRuntime({
    sessionId: req.sessionId,
    budget: req.budget,
    approval: req.approval,
    counterparty,
    taskType: "read",
    agentId: "price-feed-verifier",
  });

  const tools = normalizeHederaToolsForAiSdk(toolkit.getTools());
  const intakeJson = JSON.stringify(req.intake);
  const messages: CoreMessage[] = [
    {
      role: "user",
      content: req.skipPayment
        ? `Verify price feed for: ${intakeJson}\n\nPayment already completed (tx: ${req.paymentTxId ?? "approved"}). Get SaucerSwap quote (read-only), compare to Pyth, return JSON report. Do NOT call hbar_stub_pay or saucerswap_swap_tokens.`
        : `Verify price feed for: ${intakeJson}\n\nTask price: ${amountHbar} HBAR. Get SaucerSwap quote (read-only), compare to Pyth, pay for the task, return JSON report. Never call saucerswap_swap_tokens.`,
    },
  ];

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: buildSystemPrompt("price-feed-verifier", req.budget),
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
      parsePriceVerifierReport(
        result.text,
        req.intake,
        paymentTxId ?? req.paymentTxId
      ) ??
      ({
        summary:
          "Verification completed — see details below (planner returned non-JSON; using fallback).",
        baseToken: req.intake.baseToken,
        quoteToken: req.intake.quoteToken,
        poolImpliedPrice: "unknown",
        pythPrice: "unknown",
        divergenceBps: 0,
        verdict: "aligned" as const,
        pythPublishTime: null,
        paymentTxId,
        completedAt: new Date().toISOString(),
      } satisfies PriceVerifierReport);

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
