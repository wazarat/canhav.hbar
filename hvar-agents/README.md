# HVAR Skills — Policy-Gated DeFi Agents

Submission tree for the **Hedera AI Agent Bounty — Week 5 (Hooks and Policies)**.

Built on [CanHav.HBAR](https://github.com/wazarat/canhav.hbar) without modifying existing app routes. All HVAR logic lives in this directory; thin App Router files under `src/app/hvar/` import from here.

## Branch

All development on **`ai-agent-bounty`** — never merge to `main` without owner approval.

## Architecture

- **`lib/agent-runtime.ts`** — Vercel AI SDK + Hedera Agent Kit v4 toolkit wiring
- **`lib/policies/`** — SpendLimit, AllowedCounterparty, ContextualApproval + HCS audit hook
- **`lib/x402/`** — Pay-per-call stub facilitator (M1); real task purchase pattern for M2+
- **`agents/`** — One folder per DeFi agent (stub only in M1)

## M1 acceptance (current milestone)

1. Pay **1 testnet HBAR** for stub task at `/hvar/stub`
2. SpendLimitPolicy blocks over-budget attempts
3. ContextualApprovalPolicy shows approval modal above threshold
4. Policy decisions logged to `HVAR_AUDIT_TOPIC_ID` (HashScan link in UI)

## Environment

See root `.env.example` for `HEDERA_OPERATOR_*`, `HVAR_AUDIT_TOPIC_ID`, `HVAR_STUB_WORKER_ID`.

Create audit topic:

```bash
pnpm hvar:create-audit-topic
```

## Dependencies (M1)

- `@hashgraph/hedera-agent-kit` v4
- `@hashgraph/hedera-agent-kit-ai-sdk`
- `@hiero-ledger/sdk`
- `ai`, `@ai-sdk/openai` (existing)

Bonzo, Pyth, SaucerSwap plugins are **M2/M3** — not installed yet.

## Routes

| URL | Purpose |
|-----|---------|
| `/hvar` | Agent catalog (6 listed, stub active) |
| `/hvar/stub` | M1 policy demo |
| `POST /api/hvar/pay` | Execute stub payment through policy layer |
| `POST /api/hvar/approve` | Human-in-the-loop approval callback |
| `POST /api/hvar/run` | Streaming agent run (Vercel AI SDK) |
