import { createAuditTrailHook } from "hak-hbar-policies";
import { getHbarClient } from "../hedera-client";

export async function logPolicyDecisionToHcs(
  topicId: string,
  entry: Record<string, unknown>
): Promise<string | undefined> {
  const { submitAuditMessage } = await import("../hedera-client");
  const message = JSON.stringify({
    source: "hbar-agents",
    ...entry,
    timestamp: Date.now(),
  });
  return submitAuditMessage(topicId, message);
}

export function createAuditTrailHookForOperator(topicId: string) {
  return createAuditTrailHook(topicId, getHbarClient());
}
