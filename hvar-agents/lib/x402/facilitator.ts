import { transferHbar } from "../hedera-client";

/**
 * Facilitates x402-style pay-per-call: operator signs and submits HBAR transfer.
 */
export async function facilitatePayment(
  recipientId: string,
  amountHbar: number
): Promise<{ txId: string; recipientId: string; amountHbar: number }> {
  const txId = await transferHbar(recipientId, amountHbar);
  return { txId, recipientId, amountHbar };
}

export function buildStubTaskResult(paymentTxId: string): {
  task: string;
  result: string;
  paymentTxId: string;
  completedAt: string;
} {
  return {
    task: "stub",
    result:
      "Stub task completed. In M2 this slot returns a Yield Scout APY report.",
    paymentTxId,
    completedAt: new Date().toISOString(),
  };
}
