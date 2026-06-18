import {
  AbstractPolicy,
  type PostParamsNormalizationParams,
} from "@hashgraph/hedera-agent-kit";
import {
  PAYMENT_TOOLS,
  logPolicyEvent,
  type CounterpartyConfig,
} from "../policy-state";

export class AllowedCounterpartyPolicy extends AbstractPolicy {
  name = "AllowedCounterpartyPolicy";
  description = "Blocks payments to non-allowlisted counterparties";
  relevantTools = [...PAYMENT_TOOLS];

  constructor(
    private readonly sessionId: string,
    private readonly config: CounterpartyConfig
  ) {
    super();
  }

  protected shouldBlockPostParamsNormalization(
    params: PostParamsNormalizationParams,
    method: string
  ): boolean {
    const recipient = extractRecipient(params.rawParams);
    if (!recipient) return false;

    // When ERC-8004 registry mode is enabled, async validation runs in
    // validateCounterpartyBeforePayment() before tool execution.
    if (this.config.registry?.enabled) {
      return false;
    }

    const allowed = this.config.allowlist.some(
      (id) => id.toLowerCase() === recipient.toLowerCase()
    );

    if (!allowed) {
      const reason = `Counterparty not allowlisted: ${recipient}`;
      this.description = reason;
      logPolicyEvent(this.sessionId, {
        tool: method,
        recipient,
        amountHbar: extractAmountHbar(params.rawParams),
        decision: "blocked_counterparty",
        reason,
      });
      return true;
    }

    return false;
  }
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

function extractAmountHbar(params: unknown): number | undefined {
  if (!params || typeof params !== "object") return undefined;
  const p = params as Record<string, unknown>;
  if (typeof p.amountHbar === "number") return p.amountHbar;
  return undefined;
}
