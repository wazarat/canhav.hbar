import { NextRequest, NextResponse } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { buildHvarRuntime, buildSystemPrompt } from "@hvar/lib/agent-runtime";
import { stubAgentConfig, getStubCounterpartyConfig } from "@hvar/agents/stub/config";
import {
  yieldScoutAgentConfig,
} from "@hvar/agents/yield-scout/config";
import { executeYieldScoutRun } from "@hvar/lib/execute-yield-scout-run";
import type { BudgetConfig, ApprovalConfig } from "@hvar/lib/policy-state";
import type { HvarAgentId } from "@hvar/lib/agent-config";

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
  } = body as {
    messages?: CoreMessage[];
    goal?: string;
    sessionId?: string;
    budget?: BudgetConfig;
    approval?: ApprovalConfig;
    amountHbar?: number;
    agentId?: HvarAgentId;
    stream?: boolean;
    skipPayment?: boolean;
    paymentTxId?: string;
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

    const auditTopicId = process.env.HVAR_AUDIT_TOPIC_ID;
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
  const { toolkit } = buildHvarRuntime({
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
