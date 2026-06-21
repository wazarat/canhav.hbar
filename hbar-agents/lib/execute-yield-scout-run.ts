import { buildHbarRuntime, normalizeHederaToolsForAiSdk } from "./agent-runtime";
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
import type {
  YieldScoutReport,
  YieldScoutRankedMarket,
} from "@hbar/agents/yield-scout/types";
import type { PayResponse } from "./execute-agent-payment";
import { HBAR_STUB_PAY_TOOL } from "./x402/pay";
import { logPolicyDecisionToHcs } from "./policies/audit-trail";
import {
  BONZO_MARKET_DATA_TOOL,
  fetchBonzoReserves,
  type BonzoReserveSummary,
} from "./plugins/bonzo-readonly";

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
      recipientId?: string;
      amountHbar?: number;
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

function isPolicyFailureReport(report: YieldScoutReport): boolean {
  return /payment policy|policy restriction/i.test(report.recommendation);
}

function extractBonzoReservesFromSteps(
  steps: { toolResults?: unknown[] }[] | undefined
): BonzoReserveSummary[] | null {
  for (const step of steps ?? []) {
    for (const tr of step.toolResults ?? []) {
      const toolName = (tr as { toolName?: string }).toolName;
      if (toolName !== BONZO_MARKET_DATA_TOOL) continue;
      const raw = (tr as { result?: { raw?: { reserves?: BonzoReserveSummary[] } } })
        .result?.raw;
      if (Array.isArray(raw?.reserves) && raw.reserves.length > 0) {
        return raw.reserves;
      }
    }
  }
  return null;
}

function buildRankedFromReserves(
  reserves: BonzoReserveSummary[],
  riskTolerance: "low" | "medium" | "high" = "low"
): YieldScoutRankedMarket[] {
  const minLiquidity = 1000;
  return reserves
    .map((r) => {
      let riskAdjustedApy = r.supplyApy - r.utilization * 0.05;
      if (r.liquidityUsd < minLiquidity) riskAdjustedApy -= 2;
      if (riskTolerance === "low") riskAdjustedApy -= 1;
      else if (riskTolerance === "high") riskAdjustedApy += 0.5;
      return {
        rank: 0,
        protocol: "Bonzo",
        asset: r.symbol,
        rawApy: r.supplyApy,
        riskAdjustedApy,
        liquidity: r.liquidityUsd,
        utilization: r.utilization,
      };
    })
    .sort((a, b) => b.riskAdjustedApy - a.riskAdjustedApy)
    .slice(0, 10)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildServerYieldScoutReport(
  reserves: BonzoReserveSummary[],
  paymentTxId?: string
): YieldScoutReport {
  const ranked = buildRankedFromReserves(reserves, "low");
  const best = ranked[0];
  return {
    recommendation: best
      ? `Best low-risk supply: ${best.asset} on Bonzo at ${best.riskAdjustedApy.toFixed(2)}% risk-adjusted APY (${best.rawApy.toFixed(2)}% raw).`
      : "No active Bonzo supply markets matched the yield goal.",
    ranked,
    paymentTxId,
    completedAt: new Date().toISOString(),
  };
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

  const { toolkit, spendPolicy } = buildHbarRuntime({
    sessionId: req.sessionId,
    budget: req.budget,
    approval: req.approval,
    counterparty,
    taskType: "read",
    agentId: "yield-scout",
  });

  const tools = normalizeHederaToolsForAiSdk(toolkit.getTools());
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
      system: buildSystemPrompt("yield-scout", req.budget, undefined, amountHbar),
      messages,
      maxSteps: 8,
      temperature: 0.2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
    });

    let paymentTxId: string | undefined;
    let paymentRecipientId: string | undefined;
    let paymentAmountHbar: number | undefined;
    for (const step of result.steps ?? []) {
      for (const tr of step.toolResults ?? []) {
        const raw = (
          tr as {
            result?: {
              raw?: {
                payment?: {
                  txId?: string;
                  recipientId?: string;
                  amountHbar?: number;
                };
              };
            };
          }
        ).result?.raw;
        if (raw?.payment?.txId) {
          paymentTxId = raw.payment.txId;
          paymentRecipientId = raw.payment.recipientId;
          paymentAmountHbar = raw.payment.amountHbar;
        }
      }
    }

    const resolvedTxId = paymentTxId ?? req.paymentTxId;
    const resolvedRecipient =
      paymentRecipientId ?? counterparty.allowlist[0];
    const resolvedAmount = paymentAmountHbar ?? amountHbar;

    if (paymentTxId) {
      spendPolicy.recordSuccessfulSpend(
        resolvedAmount,
        HBAR_STUB_PAY_TOOL,
        resolvedRecipient
      );
      const auditTopic = process.env.HBAR_AUDIT_TOPIC_ID;
      if (auditTopic) {
        await logPolicyDecisionToHcs(auditTopic, {
          sessionId: req.sessionId,
          tool: HBAR_STUB_PAY_TOOL,
          amountHbar: resolvedAmount,
          decision: "allowed",
          txId: paymentTxId,
          agentId: "yield-scout",
        });
      }
    }

    const llmReport = parseYieldScoutReport(result.text, resolvedTxId);
    const bonzoFromSteps = extractBonzoReservesFromSteps(result.steps);
    let report: YieldScoutReport;

    if (
      llmReport &&
      llmReport.ranked.length > 0 &&
      !(paymentTxId && isPolicyFailureReport(llmReport))
    ) {
      report = llmReport;
    } else if (bonzoFromSteps?.length) {
      report = buildServerYieldScoutReport(bonzoFromSteps, resolvedTxId);
    } else {
      try {
        const reserves = await fetchBonzoReserves();
        if (reserves.length > 0) {
          report = buildServerYieldScoutReport(reserves, resolvedTxId);
        } else {
          report = {
            recommendation:
              "Analysis completed but no Bonzo markets were available.",
            ranked: [],
            paymentTxId: resolvedTxId,
            completedAt: new Date().toISOString(),
          };
        }
      } catch {
        report = {
          recommendation:
            llmReport && !isPolicyFailureReport(llmReport)
              ? llmReport.recommendation
              : "Analysis completed — market data could not be fetched for ranking.",
          ranked: llmReport?.ranked ?? [],
          paymentTxId: resolvedTxId,
          completedAt: new Date().toISOString(),
        };
      }
    }

    return {
      status: "success",
      report,
      txId: resolvedTxId,
      recipientId: resolvedRecipient,
      amountHbar: resolvedAmount,
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
