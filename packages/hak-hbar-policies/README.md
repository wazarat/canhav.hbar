# hak-hbar-policies

Reusable policy hooks for [Hedera Agent Kit](https://github.com/hashgraph/hedera-agent-kit) — constrains agent tool execution with spend limits, counterparty allowlists, human-in-the-loop approval, and swap slippage bounds.

## Policies

| Policy | Guards | Behavior |
|--------|--------|----------|
| `SpendLimitPolicy` | Payment tools | Blocks transfers exceeding per-task cap or daily budget |
| `AllowedCounterpartyPolicy` | Payment tools | Blocks payments to non-allowlisted recipients |
| `ContextualApprovalPolicy` | Payment + write tools | Requires human approval for high-value payments and all swaps |
| `SlippagePolicy` | Write tools | Blocks swaps when quote is stale or price impact exceeds bound |

## Usage

Policies require a `PolicyStatePort` implementation (injected at construction) for session spend, pending approvals, event logging, and swap quote caching:

```ts
import {
  SpendLimitPolicy,
  AllowedCounterpartyPolicy,
  ContextualApprovalPolicy,
  SlippagePolicy,
  createAuditTrailHook,
  type PolicyStatePort,
} from "hak-hbar-policies";

const store: PolicyStatePort = myStateImplementation;

const policies = [
  new SpendLimitPolicy(store, sessionId, { perTaskCapHbar: 5, dailyBudgetHbar: 20 }),
  new AllowedCounterpartyPolicy(store, sessionId, { allowlist: ["0.0.1234"] }),
  new ContextualApprovalPolicy(store, sessionId, { autoApproveBelowHbar: 2, alwaysApproveTaskTypes: ["write"] }, "write"),
  new SlippagePolicy(store, sessionId),
];

// Register as hooks on Hedera Agent Kit context
context.hooks = [...policies, createAuditTrailHook(topicId, hederaClient)];
```

## Publishing (deferred)

This package is publish-ready but **not yet published**. Remaining manual steps:

1. `npm publish` from `packages/hak-hbar-policies` (after removing `"private"` if needed)
2. Open a PR to Hedera's third-party plugin list
