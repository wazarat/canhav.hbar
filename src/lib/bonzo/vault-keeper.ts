import {
  runBonzoVaultAgent,
  proposalToAction,
  type StrategistProposal,
} from "@/agents/bonzo-vault-agent";
import { db } from "@/lib/db";
import {
  strategies,
  strategyRuns,
  vaultPolicyState,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decimalToBaseUnits } from "./policies/decimal";
import { runEmergency } from "./policies/emergency";
import { runPolicyGate, type PolicyResult } from "./policies/policy-state";
import { fetchNewsSentiment } from "./signals/news-sentiment";
import { fetchVixIndex } from "./signals/vix-feed";
import type { StrategyConfig } from "./strategy-config.schema";
import {
  getVaultAdapter,
  getVaultAdapterMode,
} from "./vault-adapter-factory";
import { mockHarvestBumpPps } from "./mock-vault-adapter";
import type { IVaultAdapter } from "./vault-adapter.types";

const KEEPER_FEE_HBAR = Number(process.env.BONZO_VAULT_KEEPER_FEE_HBAR ?? "0.01");

export type KeeperRunResult = {
  ok: boolean;
  skipped?: boolean;
  skipReason?: string;
  decision: string;
  dbId: string;
  strategyId: string;
  proposal?: StrategistProposal;
  policyResult?: PolicyResult;
  txId?: string;
  txIds?: string[];
  hcsTxId?: string;
  feeTxId?: string;
  runId?: string;
  adapterMode: string;
  hashScanTopicUrl?: string;
  hashScanTxUrl?: string;
  error?: string;
};

async function loadStrategyRow(strategyId: string) {
  const byUuid = await db
    .select()
    .from(strategies)
    .where(eq(strategies.id, strategyId))
    .limit(1);
  if (byUuid[0]) return byUuid[0];

  const active = await db
    .select()
    .from(strategies)
    .where(eq(strategies.status, "active"));
  return active.find((row) => row.config.strategyId === strategyId);
}

async function loadPolicyState(dbId: string) {
  const rows = await db
    .select()
    .from(vaultPolicyState)
    .where(eq(vaultPolicyState.strategyId, dbId))
    .limit(1);
  return rows[0];
}

function parseDeployedAmount(value: string | null | undefined): bigint {
  if (!value) return BigInt(0);
  try {
    return decimalToBaseUnits(value);
  } catch {
    return BigInt(0);
  }
}

function withinHarvestCadence(
  lastHarvestAt: Date | null | undefined,
  cadenceMinutes: number
): boolean {
  if (!lastHarvestAt) return false;
  return Date.now() - lastHarvestAt.getTime() < cadenceMinutes * 60 * 1000;
}

async function resolveNetApy(
  config: StrategyConfig,
  adapter: IVaultAdapter,
  vaultAddress: string
): Promise<number> {
  const strategyEvm =
    config.deterministicPolicies.whitelistTokens[0] ?? vaultAddress;
  let netApy = await adapter.getStrategyApy(strategyEvm);

  try {
    const { fetchBonzoReserves } = await import(
      "@hbar/lib/plugins/bonzo-readonly"
    );
    const asset = config.deterministicPolicies.spendLimits.denominatedAsset;
    const reserves = await fetchBonzoReserves();
    const match = reserves.find(
      (r) => r.symbol.toUpperCase() === asset.toUpperCase()
    );
    if (match) {
      netApy = (netApy + match.supplyApy) / 2;
    }
  } catch {
    // bonzo-readonly cross-check optional
  }

  return netApy;
}

async function logKeeperRunAudit(
  entry: Record<string, unknown>
): Promise<string | undefined> {
  const topicId = process.env.HBAR_AUDIT_TOPIC_ID;
  if (!topicId) {
    console.warn(
      "[bonzo-vault] HBAR_AUDIT_TOPIC_ID not set — skipping HCS keeper audit"
    );
    return undefined;
  }

  try {
    const { submitAuditMessage } = await import("@hbar/lib/hedera-client");
    const message = JSON.stringify({
      source: "bonzo-vault",
      event: "bonzo_vault.run",
      ...entry,
      timestamp: Date.now(),
    });
    return await submitAuditMessage(topicId, message);
  } catch (error) {
    console.warn("[bonzo-vault] HCS keeper audit failed:", error);
    return undefined;
  }
}

async function maybeCollectKeeperFee(): Promise<string | undefined> {
  if (process.env.BONZO_VAULT_KEEPER_FEE_ENABLED === "false") {
    return undefined;
  }
  if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    return undefined;
  }

  try {
    const { transferHbar, getStubWorkerId } = await import(
      "@hbar/lib/hedera-client"
    );
    return await transferHbar(getStubWorkerId(), KEEPER_FEE_HBAR);
  } catch (error) {
    console.warn("[bonzo-vault] keeper fee transfer skipped:", error);
    return undefined;
  }
}

async function executeApprovedAction(
  config: StrategyConfig,
  adapter: IVaultAdapter,
  vaultAddress: string,
  proposal: StrategistProposal,
  action: ReturnType<typeof proposalToAction>,
  userShares: bigint
): Promise<{ decision: string; txId?: string; txIds?: string[] }> {
  const strategyEvm =
    config.deterministicPolicies.whitelistTokens[0] ?? vaultAddress;

  switch (action.kind) {
    case "HOLD":
      return { decision: "HOLD" };
    case "HARVEST": {
      const { txId } = await adapter.harvest(config, strategyEvm);
      if (getVaultAdapterMode() === "mock") {
        mockHarvestBumpPps(vaultAddress);
      }
      return { decision: "HARVEST", txId };
    }
    case "DEPOSIT": {
      const { txId } = await adapter.depositToVault(
        config,
        vaultAddress,
        action.amount
      );
      return { decision: "DEPOSIT", txId };
    }
    case "WITHDRAW": {
      const shares = action.amount > BigInt(0) ? action.amount : userShares;
      const { txId } = await adapter.withdrawFromVault(
        config,
        vaultAddress,
        shares
      );
      return { decision: "WITHDRAW", txId };
    }
    case "REBALANCE":
      return { decision: "REBALANCE" };
    case "EMERGENCY": {
      const emergency = await runEmergency(config, adapter, {
        vaultAddress,
        strategyEvm,
        userShares,
      });
      return {
        decision: emergency.decision,
        txIds: emergency.txIds,
        txId: emergency.txIds[0],
      };
    }
    default:
      return { decision: "UNKNOWN" };
  }
}

async function persistRun(params: {
  dbId: string;
  decision: string;
  policyResult?: PolicyResult;
  txId?: string;
  hcsTxId?: string;
}): Promise<string> {
  const rows = await db
    .insert(strategyRuns)
    .values({
      strategyId: params.dbId,
      decision: params.decision,
      policyResult: params.policyResult ?? null,
      txId: params.txId ?? null,
      hcsSequence: params.hcsTxId ?? null,
    })
    .returning({ id: strategyRuns.id });
  return rows[0]!.id;
}

async function updatePolicyState(
  dbId: string,
  updates: {
    deployedAmount?: bigint;
    lastHarvestAt?: Date;
    isPaused?: boolean;
  }
): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.deployedAmount !== undefined) {
    const whole = updates.deployedAmount / BigInt(100_000_000);
    const frac = updates.deployedAmount % BigInt(100_000_000);
    patch.deployedAmount = `${whole}.${frac.toString().padStart(8, "0")}`;
  }
  if (updates.lastHarvestAt) patch.lastHarvestAt = updates.lastHarvestAt;
  if (updates.isPaused !== undefined) {
    patch.isPaused = updates.isPaused ? "true" : "false";
  }

  await db
    .update(vaultPolicyState)
    .set(patch)
    .where(eq(vaultPolicyState.strategyId, dbId));
}

/** One keeper iteration: Sentinel → Strategist → Gate → Executor → Auditor. */
export async function runVaultKeeperIteration(
  strategyId: string,
  adapter?: IVaultAdapter
): Promise<KeeperRunResult> {
  const resolvedAdapter = adapter ?? getVaultAdapter();
  const adapterMode = getVaultAdapterMode();

  const row = await loadStrategyRow(strategyId);
  if (!row) {
    return {
      ok: false,
      decision: "ERROR",
      dbId: "",
      strategyId,
      adapterMode,
      error: "Strategy not found",
    };
  }

  const config = row.config;
  const dbId = row.id;
  const vaultAddress =
    row.vaultAddress ?? config.deterministicPolicies.whitelistVaults[0]!;

  const policyState = await loadPolicyState(dbId);
  const deployedAmount = parseDeployedAmount(policyState?.deployedAmount);
  const isPaused = policyState?.isPaused === "true";
  const cadence =
    config.deterministicPolicies.execution.harvestCadenceMinutes;

  if (withinHarvestCadence(policyState?.lastHarvestAt ?? null, cadence)) {
    const runId = await persistRun({
      dbId,
      decision: "SKIPPED",
      policyResult: {
        allowed: true,
        reason: `within harvest cadence (${cadence}m)`,
      },
    });
    return {
      ok: true,
      skipped: true,
      skipReason: `Last harvest within ${cadence} minutes`,
      decision: "SKIPPED",
      dbId,
      strategyId: config.strategyId,
      runId,
      adapterMode,
    };
  }

  if (isPaused) {
    const runId = await persistRun({
      dbId,
      decision: "SKIPPED",
      policyResult: { allowed: true, reason: "strategy paused" },
    });
    return {
      ok: true,
      skipped: true,
      skipReason: "Strategy is paused",
      decision: "SKIPPED",
      dbId,
      strategyId: config.strategyId,
      runId,
      adapterMode,
    };
  }

  try {
    const baseline = await resolvedAdapter.getVaultHealth(
      vaultAddress,
      BigInt(0)
    );
    const userShares = resolvedAdapter.assetsToShares(
      deployedAmount,
      baseline.pricePerFullShare
    );
    const health = await resolvedAdapter.getVaultHealth(
      vaultAddress,
      userShares
    );

    const netAPY = await resolveNetApy(config, resolvedAdapter, vaultAddress);

    const macro = config.intelligentConstraints.macroGating;
    const vix = macro.vixIndexTracked ? await fetchVixIndex() : undefined;
    const newsNegative = macro.newsSentimentFilterEnabled
      ? await fetchNewsSentiment({ enabled: true })
      : undefined;

    const proposal = await runBonzoVaultAgent({
      config,
      observations: {
        pricePerFullShare: health.pricePerFullShare.toString(),
        netAPY,
        userShares: health.userShares.toString(),
        vix,
        newsNegative,
      },
    });

    const action = proposalToAction(proposal, vaultAddress);
    const policyResult = runPolicyGate(config, action, {
      deployedAmount,
      netAPY,
      vix,
      newsNegative,
    });

    let decision: string;
    let txId: string | undefined;
    let txIds: string[] | undefined;
    let newDeployed = deployedAmount;
    let newPaused: boolean = isPaused;
    let lastHarvestAt: Date | undefined;

    if (!policyResult.allowed && policyResult.triggerEmergency) {
      const strategyEvm =
        config.deterministicPolicies.whitelistTokens[0] ?? vaultAddress;
      const emergency = await runEmergency(config, resolvedAdapter, {
        vaultAddress,
        strategyEvm,
        userShares: health.userShares,
      });
      decision = emergency.decision;
      txIds = emergency.txIds;
      txId = emergency.txIds[0];
      newPaused = emergency.isPaused;
      if (emergency.exited) newDeployed = BigInt(0);
    } else if (!policyResult.allowed) {
      decision = "BLOCKED";
    } else {
      const exec = await executeApprovedAction(
        config,
        resolvedAdapter,
        vaultAddress,
        proposal,
        action,
        health.userShares
      );
      decision = exec.decision;
      txId = exec.txId;
      txIds = exec.txIds;

      if (decision === "DEPOSIT") {
        newDeployed = deployedAmount + action.amount;
      } else if (decision === "WITHDRAW") {
        const withdrawn =
          action.amount > BigInt(0) ? action.amount : health.userShares;
        const assets = resolvedAdapter.sharesToAssets(
          withdrawn,
          health.pricePerFullShare
        );
        newDeployed =
          deployedAmount > assets ? deployedAmount - assets : BigInt(0);
      } else if (decision === "HARVEST") {
        lastHarvestAt = new Date();
      } else if (
        decision === "EMERGENCY_PAUSE" ||
        decision === "EMERGENCY_EXIT"
      ) {
        newPaused = true;
        if (decision === "EMERGENCY_EXIT") newDeployed = BigInt(0);
      }
    }

    const feeTxId =
      decision !== "BLOCKED" && decision !== "SKIPPED"
        ? await maybeCollectKeeperFee()
        : undefined;

    const hcsTxId = await logKeeperRunAudit({
      strategyId: config.strategyId,
      dbId,
      vaultAddress,
      adapterMode,
      proposal,
      policyResult,
      decision,
      txId,
      txIds,
      feeTxId,
      netAPY,
      vix,
      newsNegative,
    });

    await updatePolicyState(dbId, {
      deployedAmount: newDeployed,
      lastHarvestAt,
      isPaused: newPaused,
    });

    const primaryTxId = feeTxId ?? txId;
    const runId = await persistRun({
      dbId,
      decision,
      policyResult,
      txId: primaryTxId,
      hcsTxId,
    });

    const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID;
    const { getHashScanUrl, getHashScanTopicUrl } = await import(
      "@hbar/lib/hedera-client"
    );

    return {
      ok: true,
      decision,
      dbId,
      strategyId: config.strategyId,
      proposal,
      policyResult,
      txId: primaryTxId,
      txIds,
      hcsTxId,
      feeTxId,
      runId,
      adapterMode,
      hashScanTopicUrl: auditTopicId
        ? getHashScanTopicUrl(auditTopicId)
        : undefined,
      hashScanTxUrl: primaryTxId ? getHashScanUrl(primaryTxId) : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const hcsTxId = await logKeeperRunAudit({
      strategyId: config.strategyId,
      dbId,
      vaultAddress,
      adapterMode,
      decision: "ERROR",
      error: message,
    });
    const runId = await persistRun({
      dbId,
      decision: "ERROR",
      policyResult: { allowed: false, reason: message },
      hcsTxId,
    });
    return {
      ok: false,
      decision: "ERROR",
      dbId,
      strategyId: config.strategyId,
      runId,
      adapterMode,
      hcsTxId,
      error: message,
    };
  }
}
