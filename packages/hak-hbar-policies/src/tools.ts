import type { SwapApprovalMetadata } from "./types";

export const PAYMENT_TOOLS = [
  "hbar_stub_pay",
  "transfer_hbar_tool",
  "transfer_hbar_with_allowance_tool",
] as const;

export const WRITE_TOOLS = ["saucerswap_swap_tokens"] as const;

export type PaymentTool = (typeof PAYMENT_TOOLS)[number];
export type WriteTool = (typeof WRITE_TOOLS)[number];

export const POLICY_GUARDED_TOOLS = [...PAYMENT_TOOLS, ...WRITE_TOOLS] as const;

export function isPaymentTool(method: string): boolean {
  return (PAYMENT_TOOLS as readonly string[]).includes(method);
}

export function isWriteTool(method: string): boolean {
  return (WRITE_TOOLS as readonly string[]).includes(method);
}

export function getApprovalKind(tool: string): "payment" | "swap" {
  return isWriteTool(tool) ? "swap" : "payment";
}

export function buildApprovalKey(input: {
  sessionId: string;
  tool: string;
  recipient: string;
  amountHbar: number;
  metadata?: SwapApprovalMetadata;
}): string {
  if (isWriteTool(input.tool) && input.metadata) {
    const m = input.metadata;
    return `${input.sessionId}:${input.tool}:${m.tokenIn}:${m.tokenOut}:${m.amountIn}:${m.maxSlippagePct}`;
  }
  return `${input.sessionId}:${input.tool}:${input.recipient}:${input.amountHbar}`;
}
