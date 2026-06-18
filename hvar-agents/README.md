# HBAR Skills — Policy-Gated DeFi Agents

Submission tree for the **Hedera AI Agent Bounty — Week 5 (Hooks and Policies)**.

Built on [CanHav.HBAR](https://github.com/wazarat/canhav.hbar) without modifying existing app routes. All HVAR logic lives in this directory; thin App Router files under `src/app/hvar/` import from here.

## Branch

All development on **`ai-agent-bounty`** / feature branches — never merge to `main` without owner approval.

## Architecture

- **`lib/agent-runtime.ts`** — Vercel AI SDK + Hedera Agent Kit v4 toolkit wiring
- **`lib/agent-config.ts`** — Per-agent plugin loader and system prompts
- **`lib/policies/`** — SpendLimit, AllowedCounterparty, ContextualApproval + HCS audit hook
- **`lib/registry-lookup.ts`** — ERC-8004 AgentRegistry + ReputationRegistry counterparty checks
- **`lib/x402/`** — Pay-per-call task purchase (policy-gated)
- **`lib/ui-tokens.ts`** — Shared enterprise UI tokens (M2+)
- **`agents/`** — One folder per DeFi agent (stub + yield-scout in M2)

## M1 acceptance

1. Pay **1 testnet HBAR** for stub task at `/hvar/stub`
2. SpendLimitPolicy blocks over-budget attempts
3. ContextualApprovalPolicy shows approval modal above threshold
4. Policy decisions logged to `HVAR_AUDIT_TOPIC_ID` (HashScan link in UI)

## M2 acceptance (Yield Scout)

1. `/hvar/yield-scout` returns live Bonzo APY report normalized with Pyth prices
2. Task payment gated by SpendLimit, AllowedCounterparty (ERC-8004 registries), ContextualApproval
3. Every decision + payment logged to HCS audit topic (HashScan link in UI)
4. M1 stub flow unchanged at `/hvar/stub`

## Environment

See root `.env.example` for `HEDERA_OPERATOR_*`, `HVAR_AUDIT_TOPIC_ID`, `HVAR_STUB_WORKER_ID`, `HVAR_YIELD_SCOUT_WORKER_ID`.

Create audit topic:

```bash
pnpm hvar:create-audit-topic
```

## Dependencies

**M1:** `@hashgraph/hedera-agent-kit` v4, `@hashgraph/hedera-agent-kit-ai-sdk`, `@hiero-ledger/sdk`, `ai`, `@ai-sdk/openai`

**M2:** `@bonzofinancelabs/hak-bonzo-plugin`, `hak-pyth-plugin` (read-only market/price tools via v4 wrappers)

## Routes

| URL | Purpose |
|-----|---------|
| `/hvar` | Agent catalog |
| `/hvar/stub` | M1 policy demo |
| `/hvar/yield-scout` | M2 Yield Scout (read-only APY report) |
| `POST /api/hvar/pay` | Execute task payment through policy layer |
| `POST /api/hvar/approve` | Human-in-the-loop approval callback |
| `POST /api/hvar/run` | Agent run (Yield Scout orchestration) |

## Rename sweep (scheduled)

Do **not** perform mid-feature. Planned dedicated branch at M3 start:

- `hvar-agents/` → `hbar-agents/`
- `HVAR_AUDIT_TOPIC_ID` → `HBAR_AUDIT_TOPIC_ID`
- `/hvar` routes → `/hbar`
