export interface SwapExecutorIntake {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  maxSlippagePct?: number;
}

export interface SwapQuotePreview {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  expectedAmountOut: string;
  minAmountOut: string | null;
  priceImpact: number | null;
  route: string[];
  maxSlippagePct: number;
  quotedAt: string;
  expiresAt: string;
}

export interface SwapExecutionReport {
  summary: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: string;
  expectedAmountOut?: string;
  priceImpact: number | null;
  route: string[];
  maxSlippagePct: number;
  paymentTxId?: string;
  swapTxId?: string;
  completedAt: string;
}
