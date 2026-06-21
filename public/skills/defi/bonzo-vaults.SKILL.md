# Bonzo Vault Strategy Agent

Autonomous keeper for Bonzo Finance yield vaults on Hedera. The LLM **proposes** actions; deterministic policies in `src/lib/bonzo/policies/` **dispose** before any chain transaction.

## End-to-end path

| Step | UI / API | Result |
|------|----------|--------|
| 1. Survey | `/agents/bonzo-vault` | Validated `StrategyConfig` (5 pillars) |
| 2. Provision | `POST /api/agents/bonzo-vault/provision` | DB rows + HCS `bonzo_vault.provisioned` |
| 3. Keeper | `POST /api/agents/bonzo-vault/run` | `strategy_runs` row + HCS `bonzo_vault.run` |

`strategyId` in run requests accepts either the DB uuid (`dbId`) or the config id (`strat_bonzo_…`).

## StrategyConfig pillars

1. **Asset & target** — `vaultType`, `whitelistVaults[]`, `whitelistTokens[]`
2. **Capital guardrails** — `deterministicPolicies.spendLimits`
3. **Yield floor & slippage** — `intelligentConstraints.yieldFloor`, `execution.maxSlippagePercent`, `harvestCadenceMinutes`
4. **Macro toggles** — `intelligentConstraints.macroGating` (VIX, news sentiment)
5. **Emergency** — `emergencyOverride.mode` (`PAUSE_AND_NOTIFY` | `EXIT_TO_STABLE`)

Schema: `src/lib/bonzo/strategy-config.schema.ts`

## Policy gate order

1. Allowed counterparty (vault/token whitelist)
2. Spend limits (per-tx clamp, total allocation)
3. Slippage (`computeMinAmountOut`)
4. Yield floor (may set `triggerEmergency`)
5. Macro gate (VIX, news)

Run tests: `pnpm bonzo:policy-test`

## Keeper pipeline

```
Sentinel → Strategist (bonzo-vault-agent.ts) → runPolicyGate → IVaultAdapter → Auditor
```

- **Sentinel:** `getVaultHealth`, `getStrategyApy`, Bonzo lending APY cross-check, VIX/news signals
- **Strategist:** proposes `DEPOSIT` | `WITHDRAW` | `HARVEST` | `HOLD` | emergency
- **Executor:** `getVaultAdapter()` — `mock` (MVP default), `dry-run`, or `chain` (Phase 2)
- **Auditor:** `strategy_runs` insert, `vault_policy_state` update, HCS on global `HBAR_AUDIT_TOPIC_ID`

Idempotency: skips harvest if `lastHarvestAt` within `harvestCadenceMinutes`.

## HashScan visibility (MVP)

Vault deposit/withdraw/harvest may be **mock or dry-run**. Real testnet txs for demo:

- HCS messages on `HBAR_AUDIT_TOPIC_ID` (provision + each keeper run)
- Optional 0.01 HBAR keeper fee (`BONZO_VAULT_KEEPER_FEE_HBAR`) → `hashScanTxUrl`

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Strategies + runs persistence |
| `BONZO_VAULT_ADAPTER_MODE` | `mock` \| `dry-run` \| `chain` (default `mock`) |
| `HBAR_AUDIT_TOPIC_ID` | Global HCS audit topic |
| `HEDERA_OPERATOR_ID` / `HEDERA_OPERATOR_KEY` | HCS + optional keeper fee |
| `CRON_SECRET` | Protect run route when set |
| `OPENAI_API_KEY` | Strategist LLM |

**Production demo:** https://www.hbarskills.com/agents/bonzo-vault (`BONZO_VAULT_ADAPTER_MODE=mock` on Vercel Production)

## API examples

```bash
# Provision (after survey compiles StrategyConfig JSON)
curl -X POST http://localhost:3000/api/agents/bonzo-vault/provision \
  -H 'Content-Type: application/json' \
  -d @strategy-config.json

# Keeper run
curl -X POST http://localhost:3000/api/agents/bonzo-vault/run \
  -H 'Content-Type: application/json' \
  -d '{"strategyId":"<dbId-or-strat_id>"}'
```

## Related code

- Survey UI: `src/app/agents/bonzo-vault/page.tsx`
- Keeper: `src/lib/bonzo/vault-keeper.ts`
- hbar-agents bridge: `hbar-agents/lib/execute-bonzo-vault-run.ts`
- Catalog id: `bonzo-vault-strategist`

## Phase 2 (testnet chain mode)

Self-deployed mock vault factory on Hedera testnet (Track 2C). Real Bonzo mainnet vaults use addresses in `src/lib/bonzo/bonzo-addresses.ts`.

```bash
pnpm contracts:deploy:bonzo-vault   # prints BONZO_VAULT_FACTORY + BONZO_SMOKE_STRATEGY_EVM
pnpm bonzo:vault-smoke              # clone → deposit → withdraw → harvest
pnpm bonzo:vault-e2e                # provision + keeper + HCS (set BONZO_VAULT_ADAPTER_MODE=chain)
```

Set `BONZO_VAULT_ADAPTER_MODE=chain` after smoke passes. ERC20 `approve` is wired in `vault-adapter.ts`; HTS associate for `isHederaToken=true` vaults is future work.
