import type { StrategyConfig } from "../strategy-config.schema";

export type ActionKind =
  | "DEPOSIT"
  | "WITHDRAW"
  | "HARVEST"
  | "REBALANCE"
  | "EMERGENCY"
  | "HOLD";

export interface ProposedAction {
  kind: ActionKind;
  target: string;
  amount: bigint;
}

export interface PolicyResult {
  allowed: boolean;
  clampedAmount?: bigint;
  reason: string;
  triggerEmergency?: boolean;
}

export interface PolicyContext {
  deployedAmount: bigint;
  oraclePrice18?: bigint;
  netAPY?: number;
  vix?: number;
  newsNegative?: boolean;
}

export type { StrategyConfig };
