import { buildHbarRuntime } from "./agent-runtime";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { BudgetConfig, ApprovalConfig } from "./policy-state";
import {
  getSwapExecutorCounterpartyConfig,
  SWAP_EXECUTOR_TASK_PRICE_HBAR,
} from "@hbar/agents/swap-executor/config";
import { buildSystemPrompt } from "./agent-config";
import { getLastApprovalId, cacheSwapQuote } from "./policies";
import {
  getLatestPolicyEvent,
  getPendingApproval,
  getApprovalKind,
} from "./policy-state";
import type {
  SwapExecutorIntake,
  SwapExecutionReport,
  SwapQuotePreview,
} from "@hbar/agents/swap-executor/types";
import type { PayResponse } from "./execute-agent-payment";
import { HBAR_STUB_PAY_TOOL } from "./x402/pay";
import {
  SAUCERSWAP_GET_SWAP_QUOTE_TOOL,
  SAUCERSWAP_SWAP_TOKENS_TOOL,
} from "./plugins/saucerswap";

export interface SwapExecutorRunRequest {
  sessionId: string;
  intake: SwapExecutorIntake;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  amountHbar?: number;
  skipPayment?: boolean;
  paymentTxId?: string;
  swapApproved?: boolean;
  quoteOnly?: boolean;
}

export type SwapExecutorRunResponse =
  | {
      status: "success";
      report?: SwapExecutionReport;
      quote?: SwapQuotePreview;
      txId?: string;
      swapTxId?: string;
      policyState: string;
    }
  | (PayResponse & {
      approvalKind?: "payment" | "swap";
      swapMetadata?: SwapQuotePreview;
    });

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

function parseSwapReport(
  text: string,
  paymentTxId?: string,
  swapTxId?: string
): SwapExecutionReport | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as SwapExecutionReport;
    if (!parsed.tokenIn || !parsed.tokenOut) return null;
    return {
      ...parsed,
      paymentTxId: paymentTxId ?? parsed.paymentTxId,
      swapTxId: swapTxId ?? parsed.swapTxId,
      completedAt: parsed.completedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function buildUserMessage(req: SwapExecutorRunRequest): string {
  const { intake } = req;
  const slippage = intake.maxSlippagePct ?? 0.5;
  const amountHbar = req.amountHbar ?? SWAP_EXECUTOR_TASK_PRICE_HBAR;

  if (req.quoteOnly) {
    return `Swap quote only (do NOT pay or execute):
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}

Call saucerswap_get_swap_quote only. Return JSON:
{"tokenIn","tokenOut","amountIn","expectedAmountOut","minAmountOut","priceImpact","route","maxSlippagePct","quotedAt","expiresAt"}`;
  }

  if (req.skipPayment && req.swapApproved) {
    return `Execute approved swap:
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}
Payment completed (tx: ${req.paymentTxId ?? "approved"}). Do NOT call hbar_stub_pay.
Call saucerswap_swap_tokens and return the SwapExecutionReport JSON.`;
  }

  if (req.skipPayment) {
    return `Continue swap after payment:
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}
Payment completed (tx: ${req.paymentTxId ?? "approved"}). Do NOT call hbar_stub_pay.
Fetch fresh quote if needed, then call saucerswap_swap_tokens. Return SwapExecutionReport JSON.`;
  }

  return `Swap intent:
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}
Task price: ${amountHbar} HBAR.
Fetch quote, pay for task, then execute swap. Return SwapExecutionReport JSON.`;
}

function cacheQuoteForSession(
  sessionId: string,
  intake: SwapExecutorIntake,
  preview: SwapQuotePreview
): void {
  cacheSwapQuote(sessionId, {
    tokenIn: intake.tokenIn,
    tokenOut: intake.tokenOut,
    amountIn: String(intake.amountIn),
    expectedOutput: preview.expectedAmountOut,
    minOutput: preview.minAmountOut,
    priceImpact: preview.priceImpact,
    maxSlippagePct: preview.maxSlippagePct,
    quotedAt: Date.now(),
  });
}

function processToolResults(
  steps: Array<{ toolResults?: unknown[] }> | undefined,
  sessionId: string,
  intake: SwapExecutorIntake
): { paymentTxId?: string; swapTxId?: string; quote?: SwapQuotePreview } {
  let paymentTxId: string | undefined;
  let swapTxId: string | undefined;
  let quote: SwapQuotePreview | undefined;

  for (const step of steps ?? []) {
    for (const tr of step.toolResults ?? []) {
      const entry = tr as {
        toolName?: string;
        result?: {
          raw?: {
            payment?: { txId?: string };
            transactionId?: string;
            success?: boolean;
            quote?: {
              expectedOutput?: string;
              priceImpact?: number | null;
              route?: string[];
            };
            minOutput?: string | null;
          };
        };
      };

      if (entry.toolName === SAUCERSWAP_GET_SWAP_QUOTE_TOOL) {
        const raw = entry.result?.raw;
        if (raw?.success && raw.quote) {
          const maxSlippagePct = intake.maxSlippagePct ?? 0.5;
          quote = {
            tokenIn: intake.tokenIn,
            tokenOut: intake.tokenOut,
            amountIn: intake.amountIn,
            expectedAmountOut: raw.quote.expectedOutput ?? "0",
            minAmountOut: raw.minOutput ?? null,
            priceImpact: raw.quote.priceImpact ?? null,
            route: raw.quote.route ?? [],
            maxSlippagePct,
            quotedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
          };
          cacheQuoteForSession(sessionId, intake, quote);
        }
      }

      if (entry.toolName === HBAR_STUB_PAY_TOOL) {
        const tx = entry.result?.raw?.payment?.txId;
        if (tx) paymentTxId = tx;
      }

      if (entry.toolName === SAUCERSWAP_SWAP_TOKENS_TOOL) {
        const tx = entry.result?.raw?.transactionId;
        if (tx) swapTxId = tx;
      }
    }
  }

  return { paymentTxId, swapTxId, quote };
}

function parseQuoteFromText(
  text: string,
  intake: SwapExecutorIntake
): SwapQuotePreview | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<SwapQuotePreview>;
    if (!parsed.expectedAmountOut) return null;
    return {
      tokenIn: intake.tokenIn,
      tokenOut: intake.tokenOut,
      amountIn: intake.amountIn,
      expectedAmountOut: parsed.expectedAmountOut,
      minAmountOut: parsed.minAmountOut ?? null,
      priceImpact: parsed.priceImpact ?? null,
      route: parsed.route ?? [],
      maxSlippagePct: intake.maxSlippagePct ?? 0.5,
      quotedAt: parsed.quotedAt ?? new Date().toISOString(),
      expiresAt:
        parsed.expiresAt ?? new Date(Date.now() + 60_000).toISOString(),
    };
  } catch {
    return null;
  }
}

function buildFallbackQuote(intake: SwapExecutorIntake): SwapQuotePreview {
  return {
    tokenIn: intake.tokenIn,
    tokenOut: intake.tokenOut,
    amountIn: intake.amountIn,
    expectedAmountOut: "—",
    minAmountOut: null,
    priceImpact: null,
    route: [],
    maxSlippagePct: intake.maxSlippagePct ?? 0.5,
    quotedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };
}

function handleSwapRunError(
  error: unknown,
  req: SwapExecutorRunRequest,
  recipient: string,
  amountHbar: number
): SwapExecutorRunResponse {
  const message = error instanceof Error ? error.message : String(error);
  const policyState = policyStateLabel(req.sessionId);
  const approvalId = getLastApprovalId(req.sessionId) ?? "";
  const pending = approvalId ? getPendingApproval(approvalId) : undefined;

  const swapMetadata: SwapQuotePreview | undefined = pending?.metadata
    ? {
        tokenIn: pending.metadata.tokenIn,
        tokenOut: pending.metadata.tokenOut,
        amountIn: Number(pending.metadata.amountIn) || req.intake.amountIn,
        expectedAmountOut: pending.metadata.expectedAmountOut ?? "—",
        minAmountOut: pending.metadata.minAmountOut ?? null,
        priceImpact: pending.metadata.priceImpact ?? null,
        route: pending.metadata.route ?? [],
        maxSlippagePct:
          pending.metadata.maxSlippagePct ?? req.intake.maxSlippagePct ?? 0.5,
        quotedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      }
    : undefined;

  if (
    message.includes("ContextualApprovalPolicy") ||
    policyState === "needs your approval"
  ) {
    return {
      status: "pending_approval",
      approvalId,
      recipient: pending?.recipient ?? recipient,
      amountHbar: pending?.amountHbar ?? amountHbar,
      policyState: "needs your approval",
      approvalKind: pending
        ? getApprovalKind(pending.tool)
        : "payment",
      swapMetadata,
    };
  }

  if (
    message.includes("SlippagePolicy") ||
    policyState === "blocked: slippage exceeded"
  ) {
    return {
      status: "blocked",
      policy: "SlippagePolicy",
      reason: message,
      policyState: "blocked: slippage exceeded",
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

export async function executeSwapExecutorRun(
  req: SwapExecutorRunRequest
): Promise<SwapExecutorRunResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "blocked",
      policy: "configuration",
      reason: "OPENAI_API_KEY not configured",
      policyState: "within policy",
    };
  }

  const amountHbar = req.amountHbar ?? SWAP_EXECUTOR_TASK_PRICE_HBAR;
  const counterparty = getSwapExecutorCounterpartyConfig();

  const { toolkit } = buildHbarRuntime({
    sessionId: req.sessionId,
    budget: req.budget,
    approval: req.approval,
    counterparty,
    taskType: "write",
    agentId: "swap-executor",
  });

  const tools = toolkit.getTools();
  const maxSteps = req.quoteOnly ? 3 : 10;

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: buildSystemPrompt("swap-executor", req.budget),
      messages: [{ role: "user", content: buildUserMessage(req) }],
      maxSteps,
      temperature: 0.2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
    });

    const { paymentTxId, swapTxId, quote } = processToolResults(
      result.steps,
      req.sessionId,
      req.intake
    );

    if (req.quoteOnly) {
      const quotePreview =
        quote ??
        parseQuoteFromText(result.text, req.intake) ??
        buildFallbackQuote(req.intake);
      cacheQuoteForSession(req.sessionId, req.intake, quotePreview);
      return {
        status: "success",
        quote: quotePreview,
        policyState: "within policy",
      };
    }

    const report =
      parseSwapReport(
        result.text,
        paymentTxId ?? req.paymentTxId,
        swapTxId
      ) ??
      ({
        summary: "Swap completed — see transaction details below.",
        tokenIn: req.intake.tokenIn,
        tokenOut: req.intake.tokenOut,
        amountIn: req.intake.amountIn,
        amountOut: quote?.expectedAmountOut ?? "unknown",
        expectedAmountOut: quote?.expectedAmountOut,
        priceImpact: quote?.priceImpact ?? null,
        route: quote?.route ?? [],
        maxSlippagePct: req.intake.maxSlippagePct ?? 0.5,
        paymentTxId: paymentTxId ?? req.paymentTxId,
        swapTxId,
        completedAt: new Date().toISOString(),
      } satisfies SwapExecutionReport);

    return {
      status: "success",
      report,
      txId: paymentTxId ?? req.paymentTxId,
      swapTxId,
      policyState: "within policy",
    };
  } catch (error) {
    return handleSwapRunError(error, req, counterparty.allowlist[0], amountHbar);
  }
}
