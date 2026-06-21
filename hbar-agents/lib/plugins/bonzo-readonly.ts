import { z } from "zod";
import {
  BaseTool,
  type Context,
  type Plugin,
} from "@hashgraph/hedera-agent-kit";
import type { Client } from "@hiero-ledger/sdk";

/** Tool name aligned with @bonzofinancelabs/hak-bonzo-plugin read-only market tool. */
export const BONZO_MARKET_DATA_TOOL = "bonzo_market_data_tool";

const BONZO_MARKET_API =
  "https://mainnet-data-staging.bonzo.finance/market";

interface BonzoReserveRaw {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  hts_address?: string;
  evm_address?: string;
  supply_apy: number;
  variable_borrow_apy: number;
  stable_borrow_apy: number;
  ltv: number;
  liquidation_threshold: number;
  liquidation_bonus: number;
  utilization_rate: number;
  total_liquidity_usd?: { usd_display: string };
  available_liquidity_usd?: { usd_display: string };
  total_debt_usd?: { usd_display: string };
  is_active: boolean | null;
  is_frozen: boolean | null;
  borrowing_enabled: boolean;
}

export interface BonzoReserveSummary {
  symbol: string;
  name: string;
  supplyApy: number;
  variableBorrowApy: number;
  utilization: number;
  liquidityUsd: number;
  totalLiquidityUsd: number;
  isActive: boolean;
}

function parseUsd(value?: { usd_display?: string }): number {
  if (!value?.usd_display) return 0;
  const parsed = parseFloat(value.usd_display.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchBonzoReserves(): Promise<BonzoReserveSummary[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(BONZO_MARKET_API, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "HBAR-Skills-YieldScout/1.0",
      },
    });
    if (!response.ok) {
      throw new Error(`Bonzo API ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json()) as { reserves: BonzoReserveRaw[] };
    return (data.reserves ?? [])
      .filter((r) => (r.is_active ?? true) && !(r.is_frozen ?? false))
      .map((r) => ({
        symbol: r.symbol,
        name: r.name,
        supplyApy: r.supply_apy,
        variableBorrowApy: r.variable_borrow_apy,
        utilization: r.utilization_rate,
        liquidityUsd: parseUsd(r.available_liquidity_usd),
        totalLiquidityUsd: parseUsd(r.total_liquidity_usd),
        isActive: r.is_active ?? true,
      }));
  } finally {
    clearTimeout(timeoutId);
  }
}

const marketSchema = z.object({});

type MarketParams = z.infer<typeof marketSchema>;

export class BonzoMarketDataTool extends BaseTool<MarketParams, MarketParams> {
  method = BONZO_MARKET_DATA_TOOL;
  name = "Bonzo Market Data";
  description =
    "Fetch live Bonzo Finance lending market data: supply/borrow APYs, liquidity, and utilization for all active reserves.";
  parameters = marketSchema;

  async normalizeParams(
    params: MarketParams,
    _context: Context,
    _client: Client
  ): Promise<MarketParams> {
    return marketSchema.parse(params);
  }

  async coreAction(
    _params: MarketParams,
    _context: Context,
    _client: Client
  ): Promise<{ reserves: BonzoReserveSummary[] }> {
    const reserves = await fetchBonzoReserves();
    return { reserves };
  }

  async shouldSecondaryAction(): Promise<boolean> {
    return true;
  }

  async secondaryAction(
    result: { reserves: BonzoReserveSummary[] },
    _client: Client,
    _context: Context
  ): Promise<{ raw: unknown; humanMessage: string }> {
    return {
      raw: result,
      humanMessage: JSON.stringify(result, null, 2),
    };
  }

  async handleError(error: unknown, _context: Context) {
    const message =
      error instanceof Error ? error.message : "Bonzo market fetch failed";
    return { raw: { error: message }, humanMessage: message };
  }
}

/** v4-compatible read-only Bonzo plugin (market data only — no write tools). */
export const bonzoReadonlyPlugin: Plugin = {
  name: "bonzo-readonly",
  description: "Read-only Bonzo Finance market data for Yield Scout",
  tools: () => [new BonzoMarketDataTool()],
};
