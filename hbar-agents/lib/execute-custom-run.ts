import { buildHbarRuntime } from "./agent-runtime";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { BudgetConfig, ApprovalConfig, CounterpartyConfig } from "./policy-state";
import { buildSystemPrompt } from "./agent-config";
import { getLastApprovalId } from "./policies";
import { getLatestPolicyEvent } from "./policy-state";
import type { PayResponse } from "./execute-agent-payment";
import {
  clampCustomAgentSpec,
  pluginsForDataSources,
  CUSTOM_TASK_PRICE_HBAR,
  type CustomAgentSpec,
} from "./custom-agent";
import { getYieldScoutCounterpartyConfig } from "@hbar/agents/yield-scout/config";
import type { SwapExecutorIntake, SwapQuotePreview } from "@hbar/agents/swap-executor/types";
import { applySaucerSwapContextConfig } from "./plugins/saucerswap";
import {
  processSwapToolResults,
  parseQuoteFromText,
  buildFallbackQuote,
  handleSwapGateError,
  buildSwapUserMessage,
} from "./swap-gate";
import { HBAR_STUB_PAY_TOOL } from "./x402/pay";

export interface CustomAgentRunRequest {
  sessionId: string;
  spec: CustomAgentSpec;
  userMessage: string;
  budget?: BudgetConfig;
  approval?: ApprovalConfig;
  amountHbar?: number;
  skipPayment?: boolean;
  paymentTxId?: string;
  swapApproved?: boolean;
  quoteOnly?: boolean;
  previewOnly?: boolean;
  swapIntake?: SwapExecutorIntake;
}

export interface CustomAgentResult {
  summary: string;
  completedAt: string;
  paymentTxId?: string;
  swapTxId?: string;
  [key: string]: unknown;
}

export type CustomAgentRunResponse =
  | {
      status: "success";
      result: CustomAgentResult;
      quote?: SwapQuotePreview;
      txId?: string;
      swapTxId?: string;
      policyState: string;
    }
  | (PayResponse & {
      approvalKind?: "payment" | "swap";
      swapMetadata?: SwapQuotePreview;
    });

function readPolicyStateLabel(sessionId: string): string {
  const latest = getLatestPolicyEvent(sessionId);
  if (!latest) return "within policy";
  switch (latest.decision) {
    case "allowed":
      return "within policy";
    case "blocked_spend_limit":
      return "blocked by SpendLimit";
    case "blocked_counterparty":
      return "counterparty not allowlisted";
    case "approval_required":
      return "needs your approval";
    case "rejected":
      return "rejected";
    default:
      return "within policy";
  }
}

function parseCustomResult(
  text: string,
  paymentTxId?: string,
  swapTxId?: string
): CustomAgentResult | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as CustomAgentResult;
    if (!parsed.summary) return null;
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

function getCustomCounterparty(): CounterpartyConfig {
  return getYieldScoutCounterpartyConfig();
}

function buildCustomRuntime(req: CustomAgentRunRequest, spec: CustomAgentSpec) {
  const budget = req.budget ?? spec.budget;
  const approval = req.approval ?? spec.approval;
  const counterparty = getCustomCounterparty();
  const plugins = pluginsForDataSources(
    spec.dataSources,
    spec.taskType === "write"
  );

  const runtime = buildHbarRuntime({
    sessionId: req.sessionId,
    budget,
    approval,
    counterparty,
    taskType: spec.taskType,
    agentId: "custom",
    pluginsOverride: plugins,
  });

  if (spec.dataSources.includes("saucerswap-quote")) {
    applySaucerSwapContextConfig(runtime.context);
  }

  return { ...runtime, budget, approval, counterparty };
}

function buildReadUserMessage(req: CustomAgentRunRequest, amountHbar: number): string {
  if (req.previewOnly || req.quoteOnly) {
    return `${req.userMessage}\n\nDRY RUN — do NOT call hbar_stub_pay. Use read tools only and return JSON preview result.`;
  }
  if (req.skipPayment) {
    return `${req.userMessage}\n\nPayment already completed (tx: ${req.paymentTxId ?? "approved"}). Complete the objective and return JSON. Do NOT call hbar_stub_pay.`;
  }
  return `${req.userMessage}\n\nTask price: ${amountHbar} HBAR. Complete the objective, pay for the task, return JSON.`;
}

function handleReadRunError(
  error: unknown,
  sessionId: string,
  recipient: string,
  amountHbar: number
): CustomAgentRunResponse {
  const message = error instanceof Error ? error.message : String(error);
  const policyState = readPolicyStateLabel(sessionId);

  if (
    message.includes("ContextualApprovalPolicy") ||
    policyState === "needs your approval"
  ) {
    return {
      status: "pending_approval",
      approvalId: getLastApprovalId(sessionId) ?? "",
      recipient,
      amountHbar,
      policyState: "needs your approval",
    };
  }

  if (message.includes("SpendLimitPolicy")) {
    return {
      status: "blocked",
      policy: "SpendLimitPolicy",
      reason: message,
      policyState: "blocked by SpendLimit",
    };
  }

  if (message.includes("AllowedCounterpartyPolicy")) {
    return {
      status: "blocked",
      policy: "AllowedCounterpartyPolicy",
      reason: message,
      policyState: "counterparty not allowlisted",
    };
  }

  return {
    status: "blocked",
    policy: "unknown",
    reason: message,
    policyState,
  };
}

export async function executeCustomRun(
  req: CustomAgentRunRequest
): Promise<CustomAgentRunResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "blocked",
      policy: "configuration",
      reason: "OPENAI_API_KEY not configured",
      policyState: "within policy",
    };
  }

  let spec: CustomAgentSpec;
  try {
    spec = clampCustomAgentSpec(req.spec);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "blocked",
      policy: "validation",
      reason: message,
      policyState: "within policy",
    };
  }

  const amountHbar = req.amountHbar ?? CUSTOM_TASK_PRICE_HBAR;
  const { toolkit, budget, counterparty } = buildCustomRuntime(req, spec);
  const tools = toolkit.getTools();

  if (spec.taskType === "write" && req.swapIntake) {
    const intake: SwapExecutorIntake = {
      ...req.swapIntake,
      maxSlippagePct: req.swapIntake.maxSlippagePct ?? spec.maxSlippagePct ?? 0.5,
    };
    const maxSteps = req.quoteOnly || req.previewOnly ? 3 : 10;

    try {
      const result = await generateText({
        model: openai("gpt-4o"),
        system: buildSystemPrompt("custom", budget, spec),
        messages: [
          {
            role: "user",
            content: buildSwapUserMessage({
              intake,
              amountHbar,
              quoteOnly: req.quoteOnly || req.previewOnly,
              skipPayment: req.skipPayment,
              paymentTxId: req.paymentTxId,
              swapApproved: req.swapApproved,
              prefix: req.userMessage,
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
        intake
      );

      if (req.quoteOnly || req.previewOnly) {
        const quotePreview =
          quote ??
          parseQuoteFromText(result.text, intake) ??
          buildFallbackQuote(intake);
        return {
          status: "success",
          result: {
            summary: "Dry-run quote preview",
            completedAt: new Date().toISOString(),
          },
          quote: quotePreview,
          policyState: "within policy",
        };
      }

      const parsed =
        parseCustomResult(result.text, paymentTxId ?? req.paymentTxId, swapTxId) ??
        ({
          summary: "Custom write agent completed",
          completedAt: new Date().toISOString(),
          paymentTxId: paymentTxId ?? req.paymentTxId,
          swapTxId,
        } satisfies CustomAgentResult);

      return {
        status: "success",
        result: parsed,
        quote,
        txId: paymentTxId ?? req.paymentTxId,
        swapTxId,
        policyState: "within policy",
      };
    } catch (error) {
      return handleSwapGateError(
        error,
        req.sessionId,
        intake,
        counterparty.allowlist[0],
        amountHbar
      );
    }
  }

  const maxSteps = req.previewOnly ? 4 : 8;

  try {
    const result = await generateText({
      model: openai("gpt-4o"),
      system: buildSystemPrompt("custom", budget, spec),
      messages: [{ role: "user", content: buildReadUserMessage(req, amountHbar) }],
      maxSteps,
      temperature: 0.2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: tools as any,
    });

    let paymentTxId: string | undefined;
    for (const step of result.steps ?? []) {
      for (const tr of step.toolResults ?? []) {
        const entry = tr as {
          toolName?: string;
          result?: { raw?: { payment?: { txId?: string } } };
        };
        if (entry.toolName === HBAR_STUB_PAY_TOOL) {
          const tx = entry.result?.raw?.payment?.txId;
          if (tx) paymentTxId = tx;
        }
      }
    }

    const parsed =
      parseCustomResult(result.text, paymentTxId ?? req.paymentTxId) ??
      ({
        summary: req.previewOnly
          ? "Dry-run preview completed"
          : "Custom agent task completed",
        completedAt: new Date().toISOString(),
        paymentTxId: req.previewOnly ? undefined : paymentTxId ?? req.paymentTxId,
      } satisfies CustomAgentResult);

    return {
      status: "success",
      result: parsed,
      txId: req.previewOnly ? undefined : paymentTxId ?? req.paymentTxId,
      policyState: "within policy",
    };
  } catch (error) {
    return handleReadRunError(
      error,
      req.sessionId,
      counterparty.allowlist[0],
      amountHbar
    );
  }
}
