import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { strategies, users, vaultPolicyState } from "@/lib/db/schema";
import {
  parseStrategyConfig,
  type StrategyConfig,
} from "./strategy-config.schema";
import type { IVaultAdapter } from "./vault-adapter.types";
import { getVaultAdapterMode, deterministicMockVaultAddress } from "./vault-adapter-factory";

export type ProvisionStrategyInput = StrategyConfig;

export type ProvisionStrategyResult = {
  strategyId: string;
  dbId: string;
  vaultAddress: string;
  hcsTopicId: string | null;
  hcsTxId?: string;
  status: "active";
  adapterMode: string;
};

function redactConfigSummary(config: StrategyConfig): Record<string, unknown> {
  return {
    strategyId: config.strategyId,
    vaultType: config.vaultType,
    vaultCount: config.deterministicPolicies.whitelistVaults.length,
    tokenCount: config.deterministicPolicies.whitelistTokens.length,
    maxTotalAllocation:
      config.deterministicPolicies.spendLimits.maxTotalAllocation,
    maxPerTransaction:
      config.deterministicPolicies.spendLimits.maxPerTransaction,
    denominatedAsset:
      config.deterministicPolicies.spendLimits.denominatedAsset,
    minNetAPY: config.intelligentConstraints.yieldFloor.minNetAPY,
    emergencyMode: config.emergencyOverride.mode,
  };
}

async function logBonzoProvisionAudit(
  entry: Record<string, unknown>
): Promise<string | undefined> {
  const topicId = process.env.HBAR_AUDIT_TOPIC_ID;
  if (!topicId) {
    console.warn(
      "[bonzo-vault] HBAR_AUDIT_TOPIC_ID not set — skipping HCS provision audit"
    );
    return undefined;
  }

  try {
    const { submitAuditMessage } = await import("@hbar/lib/hedera-client");
    const message = JSON.stringify({
      source: "bonzo-vault",
      event: "bonzo_vault.provisioned",
      ...entry,
      timestamp: Date.now(),
    });
    return await submitAuditMessage(topicId, message);
  } catch (error) {
    console.warn(
      "[bonzo-vault] HCS provision audit failed (graceful degrade):",
      error
    );
    return undefined;
  }
}

async function resolveDbUserId(walletAddress: string): Promise<string | null> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);

  if (existing[0]) return existing[0].id;

  try {
    const inserted = await db
      .insert(users)
      .values({ walletAddress })
      .returning({ id: users.id });
    return inserted[0]?.id ?? null;
  } catch (error) {
    console.warn("[bonzo-vault] Could not upsert user row:", error);
    return null;
  }
}

async function resolveVaultAddress(
  config: StrategyConfig,
  adapter: IVaultAdapter
): Promise<string> {
  const primary = config.deterministicPolicies.whitelistVaults[0];
  if (primary) return primary;

  const mode = getVaultAdapterMode();
  if (mode === "dry-run") {
    return deterministicMockVaultAddress(config.strategyId);
  }

  return adapter.createVault({
    isCLM: config.vaultType === "SAUCERSWAP_CLM_LP",
    strategyEvm: config.deterministicPolicies.whitelistTokens[0] ?? primary,
    name: `Bonzo-${config.strategyId.slice(-8)}`,
    symbol: `BZV-${config.vaultType.slice(0, 4)}`,
    approvalDelay: 86400,
    isHederaToken: false,
  });
}

export async function provisionStrategy(
  input: unknown,
  adapter: IVaultAdapter
): Promise<
  | { ok: true; result: ProvisionStrategyResult }
  | { ok: false; status: 400; errors: unknown }
  | { ok: false; status: 500; error: string }
> {
  const parsed = parseStrategyConfig(input);
  if (!parsed.ok) {
    return { ok: false, status: 400, errors: parsed.errors };
  }

  const config: StrategyConfig = {
    ...parsed.config,
    status: "active",
  };

  if (!config.userId?.trim()) {
    return {
      ok: false,
      status: 400,
      errors: [{ path: ["userId"], message: "userId (wallet) is required" }],
    };
  }

  const adapterMode = getVaultAdapterMode();
  const auditTopicId = process.env.HBAR_AUDIT_TOPIC_ID ?? null;

  let vaultAddress: string;
  try {
    vaultAddress = await resolveVaultAddress(config, adapter);
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error:
        error instanceof Error ? error.message : "Failed to resolve vault address",
    };
  }

  const dbUserId = await resolveDbUserId(config.userId);

  let insertedStrategy: { id: string };
  try {
    const rows = await db
      .insert(strategies)
      .values({
        userId: dbUserId,
        vaultType: config.vaultType,
        vaultAddress,
        config,
        hcsTopicId: auditTopicId,
        status: "active",
      })
      .returning({ id: strategies.id });
    insertedStrategy = rows[0];
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error:
        error instanceof Error
          ? error.message
          : "Failed to persist strategy to database",
    };
  }

  try {
    await db.insert(vaultPolicyState).values({
      strategyId: insertedStrategy.id,
      deployedAmount: "0",
      isPaused: "false",
    });
  } catch (error) {
    console.warn("[bonzo-vault] vault_policy_state insert failed:", error);
  }

  const hcsTxId = await logBonzoProvisionAudit({
    strategyId: config.strategyId,
    dbId: insertedStrategy.id,
    userId: config.userId,
    vaultAddress,
    adapterMode,
    vaultType: config.vaultType,
    summary: redactConfigSummary(config),
  });

  return {
    ok: true,
    result: {
      strategyId: config.strategyId,
      dbId: insertedStrategy.id,
      vaultAddress,
      hcsTopicId: auditTopicId,
      hcsTxId,
      status: "active",
      adapterMode,
    },
  };
}
