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
    await hydratePolicySessionFromDb(sessionId);
  }
  try {
    return await fn();
  } finally {
    if (process.env.DATABASE_URL) {
      await persistPolicySessionToDb(sessionId);
    }
  }
}

export function assertHbarEnvForRoute() {
  return validateHbarEnv({ throwOnMissingRequired: true });
}
