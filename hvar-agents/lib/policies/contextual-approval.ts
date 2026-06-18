import {
  AbstractPolicy,
  type PostParamsNormalizationParams,
} from "@hashgraph/hedera-agent-kit";
import {
  PAYMENT_TOOLS,
  createPendingApproval,
  isApprovalGranted,
  logPolicyEvent,
  type ApprovalConfig,
} from "../policy-state";

export class ContextualApprovalPolicy extends AbstractPolicy {
  name = "ContextualApprovalPolicy";
  description = "Requires human approval for high-value or write task payments";
  relevantTools = [...PAYMENT_TOOLS];

  constructor(
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
    const amountHbar = extractAmountHbar(params.rawParams);
    const recipient = extractRecipient(params.rawParams) ?? "unknown";

    const needsApproval =
      amountHbar >= this.config.autoApproveBelowHbar ||
      this.config.alwaysApproveTaskTypes.includes(this.taskType);

    if (!needsApproval) return false;

    if (isApprovalGranted(this.sessionId, method, recipient, amountHbar)) {
      return false;
    }

    const approval = createPendingApproval({
      sessionId: this.sessionId,
      tool: method,
      recipient,
      amountHbar,
      taskType: this.taskType,
    });

    const reason = `Needs your approval: ${amountHbar} HBAR to ${recipient}`;
    this.description = reason;
    logPolicyEvent(this.sessionId, {
      tool: method,
      amountHbar,
      recipient,
      decision: "approval_required",
      reason,
    });

    // Store approval id on policy instance for API layer to read
    lastApprovalIdBySession.set(this.sessionId, approval.id);
    return true;
  }
}

const lastApprovalIdBySession = new Map<string, string>();

export function getLastApprovalId(sessionId: string): string | undefined {
  return lastApprovalIdBySession.get(sessionId);
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
