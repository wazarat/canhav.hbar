# HBAR Skills — Bonzo Vault Strategist (M5)

Capability: Survey-driven Bonzo vault keeper with deterministic policy gates, LLM proposals only, and HCS audit trail.

## Flow

1. **Survey** — `/agents/bonzo-vault` (5 pillars → `StrategyConfig`)
2. **Provision** — `POST /api/agents/bonzo-vault/provision` persists `strategies` + `vault_policy_state`
3. **Keeper run** — `POST /api/agents/bonzo-vault/run` with `{ strategyId }` (DB uuid or `strat_bonzo_…`)

Alternate runtime entry: `POST /api/hbar/run` with `{ agentId: "bonzo-vault-strategist", strategyId }`.

## Intake (keeper run)

```json
{
  "strategyId": "<db-uuid-or-strat_bonzo_id>"
}
```

## Price

0.01 testnet HBAR optional keeper fee per run (`BONZO_VAULT_KEEPER_FEE_HBAR`, policy-gated when using x402 path).

## Policy defaults

- `taskType`: write (keeper may deposit/withdraw/harvest when gate allows)
- Per-task cap: 1 HBAR
- Daily budget: 10 HBAR
- Auto-approve below: 0.05 HBAR
- Deterministic vault policies in `src/lib/bonzo/policies/` gate every proposed action before adapter execution

## Pipeline (one keeper iteration)

Sentinel (vault health, APY, VIX/news) → Strategist LLM proposes action → `runPolicyGate` → adapter (mock|dry-run|chain) → HCS audit on `HBAR_AUDIT_TOPIC_ID`

## Output

Structured JSON (`BonzoVaultRunReport`): `decision`, `txId`, `hcsTxId`, `hashScanTopicUrl`, `hashScanTxUrl`.

## Skills reference

Full vault mechanics and env vars: `public/skills/defi/bonzo-vaults.SKILL.md`
