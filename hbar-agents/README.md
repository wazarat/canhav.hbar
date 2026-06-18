# HBAR Skills — Policy-Gated DeFi Agents

Submission tree for the **Hedera AI Agent Bounty — Week 5 (Hooks and Policies)**.

Built on [CanHav.HBAR](https://github.com/wazarat/canhav.hbar) without modifying existing app routes. All HBAR Skills logic lives in this directory; thin App Router files under `src/app/hbar/` import from here.

## Branch

All development on **`ai-agent-bounty`** — never merge to `main` without owner approval.

## Architecture

- **`lib/agent-runtime.ts`** — Vercel AI SDK + Hedera Agent Kit v4 toolkit wiring
- **`lib/agent-config.ts`** — Per-agent plugin loader and system prompts
- **`packages/hak-hbar-policies`** — Reusable policy hooks (workspace package)
- **`lib/policies/index.ts`** — Thin re-export shim + app audit helpers
- **`lib/policy-state.ts`** — Session store implementing `PolicyStatePort`
- **`lib/policy-state-db.ts`** — Drizzle hydrate/persist for serverless (Vercel)
- **`lib/registry-lookup.ts`** — ERC-8004 AgentRegistry + ReputationRegistry counterparty checks
- **`lib/x402/`** — Pay-per-call task purchase (policy-gated)
- **`lib/ui-tokens.ts`** — Shared enterprise UI tokens (M2+)
- **`agents/`** — One folder per DeFi agent + custom agent schema

## M1 acceptance

1. Pay **1 testnet HBAR** for stub task at `/hbar/stub`
2. SpendLimitPolicy blocks over-budget attempts
3. ContextualApprovalPolicy shows approval modal above threshold
4. Policy decisions logged to `HBAR_AUDIT_TOPIC_ID` (HashScan link in UI)

## M2 acceptance (Yield Scout)

1. `/hbar/yield-scout` returns live Bonzo APY report normalized with Pyth prices
2. Task payment gated by SpendLimit, AllowedCounterparty (ERC-8004 registries), ContextualApproval
3. Every decision + payment logged to HCS audit topic (HashScan link in UI)
4. M1 stub flow unchanged at `/hbar/stub`

## M3 acceptance (Swap Executor)

1. `/hbar/swap-executor` executes a real token swap on SaucerSwap testnet within slippage bounds
2. `taskType: "write"` forces human approval on task payment (Gate A) and swap execution (Gate B) every time
3. SpendLimit, AllowedCounterparty (ERC-8004), and SlippagePolicy gate over-budget and out-of-bound swaps
4. Payment, swap, and policy decisions logged to HCS audit topic (HashScan links in UI)
5. M1 stub and M2 Yield Scout flows unchanged

## M4 acceptance (Agent Studio)

1. `/hbar/studio` — build → preview → run custom agents with policy envelope
2. Custom agents persisted per session (`custom_agents` table) and listed in catalog
3. Read-only and write (SaucerSwap) modes with dual approval gate

## M5 acceptance (Package + deploy)

1. `packages/hak-hbar-policies` builds standalone and is consumed via `workspace:*`
2. `PolicyStatePort` injected — package has no hard-coded in-memory store
3. `/api/health` + boot-time env validation
4. Serverless-safe policy state when `DATABASE_URL` is set
5. `FEEDBACK.md` + README demo link

## Environment

See root `.env.example` for `HEDERA_OPERATOR_*`, `HBAR_AUDIT_TOPIC_ID`, worker IDs, and `SAUCERSWAP_*` (M3).

Create audit topic:

```bash
pnpm hbar:create-audit-topic
```

Push DB schema (policy session state + custom agents):

```bash
pnpm db:push
```

## Dependencies

**M1:** `@hashgraph/hedera-agent-kit` v4, `@hashgraph/hedera-agent-kit-ai-sdk`, `@hiero-ledger/sdk`, `ai`, `@ai-sdk/openai`

**M2:** `@bonzofinancelabs/hak-bonzo-plugin`, `hak-pyth-plugin` (read-only market/price tools via v4 wrappers)

**M3:** `hak-saucerswap-plugin` (quote + swap on SaucerSwap testnet)

**M5:** `hak-hbar-policies` (workspace package)

## Routes

| URL | Purpose |
|-----|---------|
| `/hbar` | Agent catalog |
| `/hbar/stub` | M1 policy demo |
| `/hbar/yield-scout` | M2 Yield Scout (read-only APY report) |
| `/hbar/swap-executor` | M3 Swap Executor (write swap + approval gate) |
| `/hbar/lp-health` | M4 LP Health monitor |
| `/hbar/price-feed-verifier` | M4 Price feed verifier |
| `/hbar/studio` | M4 Agent Studio (train-your-own) |
| `POST /api/hbar/pay` | Execute task payment through policy layer |
| `POST /api/hbar/approve` | Human-in-the-loop approval callback |
| `POST /api/hbar/run` | Agent run orchestration |
| `GET /api/health` | Production health / uptime check |
