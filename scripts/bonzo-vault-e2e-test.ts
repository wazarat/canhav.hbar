/**
 * E2E smoke: provision strategy + keeper run with HCS audit verification.
 * Usage: dotenv -e .env.local -- tsx scripts/bonzo-vault-e2e-test.ts
 */
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { strategies, strategyRuns, vaultPolicyState } from "../src/lib/db/schema";
import { makeStrategyConfig } from "../src/lib/bonzo/policies/test-fixtures";
import { provisionStrategy } from "../src/lib/bonzo/provision-strategy";
import { getVaultAdapter, getVaultAdapterMode } from "../src/lib/bonzo/vault-adapter-factory";
import { getChainVaultAdapter } from "../src/lib/bonzo/vault-adapter";
import { runVaultKeeperIteration } from "../src/lib/bonzo/vault-keeper";

function fail(msg: string): never {
  console.error(`\n[bonzo:e2e] FAIL: ${msg}\n`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`[bonzo:e2e] OK: ${msg}`);
}

async function main() {
  console.log("\nBonzo vault E2E test (provision + keeper + HCS)\n");

  if (!process.env.DATABASE_URL) fail("DATABASE_URL required");
  if (!process.env.HBAR_AUDIT_TOPIC_ID) fail("HBAR_AUDIT_TOPIC_ID required");
  if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    fail("HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY required");
  }

  const userId = process.env.HEDERA_OPERATOR_ID;
  const strategyId = `strat_bonzo_e2e_${Date.now()}`;
  const strategyEvm =
    process.env.BONZO_SMOKE_STRATEGY_EVM?.trim() ??
    fail("BONZO_SMOKE_STRATEGY_EVM required for chain e2e");

  let vaultEvm = process.env.BONZO_SMOKE_VAULT_EVM?.trim();
  if (getVaultAdapterMode() === "chain" && !vaultEvm) {
    const chain = getChainVaultAdapter();
    vaultEvm = await chain.createVault({
      isCLM: false,
      strategyEvm,
      name: "E2EVault",
      symbol: "e2eBVT",
      approvalDelay: 0,
      isHederaToken: false,
    });
    ok(`cloned testnet vault ${vaultEvm}`);
  }
  if (!vaultEvm) {
    vaultEvm = "0x1e879F10B6f29D3278B966F9707242E31874df10";
  }

  const config = makeStrategyConfig({
    strategyId,
    userId,
    deterministicPolicies: {
      whitelistVaults: [vaultEvm],
      whitelistTokens: [strategyEvm],
      spendLimits: {
        maxTotalAllocation: "10000",
        maxPerTransaction: "1000",
        denominatedAsset: "USDC",
      },
      execution: {
        maxSlippagePercent: 0.5,
        harvestCadenceMinutes: 15,
      },
    },
    intelligentConstraints: {
      yieldFloor: { minNetAPY: 0, actionOnBreach: "TRIGGER_EMERGENCY_OVERRIDE" },
      macroGating: {
        vixIndexTracked: false,
        vixMaxThreshold: 30,
        newsSentimentFilterEnabled: false,
      },
    },
  });

  const adapter = getVaultAdapter();
  const provisionOut = await provisionStrategy(config, adapter);
  if (!provisionOut.ok) {
    fail(`provision failed: ${JSON.stringify(provisionOut)}`);
  }
  const provision = provisionOut.result;
  ok(`provisioned strategy ${provision.strategyId} dbId=${provision.dbId}`);
  if (!provision.hcsTxId) {
    fail("provision did not return hcsTxId — HCS audit missing");
  }
  ok(`provision HCS tx ${provision.hcsTxId}`);

  const policyRow = await db
    .select()
    .from(vaultPolicyState)
    .where(eq(vaultPolicyState.strategyId, provision.dbId))
    .limit(1);
  if (!policyRow[0]) fail("vault_policy_state row missing");
  ok("vault_policy_state row present");

  const keeper = await runVaultKeeperIteration(provision.dbId);
  if (keeper.skipped) {
    fail(`keeper skipped unexpectedly: ${keeper.skipReason ?? keeper.decision}`);
  }
  if (!keeper.ok) {
    fail(`keeper failed: ${keeper.error ?? keeper.decision}`);
  }
  ok(`keeper decision=${keeper.decision}`);
  if (!keeper.hcsTxId) {
    fail("keeper did not return hcsTxId — HCS audit missing");
  }
  ok(`keeper HCS tx ${keeper.hcsTxId}`);

  const runs = await db
    .select()
    .from(strategyRuns)
    .where(eq(strategyRuns.strategyId, provision.dbId))
    .limit(1);
  if (!runs[0]) fail("strategy_runs row missing");
  ok(`strategy_runs row decision=${runs[0].decision}`);

  const topicId = process.env.HBAR_AUDIT_TOPIC_ID;
  console.log(`\nHashScan topic: https://hashscan.io/testnet/topic/${topicId}`);
  console.log(`Provision tx: https://hashscan.io/testnet/transaction/${provision.hcsTxId}`);
  console.log(`Keeper tx: https://hashscan.io/testnet/transaction/${keeper.hcsTxId}`);
  console.log("\nE2E passed.\n");
}

main().catch((e) => {
  fail(e instanceof Error ? e.message : String(e));
});
