# HBAR Skills — Yield Scout (M2)

Capability: Find the best risk-adjusted yield across Bonzo lending markets on Hedera.

## Intake schema

```json
{
  "riskTolerance": "low" | "medium" | "high",
  "assets": ["HBAR", "USDC"],
  "minLiquidity": 1000
}
```

- `riskTolerance` (required): user risk appetite
- `assets` (optional): filter to specific symbols
- `minLiquidity` (optional): minimum liquidity floor in USD

## Price

1 testnet HBAR per task run (x402 pay-per-call).

## Policy defaults

- `taskType`: read (auto-approves below threshold)
- Per-task cap: 5 HBAR
- Daily budget: 20 HBAR
- Auto-approve below: 2 HBAR
- Counterparty: ERC-8004 registered agent with sufficient reputation

## Tools (read-only + payment)

- `bonzo_market_data_tool` — live Bonzo lending markets
- `pyth_get_latest_prices` — Pyth price normalization
- `hbar_stub_pay` — task purchase (policy-gated)

## Output

Structured JSON report (`YieldScoutReport`) with ranked markets and a one-line recommendation.
