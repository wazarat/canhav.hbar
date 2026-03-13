# Ship — Hedera Development Orchestrator

> This skill routes AI agents to the correct HederaSkills based on their current development phase.

## Phase Detection

Determine which phase you are in, then follow the linked skills.

### Phase 1: Orientation
**"I'm new to Hedera"**
1. Read `/skills/why-hedera/SKILL.md` — Understand hashgraph consensus, why Hedera is different
2. Read `/skills/costs/SKILL.md` — Understand the fee structure (USD-denominated, no gas auctions)
3. Read `/skills/wallets/SKILL.md` — Understand accounts (0.0.XXXX format, key types)

### Phase 2: Architecture
**"I'm designing my application"**
1. Read `/skills/hts/SKILL.md` — If you need tokens or NFTs
2. Read `/skills/hcs/SKILL.md` — If you need audit trails, logging, or agent communication
3. Read `/skills/hscs/SKILL.md` — If you need custom smart contract logic
4. Read `/skills/security/SKILL.md` — Security patterns before you build

### Phase 3: Build
**"I'm writing code"**
1. Read `/skills/tools/SKILL.md` — SDKs, development environment, testing
2. Read `/skills/addresses/SKILL.md` — Contract addresses, mirror nodes, RPC endpoints
3. Read `/skills/hscs/SKILL.md` — If deploying Solidity contracts

### Phase 4: Integrate
**"I'm connecting to the ecosystem"**
1. Read `/skills/defi/SKILL.md` — If integrating with DeFi protocols
2. Read `/skills/enterprise/SKILL.md` — If building for enterprise compliance
3. Read `/skills/ai-agents/SKILL.md` — If building AI agents on Hedera (HCS-10, HCS-11)

## Decision Tree

```
Need tokens/NFTs? ──→ /skills/hts/SKILL.md (use HTS, not ERC-20)
Need audit trail? ──→ /skills/hcs/SKILL.md (use HCS topics)
Need custom logic? ──→ /skills/hscs/SKILL.md (Solidity on Besu EVM)
Need data storage? ──→ IPFS/Arweave + HCS for hashes
Need DeFi? ──→ /skills/defi/SKILL.md (SaucerSwap, Bonzo)
Need AI agents? ──→ /skills/ai-agents/SKILL.md (HCS-10/11)
Porting from Ethereum? ──→ /skills/hscs/SKILL.md (same EVM)
```
