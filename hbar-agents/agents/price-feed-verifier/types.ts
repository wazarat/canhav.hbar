export interface PriceVerifierIntake {
  baseToken: string;
  quoteToken: string;
  referenceAmount?: number;
  divergenceBps?: number;
}

export interface PriceVerifierReport {
  summary: string;
  baseToken: string;
  quoteToken: string;
  poolImpliedPrice: string;
  pythPrice: string;
  divergenceBps: number;
  verdict: "aligned" | "minor_divergence" | "stale_or_manipulated";
  pythPublishTime: string | null;
  paymentTxId?: string;
  completedAt: string;
}
