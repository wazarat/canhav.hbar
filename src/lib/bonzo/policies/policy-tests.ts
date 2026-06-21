/**
 * Bonzo vault policy tests — tsx runner (no vitest).
 *
 * Usage: pnpm bonzo:policy-test
 */
import { checkCounterparty } from "./allowed-counterparty";
import { decimalToBaseUnits } from "./decimal";
import { checkMacroGate } from "./macro-gate";
import { runPolicyGate } from "./policy-state";
import { computeMinAmountOut } from "./slippage";
import { checkSpendLimit } from "./spend-limit";
import { checkYieldFloor } from "./yield-floor";
import {
  makePolicyContext,
  makeProposedAction,
  makeStrategyConfig,
  UNKNOWN_TARGET,
  WHITELISTED_VAULT,
  WHITELISTED_TOKEN,
} from "./test-fixtures";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    return;
  }
  failed++;
  console.error(`  FAIL: ${message}`);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  const ok =
    typeof actual === "bigint" || typeof expected === "bigint"
      ? actual === expected
      : JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed++;
    console.error(`  FAIL: ${label}`);
    console.error(`    expected: ${String(expected)}`);
    console.error(`    actual:   ${String(actual)}`);
    return;
  }
  passed++;
}

function section(name: string): void {
  console.log(`\n${name}`);
}

// --- allowed-counterparty ---

function testAllowedCounterparty(): void {
  section("allowed-counterparty");

  const config = makeStrategyConfig();
  const ok = checkCounterparty(
    config,
    makeProposedAction({ target: WHITELISTED_VAULT })
  );
  assert(ok.allowed, "whitelisted vault passes");
  assertEqual(ok.reason, "whitelisted", "whitelisted reason");

  const bad = checkCounterparty(
    config,
    makeProposedAction({ target: UNKNOWN_TARGET })
  );
  assert(!bad.allowed, "unknown target rejected");
  assert(
    bad.reason.includes(UNKNOWN_TARGET),
    "rejection reason mentions target"
  );
}

// --- spend-limit ---

function testSpendLimit(): void {
  section("spend-limit");

  const config = makeStrategyConfig();
  const perTx = decimalToBaseUnits("100");
  const total = decimalToBaseUnits("1000");

  const overPerTx = checkSpendLimit(
    config,
    makeProposedAction({ amount: perTx + BigInt(1) }),
    makePolicyContext()
  );
  assert(overPerTx.allowed, "over per-tx is clamped not rejected");
  assertEqual(overPerTx.clampedAmount, perTx, "clamped to maxPerTransaction");

  const deployed = total - BigInt(5_000_000_000); // 50 USDC room left
  const overTotal = checkSpendLimit(
    config,
    makeProposedAction({ amount: perTx }),
    makePolicyContext({ deployedAmount: deployed })
  );
  assert(overTotal.allowed, "over total is clamped to room");
  assertEqual(
    overTotal.clampedAmount,
    BigInt(5_000_000_000),
    "clamped to remaining allocation"
  );

  const noRoom = checkSpendLimit(
    config,
    makeProposedAction({ amount: BigInt(1) }),
    makePolicyContext({ deployedAmount: total })
  );
  assert(!noRoom.allowed, "zero room rejects deposit");
  assertEqual(noRoom.reason, "total allocation reached", "zero room reason");

  const withdraw = checkSpendLimit(
    config,
    makeProposedAction({ kind: "WITHDRAW", amount: total * BigInt(2) }),
    makePolicyContext({ deployedAmount: total })
  );
  assert(withdraw.allowed, "withdraw skips spend limit");
}

// --- slippage ---

function testSlippage(): void {
  section("slippage");

  const amountIn = BigInt("1000000000000000000");
  const oracle = BigInt("1000000000000000000");

  assertEqual(
    computeMinAmountOut(amountIn, oracle, 0.1),
    BigInt("999000000000000000"),
    "0.1% slippage min out"
  );
  assertEqual(
    computeMinAmountOut(amountIn, oracle, 0.5),
    BigInt("995000000000000000"),
    "0.5% slippage min out"
  );
  assertEqual(
    computeMinAmountOut(amountIn, oracle, 1.0),
    BigInt("990000000000000000"),
    "1.0% slippage min out"
  );
}

// --- yield-floor ---

function testYieldFloor(): void {
  section("yield-floor");

  const config = makeStrategyConfig();
  const above = checkYieldFloor(config, makePolicyContext({ netAPY: 10 }));
  assert(above.allowed, "APY above floor passes");

  const below = checkYieldFloor(config, makePolicyContext({ netAPY: 3 }));
  assert(!below.allowed, "APY below floor rejected");
  assertEqual(below.triggerEmergency, true, "TRIGGER_EMERGENCY_OVERRIDE sets flag");

  const pauseOnly = makeStrategyConfig({
    intelligentConstraints: {
      ...makeStrategyConfig().intelligentConstraints,
      yieldFloor: {
        minNetAPY: 5,
        actionOnBreach: "PAUSE_ONLY",
      },
    },
  });
  const pauseResult = checkYieldFloor(
    pauseOnly,
    makePolicyContext({ netAPY: 1 })
  );
  assert(!pauseResult.allowed, "pause-only still rejects");
  assertEqual(
    pauseResult.triggerEmergency,
    false,
    "PAUSE_ONLY does not trigger emergency"
  );
}

// --- macro-gate ---

function testMacroGate(): void {
  section("macro-gate");

  const config = makeStrategyConfig();
  const highVix = checkMacroGate(
    config,
    makeProposedAction({ kind: "DEPOSIT" }),
    makePolicyContext({ vix: 35 })
  );
  assert(!highVix.allowed, "VIX above threshold blocks deposit");
  assert(highVix.reason.includes("VIX"), "VIX reason");

  const harvestOk = checkMacroGate(
    config,
    makeProposedAction({ kind: "HARVEST" }),
    makePolicyContext({ vix: 35 })
  );
  assert(harvestOk.allowed, "VIX gate does not block harvest");

  const badNews = checkMacroGate(
    config,
    makeProposedAction({ kind: "REBALANCE" }),
    makePolicyContext({ newsNegative: true })
  );
  assert(!badNews.allowed, "negative news blocks rebalance");

  const disabled = makeStrategyConfig({
    intelligentConstraints: {
      ...makeStrategyConfig().intelligentConstraints,
      macroGating: {
        vixIndexTracked: false,
        vixMaxThreshold: 30,
        newsSentimentFilterEnabled: false,
      },
    },
  });
  const clear = checkMacroGate(
    disabled,
    makeProposedAction({ kind: "DEPOSIT" }),
    makePolicyContext({ vix: 99, newsNegative: true })
  );
  assert(clear.allowed, "disabled macro toggles pass");
}

// --- policy-state / runPolicyGate ---

function testPolicyGate(): void {
  section("policy-state");

  const config = makeStrategyConfig();
  const badTarget = runPolicyGate(
    config,
    makeProposedAction({ target: UNKNOWN_TARGET }),
    makePolicyContext()
  );
  assert(!badTarget.allowed, "counterparty rejects before spend limit");
  assert(
    badTarget.reason.includes("whitelist"),
    "counterparty short-circuits first"
  );

  const perTx = decimalToBaseUnits("100");
  const action = makeProposedAction({ amount: perTx + BigInt(1) });
  const clamped = runPolicyGate(config, action, makePolicyContext());
  assert(clamped.allowed, "gate passes after clamp");
  assertEqual(action.amount, perTx, "clamp propagates to action object");

  const macroBlock = runPolicyGate(
    config,
    makeProposedAction({ kind: "DEPOSIT", amount: BigInt(1) }),
    makePolicyContext({ vix: 50 })
  );
  assert(!macroBlock.allowed, "macro gate rejects after counterparty+spend");
}

function testYieldFloorInGate(): void {
  section("policy-state yield-floor integration");

  const config = makeStrategyConfig();
  const result = runPolicyGate(
    config,
    makeProposedAction(),
    makePolicyContext({ netAPY: 2 })
  );
  assert(!result.allowed, "yield floor rejects in full gate");
  assertEqual(result.triggerEmergency, true, "gate propagates triggerEmergency");
}

async function runAsyncTests(): Promise<void> {
  await testEmergencyAsync();
}

async function testEmergencyAsync(): Promise<void> {
  section("emergency");

  const { runEmergency } = await import("./emergency");
  const configPause = makeStrategyConfig({
    emergencyOverride: { mode: "PAUSE_AND_NOTIFY", fallbackAsset: "USDC" },
  });
  const configExit = makeStrategyConfig({
    emergencyOverride: { mode: "EXIT_TO_STABLE", fallbackAsset: "USDC" },
  });

  const mockAdapter = {
    pause: async () => ({ txId: "mock-pause-1" }),
    panic: async () => ({ txId: "mock-panic-1" }),
    withdrawFromVault: async () => ({ txId: "mock-withdraw-1" }),
  } as unknown as import("../vault-adapter.types").IVaultAdapter;

  const pauseResult = await runEmergency(
    configPause,
    mockAdapter,
    {
      vaultAddress: WHITELISTED_VAULT,
      strategyEvm: WHITELISTED_TOKEN,
      userShares: BigInt(1000),
    }
  );
  assert(pauseResult.isPaused, "PAUSE_AND_NOTIFY sets paused");
  assertEqual(pauseResult.decision, "EMERGENCY_PAUSE", "pause decision");
  assert(!pauseResult.exited, "pause does not exit");

  const exitResult = await runEmergency(
    configExit,
    mockAdapter,
    {
      vaultAddress: WHITELISTED_VAULT,
      strategyEvm: WHITELISTED_TOKEN,
      userShares: BigInt(1000),
    }
  );
  assert(exitResult.exited, "EXIT_TO_STABLE exits");
  assertEqual(exitResult.decision, "EMERGENCY_EXIT", "exit decision");
  assert(exitResult.txIds.length >= 1, "exit collects tx ids");
}

function main(): void {
  console.log("Bonzo vault policy tests\n");

  testAllowedCounterparty();
  testSpendLimit();
  testSlippage();
  testYieldFloor();
  testMacroGate();
  testPolicyGate();
  testYieldFloorInGate();

  runAsyncTests().then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  });
}

main();
