import {
  AbstractPolicy,
  type PostParamsNormalizationParams,
} from "@hashgraph/hedera-agent-kit";
import type { PolicyStatePort } from "./state-port";
import { PAYMENT_TOOLS, WRITE_TOOLS, isWriteTool } from "./tools";
import type { ApprovalConfig, SwapApprovalMetadata } from "./types";

export class ContextualApprovalPolicy extends AbstractPolicy {
  name = "ContextualApprovalPolicy";
  description = "Requires human approval for high-value payments and all write actions";
  relevantTools = [...PAYMENT_TOOLS, ...WRITE_TOOLS];

  constructor(
    private readonly store: PolicyStatePort,
    private readonly sessionId: string,
    private readonly config: ApprovalConfig,
    private readonly taskType: string = "read"
  ) {
    super();
  }

  protected shouldBlockPostParamsNormalization(
    params: PostParamsNormalizationParams,
    method: string
  ): boolean {
    const isSwap = isWriteTool(method);
    const amountHbar = isSwap ? 0 : extractAmountHbar(params.rawParams);
    const recipient = isSwap
      ? "SaucerSwap router"
      : (extractRecipient(params.rawParams) ?? "unknown");
    const metadata = isSwap ? extractSwapMetadata(params.rawParams) : undefined;

    const needsApproval =
      isSwap ||
      amountHbar >= this.config.autoApproveBelowHbar ||
      this.config.alwaysApproveTaskTypes.includes(this.taskType);

    if (!needsApproval) return false;

    if (
      this.store.isApprovalGranted(
        this.sessionId,
        method,
        recipient,
        amountHbar,
        metadata
      )
    ) {
      return false;
    }

    const approval = this.store.createPendingApproval({
      sessionId: this.sessionId,
      tool: method,
      recipient,
      amountHbar,
      taskType: this.taskType,
      metadata,
    });

    const reason = isSwap
      ? `Needs your approval: swap ${metadata?.amountIn ?? "?"} ${metadata?.tokenIn ?? ""} → ${metadata?.tokenOut ?? ""}`
      : `Needs your approval: ${amountHbar} HBAR to ${recipient}`;

    this.description = reason;
    this.store.logPolicyEvent(this.sessionId, {
      tool: method,
      amountHbar: isSwap ? undefined : amountHbar,
      recipient,
      decision: "approval_required",
      reason,
    });

    this.store.setLastApprovalId(this.sessionId, approval.id);
    return true;
  }
}

function extractAmountHbar(params: unknown): number {
  if (!params || typeof params !== "object") return 0;
  const p = params as Record<string, unknown>;
  if (typeof p.amountHbar === "number") return p.amountHbar;
  if (Array.isArray(p.transfers) && p.transfers[0]) {
    const t = p.transfers[0] as { amount?: number };
    return typeof t.amount === "number" ? t.amount : 0;
  }
  return 0;
}

function extractRecipient(params: unknown): string | undefined {
  if (!params || typeof params !== "object") return undefined;
  const p = params as Record<string, unknown>;
  if (typeof p.recipientId === "string") return p.recipientId;
  if (Array.isArray(p.transfers) && p.transfers[0]) {
    const t = p.transfers[0] as { accountId?: string };
    return t.accountId;
  }
  return undefined;
}

function extractSwapMetadata(params: unknown): SwapApprovalMetadata | undefined {
  if (!params || typeof params !== "object") return undefined;
  const p = params as Record<string, unknown>;
  const fromToken = typeof p.fromToken === "string" ? p.fromToken : undefined;
  const toToken = typeof p.toToken === "string" ? p.toToken : undefined;
  const amount =
    typeof p.amount === "string"
      ? p.amount
      : typeof p.amount === "number"
        ? String(p.amount)
        : undefined;
  if (!fromToken || !toToken || !amount) return undefined;

  const slippage =
    typeof p.slippageTolerance === "number" ? p.slippageTolerance : 0.5;

  return {
    tokenIn: fromToken,
    tokenOut: toToken,
    amountIn: amount,
    maxSlippagePct: slippage,
  };
}
