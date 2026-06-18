import { HcsAuditTrailHook } from "@hashgraph/hedera-agent-kit/hooks";
import type { Client } from "@hiero-ledger/sdk";
import { POLICY_GUARDED_TOOLS } from "./tools";

export function createAuditTrailHook(
  topicId: string,
  client: Client
): HcsAuditTrailHook {
  return new HcsAuditTrailHook([...POLICY_GUARDED_TOOLS], topicId, client);
}
