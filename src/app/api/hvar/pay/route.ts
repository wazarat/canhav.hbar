import { NextRequest, NextResponse } from "next/server";
import { executeStubPayment } from "@hvar/lib/execute-stub-pay";
import { stubAgentConfig, STUB_TASK_PRICE_HBAR } from "@hvar/agents/stub/config";
import type { BudgetConfig, ApprovalConfig } from "@hvar/lib/policy-state";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId = req.headers.get("x-session-id") ?? "anonymous",
      budget = stubAgentConfig.defaultBudget,
      approval = stubAgentConfig.defaultApproval,
      amountHbar = STUB_TASK_PRICE_HBAR,
    } = body as {
      sessionId?: string;
      budget?: BudgetConfig;
      approval?: ApprovalConfig;
      amountHbar?: number;
    };

    const response = await executeStubPayment({
      sessionId,
      budget,
      approval,
      amountHbar,
    });

    const auditTopicId = process.env.HVAR_AUDIT_TOPIC_ID;
    const hashScanTopicUrl = auditTopicId
      ? `https://hashscan.io/testnet/topic/${auditTopicId}`
      : undefined;

    return NextResponse.json({ ...response, hashScanTopicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
