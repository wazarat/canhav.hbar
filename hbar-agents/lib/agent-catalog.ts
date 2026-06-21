import { isSaucerSwapConfigured } from "./env";

export const AGENT_CATALOG = [
  {
    id: "yield-scout",
    name: "Yield Scout",
    description: "Best risk-adjusted APY across Bonzo lending + HBAR",
    status: "active" as const,
    milestone: "M2",
  },
  {
    id: "swap-executor",
    name: "Swap Executor",
    description: "Quote + execute swaps within slippage bounds",
    status: "active" as const,
    milestone: "M3",
  },
  {
    id: "lp-health",
    name: "LP Health Check",
    description: "Position risk report (health factor, IL exposure)",
    status: "active" as const,
    milestone: "M4",
  },
  {
    id: "liquidation-watch",
    name: "Liquidation Watch",
    description: "Scan positions eligible for liquidation",
    status: "coming_soon" as const,
    milestone: "M4",
  },
  {
    id: "portfolio-rebalancer",
    name: "Portfolio Rebalancer",
    description: "Plan priced actions to hit target allocation",
    status: "coming_soon" as const,
    milestone: "M4",
  },
  {
    id: "price-feed-verifier",
    name: "Price-Feed Verifier",
    description: "Cross-check pool price vs Pyth oracle",
    status: "active" as const,
    milestone: "M4",
  },
  {
    id: "stub",
    name: "Policy Stub",
    description: "Pay 1 testnet HBAR for a mock task — exercises policy layer",
    status: "active" as const,
    milestone: "M1",
  },
  {
    id: "bonzo-vault-strategist",
    name: "Bonzo Vault Strategist",
    description:
      "Survey-driven vault keeper: policy-gated deposits, harvests, and emergency actions with HCS audit",
    capabilities: [
      "strategy-survey",
      "policy-gate",
      "keeper-run",
      "hcs-audit",
    ] as const,
    status: "active" as const,
    milestone: "M5",
  },
] as const;

export const SAUCERSWAP_DEPENDENT_AGENT_IDS = [
  "swap-executor",
  "price-feed-verifier",
] as const;

const SAUCERSWAP_UNAVAILABLE_SUFFIX =
  " — demo unavailable: SaucerSwap API key pending";

export type AgentCatalogEntry = (typeof AGENT_CATALOG)[number];

export type MergedCatalogEntry = {
  id: string;
  name: string;
  description: string;
  status: "active" | "coming_soon";
  milestone?: string;
  capabilities?: readonly string[];
  isCustom?: boolean;
};

export function getResolvedAgentCatalog(): MergedCatalogEntry[] {
  const saucerAvailable = isSaucerSwapConfigured();

  return AGENT_CATALOG.map((entry) => {
    if (
      !saucerAvailable &&
      (SAUCERSWAP_DEPENDENT_AGENT_IDS as readonly string[]).includes(entry.id)
    ) {
      return {
        id: entry.id,
        name: entry.name,
        description: `${entry.description}${SAUCERSWAP_UNAVAILABLE_SUFFIX}`,
        status: "coming_soon" as const,
        milestone: entry.milestone,
        ...("capabilities" in entry && entry.capabilities
          ? { capabilities: entry.capabilities }
          : {}),
      };
    }

    return {
      id: entry.id,
      name: entry.name,
      description: entry.description,
      status: entry.status,
      milestone: entry.milestone,
      ...("capabilities" in entry && entry.capabilities
        ? { capabilities: entry.capabilities }
        : {}),
    };
  });
}
