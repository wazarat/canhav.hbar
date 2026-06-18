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
    name: "Policy Stub (M1)",
    description: "Pay 1 testnet HBAR for a mock task — exercises policy layer",
    status: "active" as const,
    milestone: "M1",
  },
] as const;

export type AgentCatalogEntry = (typeof AGENT_CATALOG)[number];

export type MergedCatalogEntry = {
  id: string;
  name: string;
  description: string;
  status: "active" | "coming_soon";
  milestone?: string;
  isCustom?: boolean;
};
