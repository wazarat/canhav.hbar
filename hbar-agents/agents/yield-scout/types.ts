export interface YieldScoutRankedMarket {
  rank: number;
  protocol: string;
  asset: string;
  rawApy: number;
  riskAdjustedApy: number;
  liquidity: number;
  utilization: number;
  note?: string;
}

export interface YieldScoutReport {
  recommendation: string;
  ranked: YieldScoutRankedMarket[];
  paymentTxId?: string;
  completedAt: string;
}

export type YieldScoutRiskTolerance = "low" | "medium" | "high";

export interface YieldScoutIntake {
  riskTolerance: YieldScoutRiskTolerance;
  assets?: string[];
  minLiquidity?: number;
}
