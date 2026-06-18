export type PolicyDecision =
  | "allowed"
  | "blocked_spend_limit"
  | "blocked_counterparty"
  | "blocked_slippage"
  | "approval_required"
  | "rejected";

export interface BudgetConfig {
  perTaskCapHbar: number;
  dailyBudgetHbar: number;
}

export interface ApprovalConfig {
  autoApproveBelowHbar: number;
  alwaysApproveTaskTypes: string[];
}

export interface RegistryConfig {
  enabled: boolean;
  minReputation: number;
  agentId?: number;
  fallbackToAllowlist: boolean;
}

export interface CounterpartyConfig {
  allowlist: string[];
  minReputation?: number;
  registry?: RegistryConfig;
}

export interface SessionSpendState {
  dailySpentHbar: number;
  dayStartedAt: number;
}

export interface SwapApprovalMetadata {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedAmountOut?: string;
  minAmountOut?: string | null;
  priceImpact?: number | null;
  maxSlippagePct: number;
  route?: string[];
}

export interface PendingApproval {
  id: string;
  sessionId: string;
  tool: string;
  recipient: string;
  amountHbar: number;
  taskType: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
  metadata?: SwapApprovalMetadata;
}

export interface PolicyEvent {
  timestamp: number;
  sessionId: string;
  tool: string;
  amountHbar?: number;
  recipient?: string;
  decision: PolicyDecision;
  reason?: string;
  txId?: string;
}

const spendBySession = new Map<string, SessionSpendState>();
const pendingApprovals = new Map<string, PendingApproval>();
const grantedApprovals = new Set<string>();
const policyEvents = new Map<string, PolicyEvent[]>();

const DAY_MS = 24 * 60 * 60 * 1000;

export function getSessionSpend(sessionId: string): SessionSpendState {
  const existing = spendBySession.get(sessionId);
  const now = Date.now();
  if (!existing || now - existing.dayStartedAt > DAY_MS) {
    const fresh = { dailySpentHbar: 0, dayStartedAt: now };
    spendBySession.set(sessionId, fresh);
    return fresh;
  }
  return existing;
}

export function recordSpend(sessionId: string, amountHbar: number): void {
  const state = getSessionSpend(sessionId);
  state.dailySpentHbar += amountHbar;
  spendBySession.set(sessionId, state);
}

export function createPendingApproval(input: Omit<PendingApproval, "id" | "createdAt" | "status">): PendingApproval {
  const approval: PendingApproval = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: "pending",
  };
  pendingApprovals.set(approval.id, approval);
  return approval;
}

export function getPendingApproval(id: string): PendingApproval | undefined {
  return pendingApprovals.get(id);
}

export function resolveApproval(id: string, approved: boolean): PendingApproval | undefined {
  const approval = pendingApprovals.get(id);
  if (!approval) return undefined;
  approval.status = approved ? "approved" : "rejected";
  pendingApprovals.set(id, approval);
  if (approved) {
    grantedApprovals.add(
      buildApprovalKey({
        sessionId: approval.sessionId,
        tool: approval.tool,
        recipient: approval.recipient,
        amountHbar: approval.amountHbar,
        metadata: approval.metadata,
      })
    );
  }
  return approval;
}

export function isApprovalGranted(
  sessionId: string,
  tool: string,
  recipient: string,
  amountHbar: number,
  metadata?: SwapApprovalMetadata
): boolean {
  return grantedApprovals.has(
    buildApprovalKey({ sessionId, tool, recipient, amountHbar, metadata })
  );
}

export function buildApprovalKey(input: {
  sessionId: string;
  tool: string;
  recipient: string;
  amountHbar: number;
  metadata?: SwapApprovalMetadata;
}): string {
  if (isWriteTool(input.tool) && input.metadata) {
    const m = input.metadata;
    return `${input.sessionId}:${input.tool}:${m.tokenIn}:${m.tokenOut}:${m.amountIn}:${m.maxSlippagePct}`;
  }
  return `${input.sessionId}:${input.tool}:${input.recipient}:${input.amountHbar}`;
}

export function getApprovalKind(tool: string): "payment" | "swap" {
  return isWriteTool(tool) ? "swap" : "payment";
}

export function logPolicyEvent(sessionId: string, event: Omit<PolicyEvent, "timestamp" | "sessionId">): PolicyEvent {
  const full: PolicyEvent = {
    ...event,
    sessionId,
    timestamp: Date.now(),
  };
  const list = policyEvents.get(sessionId) ?? [];
  list.push(full);
  policyEvents.set(sessionId, list);
  return full;
}

export function getPolicyEvents(sessionId: string): PolicyEvent[] {
  return policyEvents.get(sessionId) ?? [];
}

export function getLatestPolicyEvent(sessionId: string): PolicyEvent | undefined {
  const events = getPolicyEvents(sessionId);
  return events[events.length - 1];
}

export const PAYMENT_TOOLS = [
  "hbar_stub_pay",
  "transfer_hbar_tool",
  "transfer_hbar_with_allowance_tool",
] as const;

export const WRITE_TOOLS = ["saucerswap_swap_tokens"] as const;

export type PaymentTool = (typeof PAYMENT_TOOLS)[number];
export type WriteTool = (typeof WRITE_TOOLS)[number];

export function isPaymentTool(method: string): boolean {
  return (PAYMENT_TOOLS as readonly string[]).includes(method);
}

export function isWriteTool(method: string): boolean {
  return (WRITE_TOOLS as readonly string[]).includes(method);
}

export const POLICY_GUARDED_TOOLS = [...PAYMENT_TOOLS, ...WRITE_TOOLS] as const;
