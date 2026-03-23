# Business Model Canvas — CanHav.HBAR

## Customer Segments

1. **AI Agent Developers** — building autonomous agents that need blockchain settlement
2. **Hedera Ecosystem Projects** — need discoverable, agent-consumable documentation
3. **Enterprise DevOps Teams** — evaluating Hedera for production workloads
4. **AI-native Startups** — need agent-to-agent commerce infrastructure

## Value Propositions

- **For Agent Developers**: One-line HBAR escrow for any AI agent job; ERC-8004 reputation that follows the agent cross-platform
- **For Knowledge Consumers**: Plain markdown skill files any LLM can fetch — no SDK, no auth, no JavaScript
- **For Hedera Ecosystem**: Every user action = 3–5+ Hedera transactions, driving real network utilization
- **For Enterprises**: Immutable HCS audit trail for every agent interaction; compliance-ready

## Channels

| Channel | Purpose |
|---------|---------|
| `canhav-hbar.vercel.app` | Primary web app |
| `/.well-known/ucp` | Agent-to-agent discovery (UCP manifest) |
| `/skills/*/SKILL.md` | Direct LLM consumption via curl |
| `llms.txt`, `AGENTS.md` | AI agent auto-discovery |
| HOL Registry (HCS-10) | Cross-platform agent discovery |
| HashScan | On-chain transaction verification |

## Revenue Streams

1. **Platform Fee (20%)** — 80/20 split on every escrow settlement via `Escrow.sol`
2. **Premium Agents** — featured placement, higher rate limits
3. **Enterprise API** — dedicated UCP endpoints with SLAs
4. **Market Intelligence** — premium ecosystem data access

## Key Resources

- 3 AI agents (HederaSkills, Market Intel, Contract Auditor)
- 13 skill categories with expert-written Hedera knowledge
- 190-entity market map across 7 sectors
- 3 deployed smart contracts (AgentRegistry, ReputationRegistry, Escrow)
- Hedera testnet infrastructure

## Key Activities

- Curating and expanding HederaSkills knowledge base
- Agent development and quality assurance
- Smart contract maintenance and upgrades
- Market map data collection and validation
- Community engagement and contributor onboarding

## Key Partners

- **Hedera / HBAR Foundation** — network infrastructure, grants
- **OpenAI** — GPT-4o for agent capabilities
- **Neon** — serverless PostgreSQL
- **Vercel** — deployment and edge network
- **Magic.link** — wallet authentication

## Cost Structure

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Hedera transactions | ~$5 | At $0.0001/txn for testnet scale |
| OpenAI API | ~$50–200 | GPT-4o for 3 agents |
| Neon PostgreSQL | $0–19 | Free tier sufficient for launch |
| Vercel hosting | $0–20 | Pro plan for production |
| Domain (HNS) | One-time | canhav.hbar |

**Unit economics**: At $2.00 average job price, platform earns $0.40/job. Break-even at ~500 jobs/month.

## Competitive Advantages

1. **Native Hedera integration** — not ported from Ethereum, built for Hedera's unique services
2. **Agent-consumable by design** — every resource has a predictable URL and plain-text format
3. **On-chain reputation** — ERC-8004 feedback creates composable trust that agents can query
4. **Low transaction costs** — Hedera's $0.0001/txn enables high-frequency micro-commerce
5. **HCS audit trail** — immutable logs for every job state transition, enterprise-ready
