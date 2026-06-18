import { cacheSwapQuote } from "./policies";
import {
  getLatestPolicyEvent,
  getPendingApproval,
  getApprovalKind,
} from "./policy-state";
import { getLastApprovalId } from "./policies";
import type { SwapExecutorIntake, SwapQuotePreview } from "@hbar/agents/swap-executor/types";
import type { PayResponse } from "./execute-agent-payment";
import { HBAR_STUB_PAY_TOOL } from "./x402/pay";
import {
  SAUCERSWAP_GET_SWAP_QUOTE_TOOL,
  SAUCERSWAP_SWAP_TOKENS_TOOL,
} from "./plugins/saucerswap";

export function policyStateLabel(sessionId: string): string {
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

export function cacheQuoteForSession(
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

export function processSwapToolResults(
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

export function parseQuoteFromText(
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

export function buildFallbackQuote(intake: SwapExecutorIntake): SwapQuotePreview {
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

export type SwapGateErrorResponse = PayResponse & {
  approvalKind?: "payment" | "swap";
  swapMetadata?: SwapQuotePreview;
};

export function handleSwapGateError(
  error: unknown,
  sessionId: string,
  intake: SwapExecutorIntake,
  recipient: string,
  amountHbar: number
): SwapGateErrorResponse {
  const message = error instanceof Error ? error.message : String(error);
  const policyState = policyStateLabel(sessionId);
  const approvalId = getLastApprovalId(sessionId) ?? "";
  const pending = approvalId ? getPendingApproval(approvalId) : undefined;

  const swapMetadata: SwapQuotePreview | undefined = pending?.metadata
    ? {
        tokenIn: pending.metadata.tokenIn,
        tokenOut: pending.metadata.tokenOut,
        amountIn: Number(pending.metadata.amountIn) || intake.amountIn,
        expectedAmountOut: pending.metadata.expectedAmountOut ?? "—",
        minAmountOut: pending.metadata.minAmountOut ?? null,
        priceImpact: pending.metadata.priceImpact ?? null,
        route: pending.metadata.route ?? [],
        maxSlippagePct:
          pending.metadata.maxSlippagePct ?? intake.maxSlippagePct ?? 0.5,
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
      approvalKind: pending ? getApprovalKind(pending.tool) : "payment",
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

export function buildSwapUserMessage(opts: {
  intake: SwapExecutorIntake;
  amountHbar: number;
  quoteOnly?: boolean;
  skipPayment?: boolean;
  paymentTxId?: string;
  swapApproved?: boolean;
  prefix?: string;
}): string {
  const { intake } = opts;
  const slippage = intake.maxSlippagePct ?? 0.5;
  const prefix = opts.prefix ? `${opts.prefix}\n\n` : "";

  if (opts.quoteOnly) {
    return `${prefix}Swap quote only (do NOT pay or execute):
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}

Call saucerswap_get_swap_quote only. Return JSON with quote details.`;
  }

  if (opts.skipPayment && opts.swapApproved) {
    return `${prefix}Execute approved swap:
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}
Payment completed (tx: ${opts.paymentTxId ?? "approved"}). Do NOT call hbar_stub_pay.
Call saucerswap_swap_tokens and return JSON result.`;
  }

  if (opts.skipPayment) {
    return `${prefix}Continue swap after payment:
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}
Payment completed (tx: ${opts.paymentTxId ?? "approved"}). Do NOT call hbar_stub_pay.
Fetch fresh quote if needed, then call saucerswap_swap_tokens. Return JSON result.`;
  }

  return `${prefix}Swap intent:
tokenIn=${intake.tokenIn}, tokenOut=${intake.tokenOut}, amountIn=${intake.amountIn}, maxSlippagePct=${slippage}
Task price: ${opts.amountHbar} HBAR.
Fetch quote, pay for task, then execute swap. Return JSON result.`;
}
