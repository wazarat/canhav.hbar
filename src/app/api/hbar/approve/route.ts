import { NextRequest, NextResponse } from "next/server";
import {
  getPendingApproval,
  resolveApproval,
  logPolicyEvent,
} from "@hbar/lib/policy-state";
import { executeAgentPayment } from "@hbar/lib/execute-agent-payment";
import { stubAgentConfig } from "@hbar/agents/stub/config";
import { yieldScoutAgentConfig } from "@hbar/agents/yield-scout/config";
import type { BudgetConfig, ApprovalConfig } from "@hbar/lib/policy-state";
import type { HbarAgentId } from "@hbar/lib/agent-config";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    approvalId,
    approved,
    sessionId,
    budget,
    approval,
    agentId = "stub",
  } = body as {
    approvalId: string;
    approved: boolean;
    sessionId: string;
    budget?: BudgetConfig;
    approval?: ApprovalConfig;
    agentId?: HbarAgentId;
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
      reason: "User rejected payment",
    });
    return NextResponse.json({
      status: "rejected",
      policyState: "rejected",
    });
  }

  const defaults =
    agentId === "yield-scout" ? yieldScoutAgentConfig : stubAgentConfig;

  const payResult = await executeAgentPayment({
    sessionId,
    budget: budget ?? defaults.defaultBudget,
    approval: approval ?? defaults.defaultApproval,
    amountHbar: pending.amountHbar,
    agentId,
  });

  const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
  const hashScanTopicUrl = auditTopicId
    ? `https://hashscan.io/testnet/topic/${auditTopicId}`
    : undefined;

  return NextResponse.json({ ...payResult, hashScanTopicUrl });
}
