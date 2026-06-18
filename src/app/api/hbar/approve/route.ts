import { NextRequest, NextResponse } from "next/server";
import {
  getPendingApproval,
  resolveApproval,
  logPolicyEvent,
  isPaymentTool,
  isWriteTool,
} from "@hbar/lib/policy-state";
import { executeAgentPayment } from "@hbar/lib/execute-agent-payment";
import { executeSwapExecutorRun } from "@hbar/lib/execute-swap-executor-run";
import { stubAgentConfig } from "@hbar/agents/stub/config";
import { yieldScoutAgentConfig } from "@hbar/agents/yield-scout/config";
import { swapExecutorAgentConfig } from "@hbar/agents/swap-executor/config";
import { lpHealthAgentConfig } from "@hbar/agents/lp-health/config";
import { priceFeedVerifierAgentConfig } from "@hbar/agents/price-feed-verifier/config";
import type { BudgetConfig, ApprovalConfig } from "@hbar/lib/policy-state";
import type { HbarAgentId } from "@hbar/lib/agent-config";
import type { SwapExecutorIntake } from "@hbar/agents/swap-executor/types";

function resolveDefaults(agentId: HbarAgentId) {
  if (agentId === "yield-scout") return yieldScoutAgentConfig;
  if (agentId === "swap-executor") return swapExecutorAgentConfig;
  if (agentId === "lp-health") return lpHealthAgentConfig;
  if (agentId === "price-feed-verifier") return priceFeedVerifierAgentConfig;
  return stubAgentConfig;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    approvalId,
    approved,
    sessionId,
    budget,
    approval,
    agentId = "stub",
    intake,
    paymentTxId,
    skipPayment,
  } = body as {
    approvalId: string;
    approved: boolean;
    sessionId: string;
    budget?: BudgetConfig;
    approval?: ApprovalConfig;
    agentId?: HbarAgentId;
    intake?: SwapExecutorIntake;
    paymentTxId?: string;
    skipPayment?: boolean;
  };

  if (!approvalId || !sessionId) {
    return NextResponse.json(
      { error: "approvalId and sessionId required" },
      { status: 400 }
    );
  }

  const pending = getPendingApproval(approvalId);
  if (!pending) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  resolveApproval(approvalId, approved);

  if (!approved) {
    logPolicyEvent(sessionId, {
      tool: pending.tool,
      amountHbar: pending.amountHbar,
      recipient: pending.recipient,
      decision: "rejected",
      reason: isWriteTool(pending.tool)
        ? "User rejected swap"
        : "User rejected payment",
    });
    return NextResponse.json({
      status: "rejected",
      policyState: "rejected",
    });
  }

  const defaults = resolveDefaults(agentId);
  const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
  const hashScanTopicUrl = auditTopicId
    ? `https://hashscan.io/testnet/topic/${auditTopicId}`
    : undefined;

  if (agentId === "swap-executor" && isWriteTool(pending.tool)) {
    if (!intake?.tokenIn || !intake?.tokenOut || !intake?.amountIn) {
      return NextResponse.json(
        { error: "intake required to resume swap execution" },
        { status: 400 }
      );
    }

    const runResult = await executeSwapExecutorRun({
      sessionId,
      intake,
      budget: budget ?? defaults.defaultBudget,
      approval: approval ?? defaults.defaultApproval,
      skipPayment: true,
      paymentTxId,
      swapApproved: true,
    });

    return NextResponse.json({ ...runResult, hashScanTopicUrl });
  }

  if (agentId === "swap-executor" && isPaymentTool(pending.tool)) {
    const payResult = await executeAgentPayment({
      sessionId,
      budget: budget ?? defaults.defaultBudget,
      approval: approval ?? defaults.defaultApproval,
      amountHbar: pending.amountHbar,
      agentId: "swap-executor",
    });

    if (payResult.status !== "success") {
      return NextResponse.json({ ...payResult, hashScanTopicUrl });
    }

    if (!intake?.tokenIn || !intake?.tokenOut || !intake?.amountIn) {
      return NextResponse.json({ ...payResult, hashScanTopicUrl });
    }

    const runResult = await executeSwapExecutorRun({
      sessionId,
      intake,
      budget: budget ?? defaults.defaultBudget,
      approval: approval ?? defaults.defaultApproval,
      skipPayment: true,
      paymentTxId: payResult.txId ?? paymentTxId,
    });

    return NextResponse.json({ ...runResult, hashScanTopicUrl });
  }

  if (agentId === "yield-scout" && skipPayment) {
    return NextResponse.json({
      status: "approved",
      policyState: "within policy",
      hashScanTopicUrl,
    });
  }

  if (
    (agentId === "lp-health" || agentId === "price-feed-verifier") &&
    skipPayment
  ) {
    return NextResponse.json({
      status: "approved",
      policyState: "within policy",
      hashScanTopicUrl,
    });
  }

  const payResult = await executeAgentPayment({
    sessionId,
    budget: budget ?? defaults.defaultBudget,
    approval: approval ?? defaults.defaultApproval,
    amountHbar: pending.amountHbar,
    agentId,
  });

  return NextResponse.json({ ...payResult, hashScanTopicUrl });
}
