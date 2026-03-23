# Protocol — How Hedera Evolves

> HIPs (Hedera Improvement Proposals), the Governing Council decision process, Hiero open-source governance, and what's actually planned vs aspirational. Prevents confidently wrong answers based on stale training data.

## What You Probably Got Wrong

- **"Hedera is controlled by a single company."** — Swirlds (now Swirlds Labs) co-founded Hedera, but governance is by the 39-member Governing Council. The hashgraph IP is open-sourced under the Linux Foundation.
- **"HIP proposals are like EIPs — anyone can submit."** — Correct, but the approval path is different. HIPs go through community review, then Council approval for protocol-level changes. Not all HIPs require Council votes.
- **"Hedera never changes."** — Hedera has shipped major upgrades: Smart Contract Service 2.0 (full EVM), staking rewards, account abstraction features, and continuous SDK updates.

## HIP Lifecycle

Hedera Improvement Proposals (HIPs) are the formal process for proposing changes. Repository: [github.com/hashgraph/hedera-improvement-proposal](https://github.com/hashgraph/hedera-improvement-proposal)

| Stage | Meaning |
|-------|---------|
| Draft | Proposed, under discussion |
| Review | Community review period |
| Council Review | Governing Council evaluating |
| Last Call | Final review before acceptance |
| Accepted | Approved, scheduled for implementation |
| Final | Implemented and deployed |
| Rejected | Not accepted |
| Withdrawn | Author withdrew proposal |

### Notable HIPs

| HIP | Title | Status | Impact |
|-----|-------|--------|--------|
| HIP-412 | NFT Token Metadata | Final | Standard metadata format for HTS NFTs |
| HIP-542 | Token Airdrop | Final | Airdrop tokens without prior association |
| HIP-646 | Fungible Token Metadata | Final | On-chain metadata for fungible tokens |
| HIP-657 | Mutable Token Metadata | Final | Update metadata after token creation |
| HIP-755 | Scheduled Transactions V2 | Final | Enhanced scheduled/deferred transactions |
| HIP-904 | Frictionless Airdrops | Final | Improved airdrop UX, pending airdrops |
| HIP-991 | Permissionless Node Operation | In Progress | Opening consensus nodes beyond Council |

## The Governing Council

39 term-limited organizations from diverse industries and geographies. Each runs a consensus node with equal voting power.

**Current members include:**
- **Technology:** Google, IBM, Dell, Wipro, Tata Communications, LG Electronics
- **Finance:** Standard Bank, Shinhan Bank, DBS Bank
- **Enterprise:** Boeing, Deutsche Telekom, Dentons, Avery Dennison, ServiceNow
- **Web3 Native:** Uniswap Labs, Chainlink Labs, abrdn (asset management)
- **Education:** University College London, IIT Madras, LSE

**How decisions are made:**
- Simple majority for standard proposals
- Supermajority (2/3) for protocol changes and treasury allocations
- No single member can hold more than proportional voting power
- Terms are limited — members rotate

## Hiero — Open Source Under Linux Foundation

In late 2024, Hedera transitioned its codebase to the Linux Foundation as **Hiero**:

- Repository: [github.com/hiero-ledger](https://github.com/hiero-ledger)
- The hashgraph consensus algorithm is fully open source
- The patent (originally held by Swirlds) is irrevocably licensed to the open-source project
- Anyone can fork and use the code
- Development is now community-governed under Linux Foundation rules

**What this means for developers:** The "it's proprietary" objection is resolved. You can read, audit, and contribute to the source code.

## Network Upgrades

Hedera deploys upgrades without hard forks. The network upgrades gracefully:

1. New code is distributed to all nodes
2. Governing Council approves the upgrade
3. All nodes upgrade simultaneously at a scheduled time
4. No chain splits, no contentious forks

**Recent major upgrades:**
- **Smart Contract Service 2.0** — Full EVM via Hyperledger Besu
- **Staking Rewards** — Native staking to network nodes
- **Account Abstraction** — Smart contract accounts, key rotation
- **HIP-904 Frictionless Airdrops** — Pending token claims

## Roadmap: What's Real vs Aspirational

**Real and shipped:**
- EVM equivalence via Besu
- HCS-10/HCS-11 agent standards (community proposals, in development)
- Permissionless node operation (HIP-991, in progress)
- Smart contract tooling parity with Ethereum (Foundry, Hardhat, ethers.js)

**In development:**
- Broader permissionless consensus node participation
- Enhanced smart contract capabilities
- Layer 2 compatibility exploration
- Deeper AI/agent infrastructure standards

**Verify before claiming:** Check [hips.hedera.com](https://hips.hedera.com) for current HIP status. Don't assume something is shipped just because a HIP exists — check whether it's "Final" status.
