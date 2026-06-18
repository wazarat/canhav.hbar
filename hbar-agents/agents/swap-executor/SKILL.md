# HBAR Skills — Swap Executor (M3)

Capability: Execute a token swap on SaucerSwap (Hedera testnet) within a user-defined slippage bound, behind a human approval gate.

## Intake schema

```json
{
  "tokenIn": "HBAR",
  "tokenOut": "SAUCE",
  "amountIn": 10,
  "maxSlippagePct": 0.5
}
```

- `tokenIn` (required): token id or symbol (e.g. `"HBAR"`)
- `tokenOut` (required): token id or symbol (e.g. `"SAUCE"`)
- `amountIn` (required): amount of tokenIn to swap
- `maxSlippagePct` (optional): maximum slippage tolerance in percent (default 0.5)

## Price

1 testnet HBAR per task run (x402 pay-per-call).

## Policy defaults

- `taskType`: **write** (ContextualApprovalPolicy requires human sign-off on payment and swap, regardless of amount)
- Per-task cap: 5 HBAR
- Daily budget: 20 HBAR
- Auto-approve below: 2 HBAR (overridden by write taskType)
- Counterparty: ERC-8004 registered agent with sufficient reputation

## Tools

- `saucerswap_get_swap_quote` — fetch quote, price impact, route
- `saucerswap_swap_tokens` — execute swap on SaucerSwap testnet (write — approval-gated)
- `hbar_stub_pay` — task purchase (policy-gated)

## Output

Structured JSON report (`SwapExecutionReport`) with swap tx hash, amounts, price impact, and route.
