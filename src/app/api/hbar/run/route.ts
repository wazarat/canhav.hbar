import { NextRequest, NextResponse } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildHbarRuntime, buildSystemPrompt } from "@hbar/lib/agent-runtime";
import { stubAgentConfig, getStubCounterpartyConfig } from "@hbar/agents/stub/config";
import {
  yieldScoutAgentConfig,
} from "@hbar/agents/yield-scout/config";
import { swapExecutorAgentConfig } from "@hbar/agents/swap-executor/config";
import { executeYieldScoutRun } from "@hbar/lib/execute-yield-scout-run";
import { executeSwapExecutorRun } from "@hbar/lib/execute-swap-executor-run";
import type { BudgetConfig, ApprovalConfig } from "@hbar/lib/policy-state";
import type { HbarAgentId } from "@hbar/lib/agent-config";
import type { SwapExecutorIntake } from "@hbar/agents/swap-executor/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    messages,
    goal,
    sessionId = req.headers.get("x-session-id") ?? "anonymous",
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
  } = body as {
    messages?: CoreMessage[];
    goal?: string;
    sessionId?: string;
    budget?: BudgetConfig;
    approval?: ApprovalConfig;
    amountHbar?: number;
    agentId?: HbarAgentId;
    stream?: boolean;
    skipPayment?: boolean;
    paymentTxId?: string;
    intake?: SwapExecutorIntake;
    quoteOnly?: boolean;
    swapApproved?: boolean;
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

    if (!intake?.tokenIn || !intake?.tokenOut || !intake?.amountIn) {
      return NextResponse.json(
        { error: "intake with tokenIn, tokenOut, amountIn required" },
        { status: 400 }
      );
    }

    const seDefaults = swapExecutorAgentConfig;
    const result = await executeSwapExecutorRun({
      sessionId,
      intake,
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

  const tools = toolkit.getTools();

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
}
