import type {
  PolicyStatePort,
  PendingApproval,
  PolicyEvent,
  SessionSpendState,
  CachedSwapQuote,
  SwapApprovalMetadata,
} from "hak-hbar-policies";
import { buildApprovalKey } from "hak-hbar-policies";

export type {
  PolicyDecision,
  BudgetConfig,
  ApprovalConfig,
  RegistryConfig,
  CounterpartyConfig,
  SessionSpendState,
  SwapApprovalMetadata,
  PendingApproval,
  PolicyEvent,
  CachedSwapQuote,
} from "hak-hbar-policies";

export {
  PAYMENT_TOOLS,
  WRITE_TOOLS,
  POLICY_GUARDED_TOOLS,
  isPaymentTool,
  isWriteTool,
  getApprovalKind,
  buildApprovalKey,
} from "hak-hbar-policies";

export type { PolicyStatePort } from "hak-hbar-policies";

export interface PolicySessionSnapshot {
  spend?: SessionSpendState;
  pendingApprovals: PendingApproval[];
  grantedKeys: string[];
  events: PolicyEvent[];
  lastApprovalId?: string;
  swapQuote?: CachedSwapQuote;
}

const DAY_MS = 24 * 60 * 60 * 1000;

class InMemoryPolicyStateStore implements PolicyStatePort {
  private spendBySession = new Map<string, SessionSpendState>();
  private pendingApprovals = new Map<string, PendingApproval>();
  private grantedApprovals = new Set<string>();
  private policyEvents = new Map<string, PolicyEvent[]>();
  private lastApprovalIdBySession = new Map<string, string>();
  private quoteBySession = new Map<string, CachedSwapQuote>();

  getSessionSpend(sessionId: string): SessionSpendState {
    const existing = this.spendBySession.get(sessionId);
    const now = Date.now();
    if (!existing || now - existing.dayStartedAt > DAY_MS) {
      const fresh = { dailySpentHbar: 0, dayStartedAt: now };
      this.spendBySession.set(sessionId, fresh);
      return fresh;
    }
    return existing;
  }

  recordSpend(sessionId: string, amountHbar: number): void {
    const state = this.getSessionSpend(sessionId);
    state.dailySpentHbar += amountHbar;
    this.spendBySession.set(sessionId, state);
  }

  createPendingApproval(
    input: Omit<PendingApproval, "id" | "createdAt" | "status">
  ): PendingApproval {
    const approval: PendingApproval = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      status: "pending",
    };
    this.pendingApprovals.set(approval.id, approval);
    return approval;
  }

  getPendingApproval(id: string): PendingApproval | undefined {
    return this.pendingApprovals.get(id);
  }

  resolveApproval(id: string, approved: boolean): PendingApproval | undefined {
    const approval = this.pendingApprovals.get(id);
    if (!approval) return undefined;
    approval.status = approved ? "approved" : "rejected";
    this.pendingApprovals.set(id, approval);
    if (approved) {
      this.grantedApprovals.add(
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

  isApprovalGranted(
    sessionId: string,
    tool: string,
    recipient: string,
    amountHbar: number,
    metadata?: SwapApprovalMetadata
  ): boolean {
    return this.grantedApprovals.has(
      buildApprovalKey({ sessionId, tool, recipient, amountHbar, metadata })
    );
  }

  getLastApprovalId(sessionId: string): string | undefined {
    return this.lastApprovalIdBySession.get(sessionId);
  }

  setLastApprovalId(sessionId: string, approvalId: string): void {
    this.lastApprovalIdBySession.set(sessionId, approvalId);
  }

  logPolicyEvent(
    sessionId: string,
    event: Omit<PolicyEvent, "timestamp" | "sessionId">
  ): PolicyEvent {
    const full: PolicyEvent = {
      ...event,
      sessionId,
      timestamp: Date.now(),
    };
    const list = this.policyEvents.get(sessionId) ?? [];
    list.push(full);
    this.policyEvents.set(sessionId, list);
    return full;
  }

  getPolicyEvents(sessionId: string): PolicyEvent[] {
    return this.policyEvents.get(sessionId) ?? [];
  }

  getLatestPolicyEvent(sessionId: string): PolicyEvent | undefined {
    const events = this.getPolicyEvents(sessionId);
    return events[events.length - 1];
  }

  cacheSwapQuote(sessionId: string, quote: CachedSwapQuote): void {
    this.quoteBySession.set(sessionId, quote);
  }

  getCachedSwapQuote(sessionId: string): CachedSwapQuote | undefined {
    return this.quoteBySession.get(sessionId);
  }

  clearCachedSwapQuote(sessionId: string): void {
    this.quoteBySession.delete(sessionId);
  }

  exportSession(sessionId: string): PolicySessionSnapshot {
    return {
      spend: this.spendBySession.get(sessionId),
      pendingApprovals: Array.from(this.pendingApprovals.values()).filter(
        (a) => a.sessionId === sessionId
      ),
      grantedKeys: Array.from(this.grantedApprovals).filter((key) =>
        key.startsWith(`${sessionId}:`)
      ),
      events: this.policyEvents.get(sessionId) ?? [],
      lastApprovalId: this.lastApprovalIdBySession.get(sessionId),
      swapQuote: this.quoteBySession.get(sessionId),
    };
  }

  importSession(sessionId: string, snapshot: PolicySessionSnapshot): void {
    if (snapshot.spend) {
      this.spendBySession.set(sessionId, snapshot.spend);
    }

    for (const approval of snapshot.pendingApprovals) {
      this.pendingApprovals.set(approval.id, approval);
    }

    for (const key of snapshot.grantedKeys) {
      this.grantedApprovals.add(key);
    }

    if (snapshot.events.length > 0) {
      this.policyEvents.set(sessionId, snapshot.events);
    }

    if (snapshot.lastApprovalId) {
      this.lastApprovalIdBySession.set(sessionId, snapshot.lastApprovalId);
    }

    if (snapshot.swapQuote) {
      this.quoteBySession.set(sessionId, snapshot.swapQuote);
    }
  }
}

let _store: InMemoryPolicyStateStore | null = null;

function getInternalStore(): InMemoryPolicyStateStore {
  if (!_store) {
    _store = new InMemoryPolicyStateStore();
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      console.warn(
        "[policy-state] DATABASE_URL not set — using in-memory policy store; approval flow may break on serverless"
      );
    }
  }
  return _store;
}

export function getPolicyStateStore(): PolicyStatePort {
  return getInternalStore();
}

export function exportPolicySession(sessionId: string): PolicySessionSnapshot {
  return getInternalStore().exportSession(sessionId);
}

export function importPolicySession(
  sessionId: string,
  snapshot: PolicySessionSnapshot
): void {
  getInternalStore().importSession(sessionId, snapshot);
}

export function getSessionSpend(sessionId: string): SessionSpendState {
  return getPolicyStateStore().getSessionSpend(sessionId);
}

export function recordSpend(sessionId: string, amountHbar: number): void {
  getPolicyStateStore().recordSpend(sessionId, amountHbar);
}

export function createPendingApproval(
  input: Omit<PendingApproval, "id" | "createdAt" | "status">
): PendingApproval {
  return getPolicyStateStore().createPendingApproval(input);
}

export function getPendingApproval(id: string): PendingApproval | undefined {
  return getPolicyStateStore().getPendingApproval(id);
}

export function resolveApproval(
  id: string,
  approved: boolean
): PendingApproval | undefined {
  return getPolicyStateStore().resolveApproval(id, approved);
}

export function isApprovalGranted(
  sessionId: string,
  tool: string,
  recipient: string,
  amountHbar: number,
  metadata?: SwapApprovalMetadata
): boolean {
  return getPolicyStateStore().isApprovalGranted(
    sessionId,
    tool,
    recipient,
    amountHbar,
    metadata
  );
}

export function getLastApprovalId(sessionId: string): string | undefined {
  return getPolicyStateStore().getLastApprovalId(sessionId);
}

export function logPolicyEvent(
  sessionId: string,
  event: Omit<PolicyEvent, "timestamp" | "sessionId">
): PolicyEvent {
  return getPolicyStateStore().logPolicyEvent(sessionId, event);
}

export function getPolicyEvents(sessionId: string): PolicyEvent[] {
  return getPolicyStateStore().getPolicyEvents(sessionId);
}

export function getLatestPolicyEvent(sessionId: string): PolicyEvent | undefined {
  return getPolicyStateStore().getLatestPolicyEvent(sessionId);
}

export function cacheSwapQuote(sessionId: string, quote: CachedSwapQuote): void {
  getPolicyStateStore().cacheSwapQuote(sessionId, quote);
}

export function getCachedSwapQuote(
  sessionId: string
): CachedSwapQuote | undefined {
  return getPolicyStateStore().getCachedSwapQuote(sessionId);
}

export function clearCachedSwapQuote(sessionId: string): void {
  getPolicyStateStore().clearCachedSwapQuote(sessionId);
}
