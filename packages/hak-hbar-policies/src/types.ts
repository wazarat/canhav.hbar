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

export interface CachedSwapQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  expectedOutput: string;
  minOutput: string | null;
  priceImpact: number | null;
  maxSlippagePct: number;
  quotedAt: number;
}
