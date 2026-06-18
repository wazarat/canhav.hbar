import type {
  PendingApproval,
  PolicyEvent,
  SessionSpendState,
  SwapApprovalMetadata,
  CachedSwapQuote,
} from "./types";

export interface PolicyStatePort {
  getSessionSpend(sessionId: string): SessionSpendState;
  recordSpend(sessionId: string, amountHbar: number): void;
  createPendingApproval(
    input: Omit<PendingApproval, "id" | "createdAt" | "status">
  ): PendingApproval;
  getPendingApproval(id: string): PendingApproval | undefined;
  resolveApproval(id: string, approved: boolean): PendingApproval | undefined;
  isApprovalGranted(
    sessionId: string,
    tool: string,
    recipient: string,
    amountHbar: number,
    metadata?: SwapApprovalMetadata
  ): boolean;
  getLastApprovalId(sessionId: string): string | undefined;
  setLastApprovalId(sessionId: string, approvalId: string): void;
  logPolicyEvent(
    sessionId: string,
    event: Omit<PolicyEvent, "timestamp" | "sessionId">
  ): PolicyEvent;
  getPolicyEvents(sessionId: string): PolicyEvent[];
  getLatestPolicyEvent(sessionId: string): PolicyEvent | undefined;
  cacheSwapQuote(sessionId: string, quote: CachedSwapQuote): void;
  getCachedSwapQuote(sessionId: string): CachedSwapQuote | undefined;
  clearCachedSwapQuote(sessionId: string): void;
}
