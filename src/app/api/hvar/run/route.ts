import { NextRequest, NextResponse } from "next/server";
import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  buildHvarRuntime,
  buildStubSystemPrompt,
} from "@hvar/lib/agent-runtime";
import { stubAgentConfig, getStubCounterpartyConfig } from "@hvar/agents/stub/config";
import type { BudgetConfig, ApprovalConfig } from "@hvar/lib/policy-state";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const {
    messages,
    sessionId = "anonymous",
    budget = stubAgentConfig.defaultBudget,
    approval = stubAgentConfig.defaultApproval,
  } = body as {
    messages: CoreMessage[];
    sessionId?: string;
    budget?: BudgetConfig;
    approval?: ApprovalConfig;
  };

  const { toolkit } = buildHvarRuntime({
    sessionId,
    budget,
    approval,
    counterparty: getStubCounterpartyConfig(),
    taskType: stubAgentConfig.taskType,
  });

  const tools = toolkit.getTools();

  const streamOpts: Parameters<typeof streamText>[0] = {
    model: openai("gpt-4o"),
    system: buildStubSystemPrompt(budget),
    messages,
    maxSteps: 3,
    temperature: 0.2,
  };

  if (Object.keys(tools).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    streamOpts.tools = tools as any;
  }

  const result = streamText(streamOpts);

  return result.toDataStreamResponse();
}
