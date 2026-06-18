export type PolicyDecision =
  | "allowed"
  | "blocked_spend_limit"
  | "blocked_counterparty"
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

export interface PendingApproval {
  id: string;
  sessionId: string;
  tool: string;
  recipient: string;
  amountHbar: number;
  taskType: string;
  createdAt: number;
  status: "pending" | "approved" | "rejected";
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
    grantedApprovals.add(approvalKey(approval.sessionId, approval.tool, approval.recipient, approval.amountHbar));
  }
  return approval;
}

export function isApprovalGranted(
  sessionId: string,
  tool: string,
  recipient: string,
  amountHbar: number
): boolean {
  return grantedApprovals.has(approvalKey(sessionId, tool, recipient, amountHbar));
}

function approvalKey(
  sessionId: string,
  tool: string,
  recipient: string,
  amountHbar: number
): string {
  return `${sessionId}:${tool}:${recipient}:${amountHbar}`;
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

export type PaymentTool = (typeof PAYMENT_TOOLS)[number];

export function isPaymentTool(method: string): boolean {
  return (PAYMENT_TOOLS as readonly string[]).includes(method);
}
