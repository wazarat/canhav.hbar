import type { CounterpartyConfig } from "./policy-state";
import { logPolicyEvent } from "./policy-state";
import { isRecipientAllowedByRegistry } from "./registry-lookup";

export async function validateCounterpartyBeforePayment(
  sessionId: string,
  tool: string,
  recipient: string,
  amountHbar: number,
  config: CounterpartyConfig
): Promise<void> {
  const registry = config.registry;

  if (registry?.enabled) {
    try {
      const result = await isRecipientAllowedByRegistry(
        recipient,
        config.minReputation ?? registry.minReputation ?? 0,
        registry.agentId
      );

      if (!result.allowed) {
        const reason =
          result.reason ?? `Counterparty not allowlisted: ${recipient}`;
        logPolicyEvent(sessionId, {
          tool,
          recipient,
          amountHbar,
          decision: "blocked_counterparty",
          reason,
        });
        throw new Error(`AllowedCounterpartyPolicy: ${reason}`);
      }
      return;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("AllowedCounterpartyPolicy")
      ) {
        throw error;
      }
      if (registry.fallbackToAllowlist) {
        // fall through to static allowlist below
      } else {
        const reason = `Registry lookup failed: ${
          error instanceof Error ? error.message : String(error)
        }`;
        logPolicyEvent(sessionId, {
          tool,
          recipient,
          amountHbar,
          decision: "blocked_counterparty",
          reason,
        });
        throw new Error(`AllowedCounterpartyPolicy: ${reason}`);
      }
    }
  }

  const allowed = config.allowlist.some(
    (id) => id.toLowerCase() === recipient.toLowerCase()
  );

  if (!allowed) {
    const reason = `Counterparty not allowlisted: ${recipient}`;
    logPolicyEvent(sessionId, {
      tool,
      recipient,
      amountHbar,
      decision: "blocked_counterparty",
      reason,
    });
    throw new Error(`AllowedCounterpartyPolicy: ${reason}`);
  }
}
