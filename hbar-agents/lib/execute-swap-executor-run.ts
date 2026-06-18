import { buildHbarRuntime } from "./agent-runtime";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { BudgetConfig, ApprovalConfig } from "./policy-state";
import {
  getSwapExecutorCounterpartyConfig,
  SWAP_EXECUTOR_TASK_PRICE_HBAR,
} from "@hbar/agents/swap-executor/config";
import { buildSystemPrompt } from "./agent-config";
import type {
  SwapExecutorIntake,
  SwapExecutionReport,
  SwapQuotePreview,
} from "@hbar/agents/swap-executor/types";
import type { PayResponse } from "./execute-agent-payment";
import {
  processSwapToolResults,
  parseQuoteFromText,
  buildFallbackQuote,
  handleSwapGateError,
  buildSwapUserMessage,
  cacheQuoteForSession,
} from "./swap-gate";

export interface SwapExecutorRunRequest {
  sessionId: string;
  intake: SwapExecutorIntake;
  budget: BudgetConfig;
  approval: ApprovalConfig;
  amountHbar?: number;
  skipPayment?: boolean;
  paymentTxId?: string;
  swapApproved?: boolean;
  quoteOnly?: boolean;
}

export type SwapExecutorRunResponse =
  | {
      status: "success";
      report?: SwapExecutionReport;
      quote?: SwapQuotePreview;
      txId?: string;
      swapTxId?: string;
      policyState: string;
    }
  | (PayResponse & {
      approvalKind?: "payment" | "swap";
      swapMetadata?: SwapQuotePreview;
    });

function parseSwapReport(
  text: string,
  paymentTxId?: string,
  swapTxId?: string
): SwapExecutionReport | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as SwapExecutionReport;
    if (!parsed.tokenIn || !parsed.tokenOut) return null;
    return {
      ...parsed,
      paymentTxId: paymentTxId ?? parsed.paymentTxId,
      swapTxId: swapTxId ?? parsed.swapTxId,
      completedAt: parsed.completedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function executeSwapExecutorRun(
  req: SwapExecutorRunRequest
): Promise<SwapExecutorRunResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "blocked",
      policy: "configuration",
      reason: "OPENAI_API_KEY not configured",
      policyState: "within policy",
    };
  }

  const amountHbar = req.amountHbar ?? SWAP_EXECUTOR_TASK_PRICE_HBAR;
  const counterparty = getSwapExecutorCounterpartyConfig();

  const { toolkit } = buildHbarRuntime({
    sessionId: req.sessionId,
    budget: req.budget,
    approval: req.approval,
    counterparty,
    taskType: "write",
    agentId: "swap-executor",
  });

  const tools = toolkit.getTools();
  const maxSteps = req.quoteOnly ? 3 : 10;

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: buildSystemPrompt("swap-executor", req.budget),
      messages: [
        {
          role: "user",
          content: buildSwapUserMessage({
            intake: req.intake,
            amountHbar,
            quoteOnly: req.quoteOnly,
            skipPayment: req.skipPayment,
            paymentTxId: req.paymentTxId,
            swapApproved: req.swapApproved,
          }),
        },
      ],
      maxSteps,
      temperature: 0.2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
    });

    const { paymentTxId, swapTxId, quote } = processSwapToolResults(
      result.steps,
      req.sessionId,
      req.intake
    );

    if (req.quoteOnly) {
      const quotePreview =
        quote ??
        parseQuoteFromText(result.text, req.intake) ??
        buildFallbackQuote(req.intake);
      cacheQuoteForSession(req.sessionId, req.intake, quotePreview);
      return {
        status: "success",
        quote: quotePreview,
        policyState: "within policy",
      };
    }

    const report =
      parseSwapReport(
        result.text,
        paymentTxId ?? req.paymentTxId,
        swapTxId
      ) ??
      ({
        summary: "Swap completed — see transaction details below.",
        tokenIn: req.intake.tokenIn,
        tokenOut: req.intake.tokenOut,
        amountIn: req.intake.amountIn,
        amountOut: quote?.expectedAmountOut ?? "unknown",
        expectedAmountOut: quote?.expectedAmountOut,
        priceImpact: quote?.priceImpact ?? null,
        route: quote?.route ?? [],
        maxSlippagePct: req.intake.maxSlippagePct ?? 0.5,
        paymentTxId: paymentTxId ?? req.paymentTxId,
        swapTxId,
        completedAt: new Date().toISOString(),
      } satisfies SwapExecutionReport);

    return {
      status: "success",
      report,
      txId: paymentTxId ?? req.paymentTxId,
      swapTxId,
      policyState: "within policy",
    };
  } catch (error) {
    return handleSwapGateError(
      error,
      req.sessionId,
      req.intake,
      counterparty.allowlist[0],
      amountHbar
    );
  }
}
