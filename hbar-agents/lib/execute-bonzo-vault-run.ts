import { runVaultKeeperIteration, type KeeperRunResult } from "@/lib/bonzo/vault-keeper";
import { db } from "@/lib/db";
import { strategies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface BonzoVaultRunRequest {
  /** DB uuid or config `strategyId` (strat_bonzo_…). */
  strategyId: string;
}

export type BonzoVaultRunResponse =
  | ({
      status: "success" | "skipped";
    } & KeeperRunResult)
  | {
      status: "error";
      strategyId: string;
      error: string;
      decision: "ERROR";
    };

export type BonzoVaultBatchRunResponse = {
  status: "success" | "partial" | "error" | "empty";
  mode: "batch";
  processed: number;
  succeeded: number;
  skipped: number;
  failed: number;
  results: BonzoVaultRunResponse[];
};

export async function executeBonzoVaultRun(
  req: BonzoVaultRunRequest
): Promise<BonzoVaultRunResponse> {
  if (!req.strategyId?.trim()) {
    return {
      status: "error",
      strategyId: "",
      error: "strategyId is required",
      decision: "ERROR",
    };
  }

  const result = await runVaultKeeperIteration(req.strategyId.trim());

  if (!result.ok) {
    return {
      status: "error",
      strategyId: req.strategyId,
      error: result.error ?? "Keeper run failed",
      decision: "ERROR",
    };
  }

  if (result.skipped) {
    return { status: "skipped", ...result };
  }

  return { status: "success", ...result };
}

/** Cron batch: run keeper for every active strategy (cadence skip per row). */
export async function executeBonzoVaultBatchRun(): Promise<BonzoVaultBatchRunResponse> {
  const activeRows = await db
    .select()
    .from(strategies)
    .where(eq(strategies.status, "active"));

  if (activeRows.length === 0) {
    return {
      status: "empty",
      mode: "batch",
      processed: 0,
      succeeded: 0,
      skipped: 0,
      failed: 0,
      results: [],
    };
  }

  const results: BonzoVaultRunResponse[] = [];
  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of activeRows) {
    const strategyId = row.id;
    try {
      const result = await executeBonzoVaultRun({ strategyId });
      results.push(result);
      if (result.status === "error") {
        failed += 1;
      } else if (result.status === "skipped") {
        skipped += 1;
      } else {
        succeeded += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Keeper run failed";
      results.push({
        status: "error",
        strategyId,
        error: message,
        decision: "ERROR",
      });
      failed += 1;
    }
  }

  const processed = results.length;
  let status: BonzoVaultBatchRunResponse["status"] = "success";
  if (failed > 0 && succeeded + skipped === 0) {
    status = "error";
  } else if (failed > 0) {
    status = "partial";
  }

  return {
    status,
    mode: "batch",
    processed,
    succeeded,
    skipped,
    failed,
    results,
  };
}
