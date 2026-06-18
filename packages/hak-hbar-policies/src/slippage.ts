import {
  AbstractPolicy,
  type PostParamsNormalizationParams,
} from "@hashgraph/hedera-agent-kit";
import type { PolicyStatePort } from "./state-port";
import { WRITE_TOOLS } from "./tools";
import type { CachedSwapQuote } from "./types";

export type { CachedSwapQuote };

const QUOTE_TTL_MS = 60_000;

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export class SlippagePolicy extends AbstractPolicy {
  name = "SlippagePolicy";
  description = "Blocks swaps when quote is stale or slippage bound would be exceeded";
  relevantTools = [...WRITE_TOOLS];

  constructor(
    private readonly store: PolicyStatePort,
    private readonly sessionId: string
  ) {
    super();
  }

  protected shouldBlockPostParamsNormalization(
    params: PostParamsNormalizationParams,
    method: string
  ): boolean {
    const cached = this.store.getCachedSwapQuote(this.sessionId);
    const swapParams = extractSwapParams(params.rawParams);

    if (!cached) {
      return block(this.store, this.sessionId, this, method, "No fresh swap quote — fetch a quote before executing");
    }

    if (Date.now() - cached.quotedAt > QUOTE_TTL_MS) {
      return block(this.store, this.sessionId, this, method, "Quote is stale — fetch a fresh quote before executing");
    }

    if (
      !swapParams ||
      normalizeToken(swapParams.fromToken) !== normalizeToken(cached.tokenIn) ||
      normalizeToken(swapParams.toToken) !== normalizeToken(cached.tokenOut) ||
      swapParams.amount !== cached.amountIn
    ) {
      return block(this.store, this.sessionId, this, method, "Swap parameters do not match the cached quote");
    }

    const maxSlippage = swapParams.slippageTolerance ?? cached.maxSlippagePct;
    if (cached.priceImpact != null && cached.priceImpact > maxSlippage) {
      return block(
        this.store,
        this.sessionId,
        this,
        method,
        `Price impact ${cached.priceImpact.toFixed(2)}% exceeds max slippage ${maxSlippage}%`
      );
    }

    return false;
  }
}

function block(
  store: PolicyStatePort,
  sessionId: string,
  policy: SlippagePolicy,
  method: string,
  reason: string
): boolean {
  policy.description = reason;
  store.logPolicyEvent(sessionId, {
    tool: method,
    decision: "blocked_slippage",
    reason,
  });
  return true;
}

function extractSwapParams(params: unknown): {
  fromToken: string;
  toToken: string;
  amount: string;
  slippageTolerance?: number;
} | null {
  if (!params || typeof params !== "object") return null;
  const p = params as Record<string, unknown>;
  if (typeof p.fromToken !== "string" || typeof p.toToken !== "string") {
    return null;
  }
  const amount =
    typeof p.amount === "string"
      ? p.amount
      : typeof p.amount === "number"
        ? String(p.amount)
        : null;
  if (!amount) return null;
  return {
    fromToken: p.fromToken,
    toToken: p.toToken,
    amount,
    slippageTolerance:
      typeof p.slippageTolerance === "number"
        ? p.slippageTolerance
        : undefined,
  };
}
