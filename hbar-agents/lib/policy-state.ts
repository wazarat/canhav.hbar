import type {
  PolicyStatePort,
  PendingApproval,
  PolicyEvent,
  SessionSpendState,
  CachedSwapQuote,
  SwapApprovalMetadata,
} from "hak-hbar-policies";
import {
  buildApprovalKey,
} from "hak-hbar-policies";

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

const DAY_MS = 24 * 60 * 60 * 1000;

function createInMemoryPolicyStateStore(): PolicyStatePort {
  const spendBySession = new Map<string, SessionSpendState>();
  const pendingApprovals = new Map<string, PendingApproval>();
  const grantedApprovals = new Set<string>();
  const policyEvents = new Map<string, PolicyEvent[]>();
  const lastApprovalIdBySession = new Map<string, string>();
  const quoteBySession = new Map<string, CachedSwapQuote>();

  return {
    getSessionSpend(sessionId: string): SessionSpendState {
      const existing = spendBySession.get(sessionId);
      const now = Date.now();
      if (!existing || now - existing.dayStartedAt > DAY_MS) {
        const fresh = { dailySpentHbar: 0, dayStartedAt: now };
        spendBySession.set(sessionId, fresh);
        return fresh;
      }
      return existing;
    },

    recordSpend(sessionId: string, amountHbar: number): void {
      const state = this.getSessionSpend(sessionId);
      state.dailySpentHbar += amountHbar;
      spendBySession.set(sessionId, state);
    },

    createPendingApproval(
      input: Omit<PendingApproval, "id" | "createdAt" | "status">
    ): PendingApproval {
      const approval: PendingApproval = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        status: "pending",
      };
      pendingApprovals.set(approval.id, approval);
      return approval;
    },

    getPendingApproval(id: string): PendingApproval | undefined {
      return pendingApprovals.get(id);
    },

    resolveApproval(id: string, approved: boolean): PendingApproval | undefined {
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
    },

    isApprovalGranted(
      sessionId: string,
      tool: string,
      recipient: string,
      amountHbar: number,
      metadata?: SwapApprovalMetadata
    ): boolean {
      return grantedApprovals.has(
        buildApprovalKey({ sessionId, tool, recipient, amountHbar, metadata })
      );
    },

    getLastApprovalId(sessionId: string): string | undefined {
      return lastApprovalIdBySession.get(sessionId);
    },

    setLastApprovalId(sessionId: string, approvalId: string): void {
      lastApprovalIdBySession.set(sessionId, approvalId);
    },

    logPolicyEvent(
      sessionId: string,
      event: Omit<PolicyEvent, "timestamp" | "sessionId">
    ): PolicyEvent {
      const full: PolicyEvent = {
        ...event,
        sessionId,
        timestamp: Date.now(),
      };
      const list = policyEvents.get(sessionId) ?? [];
      list.push(full);
      policyEvents.set(sessionId, list);
      return full;
    },

    getPolicyEvents(sessionId: string): PolicyEvent[] {
      return policyEvents.get(sessionId) ?? [];
    },

    getLatestPolicyEvent(sessionId: string): PolicyEvent | undefined {
      const events = this.getPolicyEvents(sessionId);
      return events[events.length - 1];
    },

    cacheSwapQuote(sessionId: string, quote: CachedSwapQuote): void {
      quoteBySession.set(sessionId, quote);
    },

    getCachedSwapQuote(sessionId: string): CachedSwapQuote | undefined {
      return quoteBySession.get(sessionId);
    },

    clearCachedSwapQuote(sessionId: string): void {
      quoteBySession.delete(sessionId);
    },
  };
}

let _store: PolicyStatePort | null = null;

export function getPolicyStateStore(): PolicyStatePort {
  if (!_store) {
    _store = createInMemoryPolicyStateStore();
  }
  return _store;
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
