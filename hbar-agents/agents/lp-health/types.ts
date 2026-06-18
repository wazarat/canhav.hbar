export interface LpHealthPosition {
  protocol: "Bonzo" | "SaucerSwap";
  asset: string;
  suppliedUsd?: number;
  borrowedUsd?: number;
  lpPair?: [string, string];
}

export interface LpHealthIntake {
  positions: LpHealthPosition[];
  alertThreshold?: number;
}

export interface LpHealthPositionReport {
  asset: string;
  protocol: string;
  healthFactor: number | null;
  utilization: number | null;
  ilExposure: "low" | "medium" | "high" | "n/a";
  flagged: boolean;
  note?: string;
}

export interface LpHealthReport {
  summary: string;
  positions: LpHealthPositionReport[];
  alertThreshold: number;
  paymentTxId?: string;
  completedAt: string;
}
