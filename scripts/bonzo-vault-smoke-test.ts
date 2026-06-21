/**
 * Bonzo vault chain smoke test — clone → read pps → deposit → withdraw → harvest.
 *
 * Requires:
 * - HEDERA_OPERATOR_ID / HEDERA_OPERATOR_KEY
 * - BONZO_VAULT_FACTORY (or filled BONZO_INFRA.testnet.vaultFactory)
 * - BONZO_SMOKE_STRATEGY_EVM (strategy contract for initialize)
 * - Optional BONZO_SMOKE_VAULT_EVM (skip clone, use existing vault)
 * - Optional BONZO_SMOKE_DEPOSIT_AMOUNT (default 1000 smallest units)
 */
import {
  assertBonzoInfraConfigured,
  isBonzoInfraConfigured,
  resolveBonzoInfra,
} from "../src/lib/bonzo/bonzo-addresses";
import { getChainVaultAdapter } from "../src/lib/bonzo/vault-adapter";
import type { StrategyConfig } from "../src/lib/bonzo/strategy-config.schema";

function fail(msg: string): never {
  console.error(`\n[bonzo:vault-smoke] FAIL: ${msg}\n`);
  process.exit(1);
}

function ok(msg: string) {
  console.log(`[bonzo:vault-smoke] OK: ${msg}`);
}

function minimalConfig(vaultEvm: string, userId: string): StrategyConfig {
  return {
    strategyId: "strat_bonzo_smoke_test",
    userId,
    targetProtocol: "Bonzo Finance Vaults",
    vaultType: "SINGLE_ASSET_LENDING",
    status: "active",
    deterministicPolicies: {
      whitelistVaults: [vaultEvm],
      whitelistTokens: [vaultEvm],
      spendLimits: {
        maxTotalAllocation: "1000000",
        maxPerTransaction: "100000",
        denominatedAsset: "USDC",
      },
      execution: {
        maxSlippagePercent: 0.5,
        harvestCadenceMinutes: 120,
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
    emergencyOverride: { mode: "PAUSE_AND_NOTIFY", fallbackAsset: "USDC" },
  };
}

async function main() {
  console.log("\nBonzo vault smoke test\n");

  if (!process.env.HEDERA_OPERATOR_ID || !process.env.HEDERA_OPERATOR_KEY) {
    fail("HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY required");
  }

  if (!isBonzoInfraConfigured()) {
    fail(
      "Vault factory not configured. Set BONZO_VAULT_FACTORY in .env.local or fill BONZO_INFRA.testnet in bonzo-addresses.ts"
    );
  }

  assertBonzoInfraConfigured();
  const infra = resolveBonzoInfra();
  ok(`factory ${infra.vaultFactory}`);

  const strategyEvm = process.env.BONZO_SMOKE_STRATEGY_EVM?.trim();
  if (!strategyEvm) {
    fail(
      "BONZO_SMOKE_STRATEGY_EVM required (strategy EVM address for vault initialize)"
    );
  }

  const adapter = getChainVaultAdapter();
  const userId = process.env.HEDERA_OPERATOR_ID!;

  let vaultEvm = process.env.BONZO_SMOKE_VAULT_EVM?.trim();
  if (!vaultEvm) {
    console.log("Cloning vault via factory...");
    vaultEvm = await adapter.createVault({
      isCLM: false,
      strategyEvm,
      name: "SmokeVault",
      symbol: "smokeBVT",
      approvalDelay: 0,
      isHederaToken: false,
    });
    ok(`cloned vault ${vaultEvm}`);
  } else {
    ok(`using existing vault ${vaultEvm}`);
  }

  const config = minimalConfig(vaultEvm, userId);
  const depositAmount = BigInt(
    process.env.BONZO_SMOKE_DEPOSIT_AMOUNT ?? "1000000000000000000"
  );

  const before = await adapter.getVaultHealth(vaultEvm, BigInt(0));
  ok(`pps before ${before.pricePerFullShare.toString()}`);

  await adapter.ensureMockWantBalance(depositAmount);

  const dep = await adapter.depositToVault(config, vaultEvm, depositAmount);
  ok(`deposit tx ${dep.txId ?? "n/a"}`);

  const after = await adapter.getVaultHealth(vaultEvm, BigInt(0));
  ok(`pps after ${after.pricePerFullShare.toString()}`);

  const shares = adapter.assetsToShares(depositAmount, after.pricePerFullShare);
  if (shares > BigInt(0)) {
    const wd = await adapter.withdrawFromVault(config, vaultEvm, shares);
    ok(`withdraw tx ${wd.txId ?? "n/a"}`);
  }

  const hv = await adapter.harvest(config, strategyEvm);
  ok(`harvest tx ${hv.txId ?? "n/a"}`);

  console.log("\nSmoke test finished.\n");
}

main().catch((e) => {
  fail(e instanceof Error ? e.message : String(e));
});
