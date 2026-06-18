import { NextRequest, NextResponse } from "next/server";
import { executeAgentPayment } from "@hbar/lib/execute-agent-payment";
import { stubAgentConfig, STUB_TASK_PRICE_HBAR } from "@hbar/agents/stub/config";
import {
  yieldScoutAgentConfig,
  YIELD_SCOUT_TASK_PRICE_HBAR,
} from "@hbar/agents/yield-scout/config";
import {
  swapExecutorAgentConfig,
  SWAP_EXECUTOR_TASK_PRICE_HBAR,
} from "@hbar/agents/swap-executor/config";
import type { BudgetConfig, ApprovalConfig } from "@hbar/lib/policy-state";
import type { HbarAgentId } from "@hbar/lib/agent-config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId = req.headers.get("x-session-id") ?? "anonymous",
      budget,
      approval,
      amountHbar,
      agentId = "stub",
    } = body as {
      sessionId?: string;
      budget?: BudgetConfig;
      approval?: ApprovalConfig;
      amountHbar?: number;
      agentId?: HbarAgentId;
    };

    const isYieldScout = agentId === "yield-scout";
    const isSwapExecutor = agentId === "swap-executor";
    const defaults = isYieldScout
      ? yieldScoutAgentConfig
      : isSwapExecutor
        ? swapExecutorAgentConfig
        : stubAgentConfig;
    const defaultAmount = isYieldScout
      ? YIELD_SCOUT_TASK_PRICE_HBAR
      : isSwapExecutor
        ? SWAP_EXECUTOR_TASK_PRICE_HBAR
        : STUB_TASK_PRICE_HBAR;

    const response = await executeAgentPayment({
      sessionId,
      budget: budget ?? defaults.defaultBudget,
      approval: approval ?? defaults.defaultApproval,
      amountHbar: amountHbar ?? defaultAmount,
      agentId,
    });

    const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
    const hashScanTopicUrl = auditTopicId
      ? `https://hashscan.io/testnet/topic/${auditTopicId}`
      : undefined;

    return NextResponse.json({ ...response, hashScanTopicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
