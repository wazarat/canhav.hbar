import type { StrategyConfig } from "../strategy-config.schema";
import type { ProposedAction, PolicyResult } from "./types";

export function checkCounterparty(
  config: StrategyConfig,
  action: ProposedAction
): PolicyResult {
  const ok =
    config.deterministicPolicies.whitelistVaults.includes(action.target) ||
    config.deterministicPolicies.whitelistTokens.includes(action.target);
  return ok
    ? { allowed: true, reason: "whitelisted" }
    : { allowed: false, reason: `target ${action.target} not in whitelist` };
}
