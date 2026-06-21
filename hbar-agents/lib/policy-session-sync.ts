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
      // #region agent log
      fetch('http://127.0.0.1:7765/ingest/2fa6e897-3794-44a7-8cb6-760966e0ebf6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'55975b'},body:JSON.stringify({sessionId:'55975b',location:'policy-session-sync.ts:hydrate',message:'hydrate ok',data:{sessionId},timestamp:Date.now(),hypothesisId:'H2-H3'})}).catch(()=>{});
      // #endregion
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7765/ingest/2fa6e897-3794-44a7-8cb6-760966e0ebf6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'55975b'},body:JSON.stringify({sessionId:'55975b',location:'policy-session-sync.ts:hydrate',message:'hydrate failed',data:{sessionId,error:e instanceof Error?e.message:String(e)},timestamp:Date.now(),hypothesisId:'H2-H3'})}).catch(()=>{});
      // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7765/ingest/2fa6e897-3794-44a7-8cb6-760966e0ebf6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'55975b'},body:JSON.stringify({sessionId:'55975b',location:'policy-session-sync.ts:persist',message:'persist ok',data:{sessionId},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7765/ingest/2fa6e897-3794-44a7-8cb6-760966e0ebf6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'55975b'},body:JSON.stringify({sessionId:'55975b',location:'policy-session-sync.ts:persist',message:'persist failed',data:{sessionId,error:e instanceof Error?e.message:String(e)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        console.error("[policy-session] persist failed (non-fatal):", e);
      }
    }
  }
}

export function assertHbarEnvForRoute() {
  return validateHbarEnv({ throwOnMissingRequired: true });
}
