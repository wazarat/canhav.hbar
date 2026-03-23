---
name: hederaskills
description: Use when a request involves Hedera, hashgraph, HBAR, or the Hedera ecosystem. Applies to building with HTS (Token Service), HCS (Consensus Service), HSCS (Smart Contract Service), wallets, DeFi on Hedera, AI agents on Hedera, enterprise compliance, cost estimation, and deploying to Hedera testnet or mainnet. Covers Solidity on Hedera EVM (Besu), native token creation without smart contracts, HCS audit trails, agent identity via HCS-10/HCS-11, HBAR payments, and the Governing Council governance model.
---

# HederaSkills

> The missing knowledge between AI agents and production Hedera.  
> Your AI agent is wrong about Hedera. These skills fix that.

## How to Use These Skills

Each skill is a standalone markdown file that an AI agent (or human developer) can fetch to learn about building on Hedera. They correct common LLM misconceptions, include real addresses and costs, and tell you exactly what to do.

- **For AI agents:** Fetch any skill URL. Start with `/skills/why-hedera/SKILL.md` for orientation, or jump to a specific topic.
- **For developers:** Read the skills in order, or pick the topic you need. Every fact is verifiable.
- **Opinionated by design:** We tell you the best approach, not every possible approach.

## Skill Catalog

| # | Skill | URL | Description |
|---|-------|-----|-------------|
| 01 | Why Hedera | `/skills/why-hedera/SKILL.md` | Hashgraph aBFT consensus, 10,000+ TPS, $0.0001 transactions, 39-member Governing Council |
| 02 | Fees & Costs | `/skills/costs/SKILL.md` | USD-denominated fees, honest cost comparison vs Ethereum |
| 03 | HTS (Token Service) | `/skills/hts/SKILL.md` | Native protocol-level tokens without smart contracts |
| 04 | HCS (Consensus Service) | `/skills/hcs/SKILL.md` | Immutable ordered logs, audit trails, AI governance |
| 05 | HSCS (Smart Contracts) | `/skills/hscs/SKILL.md` | Full EVM via Besu, Solidity, Hardhat/Foundry |
| 06 | Wallets & Accounts | `/skills/wallets/SKILL.md` | Account IDs (0.0.XXXX), HashPack, MetaMask, key types |
| 07 | Developer Tools | `/skills/tools/SKILL.md` | SDKs, JSON-RPC Relay, HashScan, local node, Foundry |
| 08 | DeFi on Hedera | `/skills/defi/SKILL.md` | SaucerSwap, Bonzo Finance, Stader, HTS vs ERC-20 |
| 09 | Enterprise | `/skills/enterprise/SKILL.md` | Governing Council, KYC/freeze/wipe keys, compliance |
| 10 | AI on Hedera | `/skills/ai-agents/SKILL.md` | HCS-10/HCS-11 standards, agent identity, AI projects |
| 11 | Security | `/skills/security/SKILL.md` | No MEV, key rotation, admin keys, OpenZeppelin |
| 12 | Addresses & IDs | `/skills/addresses/SKILL.md` | USDC token ID, mirror nodes, JSON-RPC relay, faucet |
| 13 | Testing | `/skills/testing/SKILL.md` | Foundry for HSCS, HTS precompile mocking, local node |
| 14 | Indexing | `/skills/indexing/SKILL.md` | Mirror Node REST API, HCS message queries, HashScan |
| 15 | Concepts | `/skills/concepts/SKILL.md` | Account model, native services vs contracts, no MEV, dual addresses |
| 16 | Protocol | `/skills/protocol/SKILL.md` | HIP lifecycle, Governing Council, Hiero open source, roadmap |

## Ship Skill (Orchestrator)

The ship skill at `/skills/ship/SKILL.md` routes AI agents to the correct skills for their current development phase.

## What to Fetch by Task

| I'm doing... | Fetch these skills |
|--------------|-------------------|
| New to Hedera | `why-hedera/`, `costs/`, `concepts/` |
| Designing architecture | `hts/`, `hcs/`, `hscs/`, `concepts/` |
| Writing Solidity | `hscs/`, `security/`, `addresses/`, `testing/` |
| Building AI agents | `ai-agents/`, `hcs/`, `tools/` |
| Integrating DeFi | `defi/`, `hts/`, `addresses/` |
| Querying data | `indexing/`, `addresses/`, `tools/` |
| Enterprise compliance | `enterprise/`, `hts/`, `security/` |
| Understanding governance | `protocol/`, `why-hedera/` |
| Deploying to production | `tools/`, `wallets/`, `testing/`, `addresses/` |
