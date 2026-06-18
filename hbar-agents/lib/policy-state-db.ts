import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { policySessionState } from "@/lib/db/schema";
import type { PolicySessionSnapshot } from "./policy-state";
import {
  exportPolicySession,
  importPolicySession,
} from "./policy-state";

export async function hydratePolicySessionFromDb(
  sessionId: string
): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const rows = await db
    .select()
    .from(policySessionState)
    .where(eq(policySessionState.sessionId, sessionId))
    .limit(1);

  const row = rows[0];
  if (row?.state) {
    importPolicySession(sessionId, row.state);
  }
}

export async function persistPolicySessionToDb(
  sessionId: string
): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const snapshot = exportPolicySession(sessionId);

  await db
    .insert(policySessionState)
    .values({
      sessionId,
      state: snapshot,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: policySessionState.sessionId,
      set: {
        state: snapshot,
        updatedAt: new Date(),
      },
    });
}
