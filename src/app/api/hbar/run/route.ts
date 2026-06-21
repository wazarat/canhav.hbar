import { NextRequest, NextResponse } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildHbarRuntime, buildSystemPrompt, normalizeHederaToolsForAiSdk } from "@hbar/lib/agent-runtime";
import { stubAgentConfig, getStubCounterpartyConfig } from "@hbar/agents/stub/config";
import {
  yieldScoutAgentConfig,
} from "@hbar/agents/yield-scout/config";
import { swapExecutorAgentConfig } from "@hbar/agents/swap-executor/config";
import { lpHealthAgentConfig } from "@hbar/agents/lp-health/config";
import { priceFeedVerifierAgentConfig } from "@hbar/agents/price-feed-verifier/config";
import { executeYieldScoutRun } from "@hbar/lib/execute-yield-scout-run";
import { executeSwapExecutorRun } from "@hbar/lib/execute-swap-executor-run";
import { executeLpHealthRun } from "@hbar/lib/execute-lp-health-run";
import { executePriceFeedVerifierRun } from "@hbar/lib/execute-price-feed-verifier-run";
import { executeCustomRun } from "@hbar/lib/execute-custom-run";
import type { BudgetConfig, ApprovalConfig } from "@hbar/lib/policy-state";
import type { HbarAgentId } from "@hbar/lib/agent-config";
import type { SwapExecutorIntake } from "@hbar/agents/swap-executor/types";
import type { LpHealthIntake } from "@hbar/agents/lp-health/types";
import type { PriceVerifierIntake } from "@hbar/agents/price-feed-verifier/types";
import type { CustomAgentSpec } from "@hbar/lib/custom-agent";
import { withPolicySession } from "@hbar/lib/policy-session-sync";
import { isSaucerSwapConfigured, SAUCERSWAP_UNAVAILABLE_REASON } from "@hbar/lib/env";

export const maxDuration = 60;

function hashScanTopicUrl() {
  const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
  return auditTopicId
    ? `https://hashscan.io/testnet/topic/${auditTopicId}`
    : undefined;
}

export async function POST(req: NextRequest) {
  try {
  const body = await req.json();
  const sessionId =
    (body.sessionId as string | undefined) ??
    req.headers.get("x-session-id") ??
    "anonymous";

  return await withPolicySession(sessionId, async () => {
  const {
    messages,
    goal,
    budget,
    approval,
    amountHbar,
    agentId = "stub",
    stream = true,
    skipPayment,
    paymentTxId,
    intake,
    quoteOnly,
    swapApproved,
    previewOnly,
    spec,
    userMessage,
    swapIntake,
  } = body as {
    messages?: CoreMessage[];
    goal?: string;
    budget?: BudgetConfig;
    approval?: ApprovalConfig;
    amountHbar?: number;
    agentId?: HbarAgentId;
    stream?: boolean;
    skipPayment?: boolean;
    paymentTxId?: string;
    intake?: SwapExecutorIntake | LpHealthIntake | PriceVerifierIntake;
    quoteOnly?: boolean;
    swapApproved?: boolean;
    previewOnly?: boolean;
    spec?: CustomAgentSpec;
    userMessage?: string;
    swapIntake?: SwapExecutorIntake;
  };

  if (agentId === "yield-scout") {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const ysDefaults = yieldScoutAgentConfig;
    const result = await executeYieldScoutRun({
      sessionId,
      goal: goal ?? (typeof messages?.[0]?.content === "string" ? messages[0].content : ""),
      budget: budget ?? ysDefaults.defaultBudget,
      approval: approval ?? ysDefaults.defaultApproval,
      amountHbar,
      skipPayment,
      paymentTxId,
    });

    const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
    const hashScanTopicUrl = auditTopicId
      ? `https://hashscan.io/testnet/topic/${auditTopicId}`
      : undefined;

    return NextResponse.json({ ...result, hashScanTopicUrl });
  }

  if (agentId === "swap-executor") {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!isSaucerSwapConfigured()) {
      return NextResponse.json({
        status: "blocked",
        policy: "configuration",
        reason: SAUCERSWAP_UNAVAILABLE_REASON,
        policyState: "within policy",
      });
    }

    if (!intake || !("tokenIn" in intake) || !intake.tokenIn || !intake.tokenOut || !intake.amountIn) {
      return NextResponse.json(
        { error: "intake with tokenIn, tokenOut, amountIn required" },
        { status: 400 }
      );
    }

    const seDefaults = swapExecutorAgentConfig;
    const result = await executeSwapExecutorRun({
      sessionId,
      intake: intake as SwapExecutorIntake,
      budget: budget ?? seDefaults.defaultBudget,
      approval: approval ?? seDefaults.defaultApproval,
      amountHbar,
      skipPayment,
      paymentTxId,
      swapApproved,
      quoteOnly,
    });

    const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
    const hashScanTopicUrl = auditTopicId
      ? `https://hashscan.io/testnet/topic/${auditTopicId}`
      : undefined;

    return NextResponse.json({ ...result, hashScanTopicUrl });
  }

  if (agentId === "lp-health") {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const lhIntake = intake as LpHealthIntake | undefined;
    if (!lhIntake?.positions?.length) {
      return NextResponse.json(
        { error: "intake with positions array required" },
        { status: 400 }
      );
    }

    const lhDefaults = lpHealthAgentConfig;
    const result = await executeLpHealthRun({
      sessionId,
      intake: lhIntake,
      budget: budget ?? lhDefaults.defaultBudget,
      approval: approval ?? lhDefaults.defaultApproval,
      amountHbar,
      skipPayment,
      paymentTxId,
    });

    return NextResponse.json({ ...result, hashScanTopicUrl: hashScanTopicUrl() });
  }

  if (agentId === "price-feed-verifier") {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!isSaucerSwapConfigured()) {
      return NextResponse.json({
        status: "blocked",
        policy: "configuration",
        reason: SAUCERSWAP_UNAVAILABLE_REASON,
        policyState: "within policy",
      });
    }

    const pvIntake = intake as PriceVerifierIntake | undefined;
    if (!pvIntake?.baseToken || !pvIntake?.quoteToken) {
      return NextResponse.json(
        { error: "intake with baseToken and quoteToken required" },
        { status: 400 }
      );
    }

    const pvDefaults = priceFeedVerifierAgentConfig;
    const result = await executePriceFeedVerifierRun({
      sessionId,
      intake: pvIntake,
      budget: budget ?? pvDefaults.defaultBudget,
      approval: approval ?? pvDefaults.defaultApproval,
      amountHbar,
      skipPayment,
      paymentTxId,
    });

    return NextResponse.json({ ...result, hashScanTopicUrl: hashScanTopicUrl() });
  }

  if (agentId === "custom") {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (!spec?.name || !spec?.objective) {
      return NextResponse.json(
        { error: "spec with name and objective required for custom agent" },
        { status: 400 }
      );
    }

    const result = await executeCustomRun({
      sessionId,
      spec,
      userMessage: userMessage ?? spec.objective,
      budget,
      approval,
      amountHbar,
      skipPayment,
      paymentTxId,
      swapApproved,
      quoteOnly,
      previewOnly,
      swapIntake,
    });

    return NextResponse.json({ ...result, hashScanTopicUrl: hashScanTopicUrl() });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const stubDefaults = stubAgentConfig;
  const { toolkit } = buildHbarRuntime({
    sessionId,
    budget: budget ?? stubDefaults.defaultBudget,
    approval: approval ?? stubDefaults.defaultApproval,
    counterparty: getStubCounterpartyConfig(),
    taskType: stubDefaults.taskType,
    agentId: "stub",
  });

  const tools = normalizeHederaToolsForAiSdk(toolkit.getTools());

  const streamOpts: Parameters<typeof streamText>[0] = {
    model: openai("gpt-4o"),
    system: buildSystemPrompt("stub", budget ?? stubDefaults.defaultBudget),
    messages: messages ?? [],
    maxSteps: 3,
    temperature: 0.2,
  };

  if (Object.keys(tools).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    streamOpts.tools = tools as any;
  }

  if (!stream) {
    return NextResponse.json({ error: "Non-streaming stub run not supported" }, { status: 400 });
  }

  const result = streamText(streamOpts);
  return result.toDataStreamResponse();
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/hbar/run] unhandled error:", err);
    return NextResponse.json(
      { status: "error", policyState: "error", reason: message },
      { status: 500 }
    );
  }
}
