import type { Plugin } from "@hashgraph/hedera-agent-kit";
import { pythPlugin } from "hak-pyth-plugin";
import { hbarStubPlugin } from "./x402/pay";
import { bonzoReadonlyPlugin } from "./plugins/bonzo-readonly";
import { saucerswapExecutorPlugin } from "./plugins/saucerswap";
import { stubAgentConfig } from "../agents/stub/config";
import { yieldScoutAgentConfig } from "../agents/yield-scout/config";
import { swapExecutorAgentConfig } from "../agents/swap-executor/config";
import type { BudgetConfig } from "./policy-state";

export type HbarAgentId = "stub" | "yield-scout" | "swap-executor";

export interface AgentConfigBundle {
  id: HbarAgentId;
  name: string;
  taskType: string;
  taskPriceHbar: number;
}

const TASK_PRICES: Record<HbarAgentId, number> = {
  stub: 1,
  "yield-scout": 1,
  "swap-executor": 1,
};

export function getAgentConfig(agentId: HbarAgentId): AgentConfigBundle {
  const config =
    agentId === "yield-scout"
      ? yieldScoutAgentConfig
      : agentId === "swap-executor"
        ? swapExecutorAgentConfig
        : stubAgentConfig;
  return {
    id: agentId,
    name: config.name,
    taskType: config.taskType,
    taskPriceHbar: TASK_PRICES[agentId],
  };
}

export function getPluginsForAgent(
  agentId: HbarAgentId,
  extra?: Plugin[]
): Plugin[] {
  const base: Plugin[] =
    agentId === "yield-scout"
      ? [hbarStubPlugin, bonzoReadonlyPlugin, pythPlugin]
      : agentId === "swap-executor"
        ? [hbarStubPlugin, saucerswapExecutorPlugin]
        : [hbarStubPlugin];

  return [...base, ...(extra ?? [])];
}

export function buildSystemPrompt(
  agentId: HbarAgentId,
  budget: BudgetConfig
): string {
  if (agentId === "yield-scout") {
    return buildYieldScoutSystemPrompt(budget);
  }
  if (agentId === "swap-executor") {
    return buildSwapExecutorSystemPrompt(budget);
  }
  return buildStubSystemPrompt(budget);
}

export function buildStubSystemPrompt(budget: BudgetConfig): string {
  return `You are the HBAR Skills stub agent on Hedera testnet.

Your job: when the user asks to run the stub task, call the hbar_stub_pay tool to pay exactly 1 HBAR for the task.

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
5. Call hbar_stub_pay with amountHbar=1 to purchase the task (policy-gated)
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

export function buildSwapExecutorSystemPrompt(budget: BudgetConfig): string {
  return `You are Swap Executor, an HBAR Skills write agent on Hedera testnet that executes token swaps on SaucerSwap.

Your job when the user describes a swap intent:
1. Parse intake: { tokenIn, tokenOut, amountIn, maxSlippagePct (default 0.5) }
2. Call saucerswap_get_swap_quote with fromToken=tokenIn, toToken=tokenOut, amount=amountIn as string, slippageTolerance=maxSlippagePct
3. If the quote fails, price impact exceeds maxSlippagePct, or the quote looks stale, STOP and explain — do NOT pay or swap
4. Call hbar_stub_pay with amountHbar=1 to purchase the task (policy-gated; write tasks always require approval)
5. Call saucerswap_swap_tokens with the same tokens, amount, and slippageTolerance (policy-gated; requires human approval before execution)
6. Return ONLY valid JSON matching this schema (no markdown, no prose outside JSON):
{
  "summary": "one-line swap result",
  "tokenIn": "HBAR",
  "tokenOut": "SAUCE",
  "amountIn": 10,
  "amountOut": "123.45",
  "expectedAmountOut": "124.0",
  "priceImpact": 0.12,
  "route": ["HBAR", "SAUCE"],
  "maxSlippagePct": 0.5,
  "swapTxId": "<hedera tx id from swap tool>",
  "completedAt": "<ISO8601>"
}

Policy constraints (enforced automatically):
- Per-task cap: ${budget.perTaskCapHbar} HBAR
- Daily budget: ${budget.dailyBudgetHbar} HBAR
- Write task: human approval required for BOTH payment and swap execution
- SlippagePolicy blocks swaps that exceed maxSlippagePct

Never use mainnet. Reject stale quotes. Never swap without a fresh quote.`;
}
