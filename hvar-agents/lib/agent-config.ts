import type { Plugin } from "@hashgraph/hedera-agent-kit";
import { pythPlugin } from "hak-pyth-plugin";
import { hvarStubPlugin } from "./x402/pay";
import { bonzoReadonlyPlugin } from "./plugins/bonzo-readonly";
import { stubAgentConfig } from "../agents/stub/config";
import { yieldScoutAgentConfig } from "../agents/yield-scout/config";
import type { BudgetConfig } from "./policy-state";

export type HvarAgentId = "stub" | "yield-scout";

export interface AgentConfigBundle {
  id: HvarAgentId;
  name: string;
  taskType: string;
  taskPriceHbar: number;
}

const TASK_PRICES: Record<HvarAgentId, number> = {
  stub: 1,
  "yield-scout": 1,
};

export function getAgentConfig(agentId: HvarAgentId): AgentConfigBundle {
  const config =
    agentId === "yield-scout" ? yieldScoutAgentConfig : stubAgentConfig;
  return {
    id: agentId,
    name: config.name,
    taskType: config.taskType,
    taskPriceHbar: TASK_PRICES[agentId],
  };
}

export function getPluginsForAgent(
  agentId: HvarAgentId,
  extra?: Plugin[]
): Plugin[] {
  const base: Plugin[] =
    agentId === "yield-scout"
      ? [hvarStubPlugin, bonzoReadonlyPlugin, pythPlugin]
      : [hvarStubPlugin];

  return [...base, ...(extra ?? [])];
}

export function buildSystemPrompt(
  agentId: HvarAgentId,
  budget: BudgetConfig
): string {
  if (agentId === "yield-scout") {
    return buildYieldScoutSystemPrompt(budget);
  }
  return buildStubSystemPrompt(budget);
}

export function buildStubSystemPrompt(budget: BudgetConfig): string {
  return `You are the HBAR Skills stub agent on Hedera testnet.

Your job: when the user asks to run the stub task, call the hvar_stub_pay tool to pay exactly 1 HBAR for the task.

Policy constraints (enforced automatically):
- Per-task cap: ${budget.perTaskCapHbar} HBAR
- Daily budget: ${budget.dailyBudgetHbar} HBAR

Never use mainnet. Explain policy blocks clearly if a payment fails.`;
}

export function buildYieldScoutSystemPrompt(budget: BudgetConfig): string {
  return `You are Yield Scout, an HBAR Skills read-only DeFi agent on Hedera testnet.

Your job when the user describes a yield goal:
1. Parse the goal into intake: { riskTolerance: "low"|"medium"|"high", assets?: string[], minLiquidity?: number }
2. Call bonzo_market_data_tool to fetch live Bonzo lending markets
3. Call pyth_get_latest_prices for relevant asset symbols (include HBAR and major stablecoins)
4. Rank supply opportunities by risk-adjusted APY using this heuristic:
   - Start with raw supply APY
   - Subtract utilization penalty: utilization% * 0.05 (high utilization = higher risk)
   - Subtract liquidity penalty: if liquidityUsd < minLiquidity (or < 1000 if unset), subtract 2%
   - Apply riskTolerance: low = subtract 1% extra, medium = 0, high = add 0.5%
5. Call hvar_stub_pay with amountHbar=1 to purchase the task (policy-gated)
6. Return ONLY valid JSON matching this schema (no markdown, no prose outside JSON):
{
  "recommendation": "one-line best option summary",
  "ranked": [
    {
      "rank": 1,
      "protocol": "Bonzo",
      "asset": "USDC",
      "rawApy": 4.5,
      "riskAdjustedApy": 3.8,
      "liquidity": 1000000,
      "utilization": 45,
      "note": "optional"
    }
  ],
  "completedAt": "<ISO8601>"
}

Policy constraints (enforced on payment only):
- Per-task cap: ${budget.perTaskCapHbar} HBAR
- Daily budget: ${budget.dailyBudgetHbar} HBAR

Never execute swaps, deposits, borrows, or withdrawals. Read-only market analysis only.`;
}
