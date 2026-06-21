import type { StrategyConfig } from "../strategy-config.schema";
import { BONZO_RESERVES } from "../bonzo-addresses";
import type { PolicyContext, ProposedAction } from "./types";

const WHITELISTED_VAULT = BONZO_RESERVES.USDC.aToken;
const WHITELISTED_TOKEN = BONZO_RESERVES.USDC.token;
const UNKNOWN_TARGET = "0x000000000000000000000000000000000000dead";

export function makeStrategyConfig(
  overrides: Partial<StrategyConfig> = {}
): StrategyConfig {
  const base: StrategyConfig = {
    strategyId: "strat_bonzo_test0001",
    userId: "0.0.123456",
    targetProtocol: "Bonzo Finance Vaults",
    vaultType: "SINGLE_ASSET_LENDING",
    status: "active",
    deterministicPolicies: {
      whitelistVaults: [WHITELISTED_VAULT],
      whitelistTokens: [WHITELISTED_TOKEN],
      spendLimits: {
        maxTotalAllocation: "1000",
        maxPerTransaction: "100",
        denominatedAsset: "USDC",
      },
      execution: {
        maxSlippagePercent: 0.5,
        harvestCadenceMinutes: 120,
      },
    },
    intelligentConstraints: {
      yieldFloor: {
        minNetAPY: 5,
        actionOnBreach: "TRIGGER_EMERGENCY_OVERRIDE",
      },
      macroGating: {
        vixIndexTracked: true,
        vixMaxThreshold: 30,
        newsSentimentFilterEnabled: true,
      },
    },
    emergencyOverride: {
      mode: "PAUSE_AND_NOTIFY",
      fallbackAsset: "USDC",
    },
  };

  return {
    ...base,
    ...overrides,
    deterministicPolicies: {
      ...base.deterministicPolicies,
      ...overrides.deterministicPolicies,
      spendLimits: {
        ...base.deterministicPolicies.spendLimits,
        ...overrides.deterministicPolicies?.spendLimits,
      },
      execution: {
        ...base.deterministicPolicies.execution,
        ...overrides.deterministicPolicies?.execution,
      },
    },
    intelligentConstraints: {
      ...base.intelligentConstraints,
      ...overrides.intelligentConstraints,
      yieldFloor: {
        ...base.intelligentConstraints.yieldFloor,
        ...overrides.intelligentConstraints?.yieldFloor,
      },
      macroGating: {
        ...base.intelligentConstraints.macroGating,
        ...overrides.intelligentConstraints?.macroGating,
      },
    },
    emergencyOverride: {
      ...base.emergencyOverride,
      ...overrides.emergencyOverride,
    },
  };
}

export function makeProposedAction(
  overrides: Partial<ProposedAction> = {}
): ProposedAction {
  return {
    kind: "DEPOSIT",
    target: WHITELISTED_VAULT,
    amount: BigInt(10_000_000_000), // 100 USDC @ 8 dp
    ...overrides,
  };
}

export function makePolicyContext(
  overrides: Partial<PolicyContext> = {}
): PolicyContext {
  return {
    deployedAmount: BigInt(0),
    oraclePrice18: BigInt("1000000000000000000"),
    netAPY: 10,
    vix: 20,
    newsNegative: false,
    ...overrides,
  };
}

export {
  WHITELISTED_VAULT,
  WHITELISTED_TOKEN,
  UNKNOWN_TARGET,
};
