import type { StrategyConfig } from "../strategy-config.schema";
import type { PolicyContext, PolicyResult } from "./types";

export function checkYieldFloor(
  config: StrategyConfig,
  ctx: PolicyContext
): PolicyResult {
  if (ctx.netAPY === undefined) {
    return { allowed: true, reason: "apy unknown" };
  }

  const floor = config.intelligentConstraints.yieldFloor.minNetAPY;
  if (ctx.netAPY < floor) {
    const actionOnBreach =
      config.intelligentConstraints.yieldFloor.actionOnBreach;
    return {
      allowed: false,
      reason: `netAPY ${ctx.netAPY}% < floor ${floor}%`,
      triggerEmergency:
        actionOnBreach === "TRIGGER_EMERGENCY_OVERRIDE",
    };
  }

  return { allowed: true, reason: "above floor" };
}
