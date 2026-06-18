# HVAR Stub Agent (M1)

Capability: pay-per-call stub task purchase on Hedera testnet.

## Intake

User describes wanting to run the stub task or test the policy layer.

## Price

1 testnet HBAR per invocation.

## Policy defaults

- Per-task cap: 2 HBAR
- Daily budget: 10 HBAR
- Auto-approve below: 0.5 HBAR (stub payment requires approval at 1 HBAR)
- Counterparty: static allowlist (stub worker + operator)

## Tool

`hvar_stub_pay` — x402-style payment gated by SpendLimit, AllowedCounterparty, and ContextualApproval policies.
