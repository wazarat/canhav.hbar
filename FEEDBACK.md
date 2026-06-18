# Feedback — Hedera AI Studio / Agent Lab (HBAR Skills build)

## What Worked

- **Hedera Agent Kit v4 hooks/policies model** — `AbstractPolicy` + `PostParamsNormalization` is a clean seam for spend limits, counterparty gates, HITL approval, and slippage bounds without rewriting agent logic.
- **Plugin wrappers** — Bonzo, Pyth, and SaucerSwap plugins compose well behind a single `HederaAIToolkit` context; read-only vs write plugin split (`saucerswapQuoteOnlyPlugin` vs executor) made M2→M4 progression straightforward.
- **Testnet faucet + Portal** — ECDSA operator account setup via portal.hedera.com was sufficient for HTS swaps and HCS audit topic creation.
- **Agent Lab export path** — Building in Agent Lab (Build → Code → Run, HITL mode) aligned with the bounty narrative; exported patterns mapped cleanly to `@hashgraph/hedera-agent-kit-ai-sdk` + Vercel AI SDK in this repo.
- **Policy-as-hooks in UI** — Surfacing policy state badges (`within policy`, `needs your approval`, `blocked by SpendLimit`) in Agent Studio made the dual-gate swap story demoable without reading server logs.
- **pnpm workspace extraction** — Moving policies into `hak-hbar-policies` with an injected `PolicyStatePort` proved the layer is reusable without coupling to app session storage.

## Friction Points

- **Serverless session state** — Module-level `Map` stores break approval flows across Vercel invocations; required a DB hydrate/persist layer the docs don't warn about upfront.
- **Plugin v4 migration** — Older hak plugin examples assume v3 LangChain patterns; each plugin needed thin wrappers for v4 `Plugin` + tool registration.
- **SaucerSwap testnet keys** — Obtaining a testnet `x-api-key` and associating HTS tokens (SAUCE, WHBAR) before swaps succeed is easy to miss; failures surface as generic tool errors.
- **SDK duality** — `@hashgraph/sdk` vs `@hiero-ledger/sdk` type mismatches appear in audit hook constructors; the app standardized on `@hiero-ledger/sdk` for the operator client.
- **Agent Kit subpath exports** — `@hashgraph/hedera-agent-kit/hooks` requires careful `moduleResolution` in standalone package builds; deep `dist/cjs/` imports break Next.js bundling.
- **Instrumentation boot validation** — Failing fast on missing env vars is correct for production, but must skip the build phase (`NEXT_PHASE=phase-production-build`) so Vercel CI doesn't fail before env is injected.

## Feature Requests

- **First-class async policy state port** — A documented pattern for serverless (Neon/Upstash) session stores would save custom hydrate/persist wiring.
- **Policy decision persistence hook** — Built-in optional HCS audit hook config in Agent Kit context (topic id + message schema) instead of manual `HcsAuditTrailHook` wiring.
- **Agent Lab → repo export** — One-click export of Agent Lab agent + policies + env template into a deployable Next.js route would shorten bounty-style submissions.
- **Testnet swap checklist in Agent Lab** — In-app reminder for token association + SaucerSwap API key before first write-mode run.
- **ERC-8004 registry helpers in Agent Kit** — `AllowedCounterpartyPolicy`-style registry lookup as a bundled utility (not only via custom `registry-lookup.ts`).
- **Studio policy editor** — Visual editor for policy configs (budget, approval threshold, slippage) that generates both UI copy and runtime config JSON.
