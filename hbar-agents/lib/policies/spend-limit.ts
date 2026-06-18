import {
  AbstractPolicy,
  type PostParamsNormalizationParams,
} from "@hashgraph/hedera-agent-kit";
import {
  PAYMENT_TOOLS,
  getSessionSpend,
  logPolicyEvent,
  recordSpend,
  type BudgetConfig,
} from "../policy-state";

export class SpendLimitPolicy extends AbstractPolicy {
  name = "SpendLimitPolicy";
  description = "Blocks payments exceeding per-task cap or daily budget";
  relevantTools = [...PAYMENT_TOOLS];

  constructor(
    private readonly sessionId: string,
    private readonly config: BudgetConfig
  ) {
    super();
  }

  protected shouldBlockPostParamsNormalization(
    params: PostParamsNormalizationParams,
    method: string
  ): boolean {
    const amountHbar = extractAmountHbar(params.rawParams);
    const recipient = extractRecipient(params.rawParams);

    if (amountHbar > this.config.perTaskCapHbar) {
      const reason = `Blocked by SpendLimit: task costs ${amountHbar} HBAR, cap is ${this.config.perTaskCapHbar} HBAR`;
      this.description = reason;
      logPolicyEvent(this.sessionId, {
        tool: method,
        amountHbar,
        recipient,
        decision: "blocked_spend_limit",
        reason,
      });
      return true;
    }

    const spend = getSessionSpend(this.sessionId);
    if (spend.dailySpentHbar + amountHbar > this.config.dailyBudgetHbar) {
      const reason = `Blocked by SpendLimit: daily budget ${this.config.dailyBudgetHbar} HBAR would be exceeded (spent ${spend.dailySpentHbar}, task ${amountHbar})`;
      this.description = reason;
      logPolicyEvent(this.sessionId, {
        tool: method,
        amountHbar,
        recipient,
        decision: "blocked_spend_limit",
        reason,
      });
      return true;
    }

    return false;
  }

  recordSuccessfulSpend(amountHbar: number, tool: string, recipient?: string): void {
    recordSpend(this.sessionId, amountHbar);
    logPolicyEvent(this.sessionId, {
      tool,
      amountHbar,
      recipient,
      decision: "allowed",
    });
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
