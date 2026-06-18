import { z } from "zod";
import {
  BaseTool,
  handleTransaction,
  type Context,
  type Plugin,
} from "@hashgraph/hedera-agent-kit";
import type { Client } from "@hiero-ledger/sdk";
import { TransferTransaction, Hbar, AccountId } from "@hiero-ledger/sdk";
import { buildStubTaskResult } from "./facilitator";
import { getStubWorkerId } from "../hedera-client";

export const HVAR_STUB_PAY_TOOL = "hvar_stub_pay";

const stubPaySchema = z.object({
  recipientId: z
    .string()
    .optional()
    .describe("Worker agent account ID (defaults to stub worker)"),
  amountHbar: z
    .number()
    .positive()
    .describe("HBAR amount to pay for the stub task"),
  taskDescription: z
    .string()
    .optional()
    .describe("Optional description of the task being purchased"),
});

type StubPayParams = z.infer<typeof stubPaySchema>;
type NormalisedParams = {
  recipientId: string;
  amountHbar: number;
  taskDescription?: string;
};

export class StubPayTool extends BaseTool<StubPayParams, NormalisedParams> {
  method = HVAR_STUB_PAY_TOOL;
  name = "Pay for HVAR stub task";
  description =
    "Pay testnet HBAR to purchase the stub task (x402 pay-per-call). Returns a mock task result after payment.";
  parameters = stubPaySchema;

  private lastParams: NormalisedParams | null = null;

  async normalizeParams(
    params: StubPayParams,
    _context: Context,
    _client: Client
  ): Promise<NormalisedParams> {
    const parsed = stubPaySchema.parse(params);
    this.lastParams = {
      recipientId: parsed.recipientId ?? getStubWorkerId(),
      amountHbar: parsed.amountHbar,
      taskDescription: parsed.taskDescription,
    };
    return this.lastParams;
  }

  async coreAction(
    normalisedParams: NormalisedParams,
    _context: Context,
    client: Client
  ): Promise<TransferTransaction> {
    this.lastParams = normalisedParams;
    const operatorId = client.operatorAccountId!.toString();
    return new TransferTransaction()
      .addHbarTransfer(
        AccountId.fromString(operatorId),
        new Hbar(-normalisedParams.amountHbar)
      )
      .addHbarTransfer(
        AccountId.fromString(normalisedParams.recipientId),
        new Hbar(normalisedParams.amountHbar)
      );
  }

  async secondaryAction(
    transaction: TransferTransaction,
    client: Client,
    context: Context
  ): Promise<{ raw: unknown; humanMessage: string }> {
    const params = this.lastParams!;
    const result = await handleTransaction(
      transaction,
      client,
      context,
      (response) => `Payment submitted: ${response.transactionId}`
    );

    let txId: string | undefined;
    if (typeof result === "object" && result !== null && "raw" in result) {
      const raw = (result as { raw?: { transactionId?: string } }).raw;
      txId = raw?.transactionId;
    }

    const stubResult = buildStubTaskResult(txId ?? "pending");
    return {
      raw: {
        payment: {
          txId,
          recipientId: params.recipientId,
          amountHbar: params.amountHbar,
        },
        stubResult,
      },
      humanMessage: JSON.stringify(stubResult, null, 2),
    };
  }

  async handleError(error: unknown, _context: Context) {
    const message =
      error instanceof Error ? error.message : "Stub payment failed";
    return {
      raw: { error: message },
      humanMessage: message,
    };
  }
}

export const hvarStubPlugin: Plugin = {
  name: "hvar-stub",
  description: "HVAR stub pay-per-call task purchase",
  tools: () => [new StubPayTool()],
};
