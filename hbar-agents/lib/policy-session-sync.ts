import { validateHbarEnv } from "@hbar/lib/env";
import {
  hydratePolicySessionFromDb,
  persistPolicySessionToDb,
} from "@hbar/lib/policy-state-db";

export async function withPolicySession<T>(
  sessionId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.DATABASE_URL) {
    try {
      await hydratePolicySessionFromDb(sessionId);
    } catch (e) {
      console.error(
        "[policy-session] hydrate failed, continuing with in-memory state:",
        e
      );
    }
  }
  try {
    return await fn();
  } finally {
    if (process.env.DATABASE_URL) {
      try {
        await persistPolicySessionToDb(sessionId);
      } catch (e) {
        console.error("[policy-session] persist failed (non-fatal):", e);
      }
    }
  }
}

export function assertHbarEnvForRoute() {
  return validateHbarEnv({ throwOnMissingRequired: true });
}
