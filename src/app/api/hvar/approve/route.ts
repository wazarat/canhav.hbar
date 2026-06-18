import { NextRequest, NextResponse } from "next/server";
import {
  getPendingApproval,
  resolveApproval,
  logPolicyEvent,
} from "@hvar/lib/policy-state";
import { executeStubPayment } from "@hvar/lib/execute-stub-pay";
import { stubAgentConfig } from "@hvar/agents/stub/config";
import type { BudgetConfig, ApprovalConfig } from "@hvar/lib/policy-state";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    approvalId,
    approved,
    sessionId,
    budget = stubAgentConfig.defaultBudget,
    approval = stubAgentConfig.defaultApproval,
  } = body as {
    approvalId: string;
    approved: boolean;
    sessionId: string;
    budget?: BudgetConfig;
    approval?: ApprovalConfig;
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

  const payResult = await executeStubPayment({
    sessionId,
    budget,
    approval,
    amountHbar: pending.amountHbar,
  });

  return NextResponse.json(payResult);
}
