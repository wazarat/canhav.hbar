# HBAR Skills — LP Health Check (M4)

Capability: Read-only position risk report — health factor, utilization, and impermanent-loss exposure notes.

## Intake schema

```json
{
  "positions": [
    {
      "protocol": "Bonzo" | "SaucerSwap",
      "asset": "HBAR",
      "suppliedUsd": 1000,
      "borrowedUsd": 500,
      "lpPair": ["HBAR", "USDC"]
    }
  ],
  "alertThreshold": 1.2
}
```

- `positions` (required): user position descriptions
- `alertThreshold` (optional): health factor below which to flag; default 1.2

## Price

1 testnet HBAR per task run (x402 pay-per-call).

## Policy defaults

- `taskType`: read (auto-approves below threshold)
- Per-task cap: 5 HBAR
- Daily budget: 20 HBAR
- Auto-approve below: 2 HBAR
- Counterparty: ERC-8004 registered agent with sufficient reputation

## Tools (read-only + payment)

- `bonzo_market_data_tool` — Bonzo reserve data (liquidation_threshold, ltv, utilization)
- `hbar_stub_pay` — task purchase (policy-gated)

## Output

Structured JSON report (`LpHealthReport`) with per-position health factors and flagged positions.
