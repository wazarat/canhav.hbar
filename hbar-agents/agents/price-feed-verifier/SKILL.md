# HBAR Skills — Price-Feed Verifier (M4)

Capability: Cross-check SaucerSwap pool-implied price against Pyth oracle and flag divergence.

## Intake schema

```json
{
  "baseToken": "HBAR",
  "quoteToken": "USDC",
  "referenceAmount": 1,
  "divergenceBps": 50
}
```

- `baseToken` / `quoteToken` (required): token pair to verify
- `referenceAmount` (optional): amount for SaucerSwap quote; default 1
- `divergenceBps` (optional): alert threshold in basis points; default 50

## Price

1 testnet HBAR per task run (x402 pay-per-call).

## Policy defaults

- `taskType`: read (auto-approves below threshold)
- Per-task cap: 5 HBAR
- Daily budget: 20 HBAR
- Auto-approve below: 2 HBAR

## Tools (read-only + payment)

- `saucerswap_get_swap_quote` — derive pool-implied price (READ ONLY)
- `pyth_get_latest_prices` — Pyth oracle reference price
- `hbar_stub_pay` — task purchase (policy-gated)

**Never** call `saucerswap_swap_tokens`.

## Output

Structured JSON report (`PriceVerifierReport`) with divergence bps and verdict.
