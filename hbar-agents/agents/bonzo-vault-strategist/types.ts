export type BonzoVaultRunDecision =
  | "HARVEST"
  | "HOLD"
  | "DEPOSIT"
  | "WITHDRAW"
  | "TRIGGER_EMERGENCY"
  | "SKIPPED"
  | "ERROR";

export interface BonzoVaultRunRequest {
  /** DB uuid or config `strategyId` (strat_bonzo_…). */
  strategyId: string;
}

export interface BonzoVaultRunReport {
  status: "success" | "skipped" | "error";
  strategyId: string;
  dbId?: string;
  decision: BonzoVaultRunDecision;
  adapterMode?: string;
  skipReason?: string;
  txId?: string;
  feeTxId?: string;
  hcsTxId?: string;
  hashScanTopicUrl?: string;
  hashScanTxUrl?: string;
  error?: string;
  completedAt: string;
}
