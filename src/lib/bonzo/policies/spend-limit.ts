import type { StrategyConfig } from "../strategy-config.schema";
import { decimalToBaseUnits } from "./decimal";
import type { PolicyContext, PolicyResult, ProposedAction } from "./types";

export function checkSpendLimit(
  config: StrategyConfig,
  action: ProposedAction,
  ctx: PolicyContext
): PolicyResult {
  if (action.kind !== "DEPOSIT") {
    return { allowed: true, reason: "n/a" };
  }

  const perTx = decimalToBaseUnits(
    config.deterministicPolicies.spendLimits.maxPerTransaction
  );
  const total = decimalToBaseUnits(
    config.deterministicPolicies.spendLimits.maxTotalAllocation
  );

  let amount = action.amount;
  if (amount > perTx) {
    amount = perTx;
  }

  if (ctx.deployedAmount + amount > total) {
    const room = total - ctx.deployedAmount;
    if (room <= BigInt(0)) {
      return { allowed: false, reason: "total allocation reached" };
    }
    amount = room;
  }

  return {
    allowed: true,
    clampedAmount: amount !== action.amount ? amount : undefined,
    reason: "within limits",
  };
}
