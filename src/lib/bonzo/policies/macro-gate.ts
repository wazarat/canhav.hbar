import type { StrategyConfig } from "../strategy-config.schema";
import type { PolicyContext, PolicyResult, ProposedAction } from "./types";

export function checkMacroGate(
  config: StrategyConfig,
  action: ProposedAction,
  ctx: PolicyContext
): PolicyResult {
  const g = config.intelligentConstraints.macroGating;

  if (g.vixIndexTracked && ctx.vix !== undefined && ctx.vix > g.vixMaxThreshold) {
    if (action.kind === "DEPOSIT" || action.kind === "REBALANCE") {
      return {
        allowed: false,
        reason: `VIX ${ctx.vix} > ${g.vixMaxThreshold}`,
      };
    }
  }

  if (g.newsSentimentFilterEnabled && ctx.newsNegative) {
    if (action.kind === "DEPOSIT" || action.kind === "REBALANCE") {
      return { allowed: false, reason: "negative news sentiment" };
    }
  }

  return { allowed: true, reason: "macro clear" };
}
