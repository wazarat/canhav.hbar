import OpenAI from "openai";
import type { StrategyConfig } from "@/lib/bonzo/strategy-config.schema";
import { decimalToBaseUnits } from "@/lib/bonzo/policies/decimal";
import type { ActionKind, ProposedAction } from "@/lib/bonzo/policies/types";

const STRATEGIST_PROMPT = `You are the CanHav Bonzo Vault Strategist.
Given vault health, current net APY, oracle prices, and optional macro signals,
choose EXACTLY ONE action: HOLD | HARVEST | REBALANCE | PARTIAL_EXIT | EMERGENCY.
You may ONLY propose. Deterministic policies will validate or reject your choice.
Respect the user's StrategyConfig. Output strict JSON: { "action": "...", "amount": "<assets|shares>", "rationale": "..." }.`;

export interface StrategistInput {
  config: StrategyConfig;
  observations: {
    pricePerFullShare: string;
    netAPY: number;
    userShares: string;
    vix?: number;
    newsNegative?: boolean;
  };
}

export interface StrategistProposal {
  action: string;
  amount: string;
  rationale: string;
}

const ACTION_MAP: Record<string, ActionKind> = {
  HOLD: "HOLD",
  HARVEST: "HARVEST",
  REBALANCE: "REBALANCE",
  PARTIAL_EXIT: "WITHDRAW",
  EMERGENCY: "EMERGENCY",
  DEPOSIT: "DEPOSIT",
  WITHDRAW: "WITHDRAW",
};

function parseProposalAmount(amount: string): bigint {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === "0") return BigInt(0);
  if (/^\d+$/.test(trimmed)) return BigInt(trimmed);
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return decimalToBaseUnits(trimmed);
  }
  return BigInt(0);
}

/** Map LLM proposal to deterministic policy action shape. */
export function proposalToAction(
  proposal: StrategistProposal,
  vaultAddress: string
): ProposedAction {
  const normalized = proposal.action.toUpperCase().replace(/\s+/g, "_");
  const kind = ACTION_MAP[normalized] ?? "HOLD";

  return {
    kind,
    target: vaultAddress,
    amount: kind === "HOLD" ? BigInt(0) : parseProposalAmount(proposal.amount),
  };
}

/** LLM strategist step — proposes only; policies dispose before any chain tx. */
export async function runBonzoVaultAgent(
  input: StrategistInput
): Promise<StrategistProposal> {
  if (!process.env.OPENAI_API_KEY) {
    const cadence = input.config.deterministicPolicies.execution.harvestCadenceMinutes;
    const defaultAction =
      input.observations.netAPY >=
      input.config.intelligentConstraints.yieldFloor.minNetAPY
        ? "HARVEST"
        : "HOLD";
    return {
      action: defaultAction,
      amount: "0",
      rationale: `OPENAI_API_KEY not configured — defaulting to ${defaultAction} (cadence ${cadence}m)`,
    };
  }

  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: STRATEGIST_PROMPT },
      { role: "user", content: JSON.stringify(input) },
    ],
  });

  const content = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content) as StrategistProposal;
}
