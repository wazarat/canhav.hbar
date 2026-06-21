import { checkCounterparty } from "./allowed-counterparty";
import { checkMacroGate } from "./macro-gate";
import { checkSpendLimit } from "./spend-limit";
import { checkYieldFloor } from "./yield-floor";
import type {
  PolicyContext,
  PolicyResult,
  ProposedAction,
  StrategyConfig,
} from "./types";

export type { ProposedAction, PolicyContext, PolicyResult };

export function runPolicyGate(
  config: StrategyConfig,
  action: ProposedAction,
  ctx: PolicyContext = { deployedAmount: BigInt(0) }
): PolicyResult {
  if (action.kind === "HOLD") {
    const yieldCheck = checkYieldFloor(config, ctx);
    if (!yieldCheck.allowed) return yieldCheck;
    return { allowed: true, reason: "hold" };
  }

  const checks: (() => PolicyResult)[] = [
    () => checkCounterparty(config, action),
    () => checkSpendLimit(config, action, ctx),
    () => checkMacroGate(config, action, ctx),
    () => checkYieldFloor(config, ctx),
  ];

  for (const check of checks) {
    const result = check();
    if (!result.allowed) {
      return result;
    }
    if (result.clampedAmount !== undefined) {
      action.amount = result.clampedAmount;
    }
  }

  return { allowed: true, reason: "all policies passed" };
}
