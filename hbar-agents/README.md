# HBAR Skills — Policy-Gated DeFi Agents

Submission tree for the **Hedera AI Agent Bounty — Week 5 (Hooks and Policies)**.

Built on [CanHav.HBAR](https://github.com/wazarat/canhav.hbar) without modifying existing app routes. All HBAR Skills logic lives in this directory; thin App Router files under `src/app/hbar/` import from here.

## Branch

All development on **`ai-agent-bounty`** / feature branches — never merge to `main` without owner approval.

## Architecture

- **`lib/agent-runtime.ts`** — Vercel AI SDK + Hedera Agent Kit v4 toolkit wiring
- **`lib/agent-config.ts`** — Per-agent plugin loader and system prompts
- **`lib/policies/`** — SpendLimit, AllowedCounterparty, ContextualApproval + HCS audit hook
- **`lib/registry-lookup.ts`** — ERC-8004 AgentRegistry + ReputationRegistry counterparty checks
- **`lib/x402/`** — Pay-per-call task purchase (policy-gated)
- **`lib/ui-tokens.ts`** — Shared enterprise UI tokens (M2+)
- **`agents/`** — One folder per DeFi agent (stub, yield-scout, swap-executor)

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

## Environment

See root `.env.example` for `HEDERA_OPERATOR_*`, `HBAR_AUDIT_TOPIC_ID`, worker IDs, and `SAUCERSWAP_*` (M3).

Create audit topic:

```bash
pnpm hbar:create-audit-topic
```

## Dependencies

**M1:** `@hashgraph/hedera-agent-kit` v4, `@hashgraph/hedera-agent-kit-ai-sdk`, `@hiero-ledger/sdk`, `ai`, `@ai-sdk/openai`

**M2:** `@bonzofinancelabs/hak-bonzo-plugin`, `hak-pyth-plugin` (read-only market/price tools via v4 wrappers)

**M3:** `hak-saucerswap-plugin` (quote + swap on SaucerSwap testnet)

## Routes

| URL | Purpose |
|-----|---------|
| `/hbar` | Agent catalog |
| `/hbar/stub` | M1 policy demo |
| `/hbar/yield-scout` | M2 Yield Scout (read-only APY report) |
| `/hbar/swap-executor` | M3 Swap Executor (write swap + approval gate) |
| `POST /api/hbar/pay` | Execute task payment through policy layer |
| `POST /api/hbar/approve` | Human-in-the-loop approval callback |
| `POST /api/hbar/run` | Agent run (Yield Scout / Swap Executor orchestration) |
