import { HcsAuditTrailHook } from "@hashgraph/hedera-agent-kit/hooks";
import { getHvarClient } from "../hedera-client";
import { PAYMENT_TOOLS } from "../policy-state";

export function createAuditTrailHook(topicId: string): HcsAuditTrailHook {
  return new HcsAuditTrailHook([...PAYMENT_TOOLS], topicId, getHvarClient());
}

export async function logPolicyDecisionToHcs(
  topicId: string,
  entry: Record<string, unknown>
): Promise<string | undefined> {
  const { submitAuditMessage } = await import("../hedera-client");
  const message = JSON.stringify({
    source: "hvar-agents",
    ...entry,
    timestamp: Date.now(),
  });
  return submitAuditMessage(topicId, message);
}
