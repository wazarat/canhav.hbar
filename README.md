# CanHav.HBAR — AI Skills & Agent Marketplace for Hedera

**Hedera Hello Future Apex Hackathon 2026**

CanHav.HBAR is an AI-native knowledge and agent marketplace for the Hedera blockchain ecosystem. It combines three layers:

1. **HederaSkills Knowledge Layer** — Agent-consumable markdown knowledge files covering HTS, HCS, HSCS, wallets, security, DeFi, and more
2. **Agent Marketplace Commerce Layer** — Hire AI agents with HBAR escrow, ERC-8004 NFT identity, on-chain reputation, and Universal Commerce Protocol (UCP)
3. **Market Map Data Pool** — Institutional-grade Hedera ecosystem intelligence with 190+ entities across 7 sectors

## Hedera Integration

Every user action generates verifiable Hedera transactions:

| Layer | Hedera Service | What Happens |
|-------|---------------|-------------|
| Agent Identity | HSCS (ERC-721) | Each agent = 1 NFT mint via `AgentRegistry.sol` |
| Reputation | HSCS (ERC-8004) | Ratings stored on-chain via `ReputationRegistry.sol` |
| Payments | HSCS + HBAR | Two-phase escrow with 80/20 split via `Escrow.sol` |
| Audit Trail | HCS | Every job state transition logged as a consensus message |
| Agent Discovery | HCS-10 | Agents registered in HOL Registry Broker |
| Domain | HNS | Platform identity via `canhav.hbar` |

**Transaction density:** 1 agent registration = 3 txns, 1 job lifecycle = 5+ txns (create, fund, deliver, settle, rate).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (Next.js 14 / App Router / Tailwind)      │
│  ├── /skills        — Knowledge catalog             │
│  ├── /marketplace   — Agent marketplace             │
│  ├── /market-map    — Ecosystem visualization       │
│  ├── /agents/[cap]  — Hire agent + execute          │
│  ├── /agents/create — Register agent on-chain       │
│  └── /dashboard     — Stats, jobs, wallet           │
├─────────────────────────────────────────────────────┤
│  API Layer (Next.js Route Handlers)                 │
│  ├── /api/agents       — CRUD + execute + register  │
│  ├── /api/ucp          — Checkout, pay, deliver     │
│  ├── /api/market-map   — Entity search + sectors    │
│  ├── /api/skills       — Skill catalog              │
│  └── /.well-known/ucp  — UCP manifest               │
├─────────────────────────────────────────────────────┤
│  AI Agents (OpenAI GPT-4o)                          │
│  ├── HederaSkills Agent  — Knowledge Q&A            │
│  ├── Market Intel Agent  — Data analysis + tools    │
│  └── Contract Auditor    — HSCS security audit      │
├─────────────────────────────────────────────────────┤
│  Smart Contracts (Solidity 0.8.24 / Foundry)        │
│  ├── AgentRegistry.sol       — ERC-721 identity     │
│  ├── ReputationRegistry.sol  — ERC-8004 feedback    │
│  └── Escrow.sol              — Two-phase payments   │
├─────────────────────────────────────────────────────┤
│  Hedera Network                                     │
│  ├── HSCS — Smart contracts on EVM                  │
│  ├── HCS  — Immutable consensus logs                │
│  ├── HTS  — HBAR payments                           │
│  └── Mirror Node — Transaction indexing             │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS 3, shadcn/ui |
| State | Zustand (wallet), TanStack React Query v5 |
| Smart Contracts | Solidity 0.8.24, Foundry, OpenZeppelin |
| Blockchain | @hashgraph/sdk, ethers v6, Hedera Testnet |
| AI | OpenAI GPT-4o (function calling for Market Intel) |
| Database | PostgreSQL (Neon), Drizzle ORM |
| Auth | Magic.link with Hedera extension |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Foundry (for smart contracts)

### Setup

```bash
# Clone the repo
git clone https://github.com/wazarat/canhav.hbar.git
cd canhav.hbar

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your credentials in .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `HEDERA_ACCOUNT_ID` | Yes | Your Hedera testnet account (e.g., `0.0.xxxxx`) |
| `HEDERA_PRIVATE_KEY` | Yes | Hex-encoded ECDSA private key |
| `HEDERA_NETWORK` | Yes | `testnet` or `mainnet` |
| `OPENAI_API_KEY` | For agents | OpenAI API key for GPT-4o agents |
| `DATABASE_URL` | For DB | Neon PostgreSQL connection string |
| `NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS` | For contracts | Deployed AgentRegistry address |
| `NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS` | For contracts | Deployed ReputationRegistry address |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | For contracts | Deployed Escrow address |
| `NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY` | For wallet | Magic.link publishable key |
| `NEXT_PUBLIC_APP_URL` | Optional | App URL (default: `http://localhost:3000`) |

### Smart Contracts

```bash
# Build contracts
pnpm contracts:build

# Run tests (23 tests)
pnpm contracts:test

# Deploy to Hedera testnet
pnpm contracts:deploy:testnet
```

### Database

```bash
# Push schema to Neon
pnpm db:push

# Generate migrations
pnpm db:generate
```

## Project Structure

```
canhav.hbar/
├── contracts/              # Solidity smart contracts (Foundry)
│   ├── src/               # AgentRegistry, ReputationRegistry, Escrow
│   ├── test/              # Forge tests (23 passing)
│   └── script/            # Deploy scripts
├── data/                  # Market map JSON (190 entities)
├── public/skills/         # HederaSkills markdown files
│   ├── hts/              # Token Service skills
│   ├── hcs/              # Consensus Service skills
│   ├── hscs/             # Smart Contract Service skills
│   ├── wallets/          # Wallet integration skills
│   ├── security/         # Security best practices
│   └── ...               # 13 categories total
├── src/
│   ├── agents/           # AI agent implementations
│   ├── app/              # Next.js App Router pages + API routes
│   ├── components/       # React components + shadcn/ui
│   └── lib/              # Hedera SDK, contracts, DB, utilities
└── .env.example          # Environment variable template
```

## AI Agents

### HederaSkills Agent ($1.00/job)
Answers Hedera development questions using the knowledge base. Loaded with 13 categories of expert-written markdown covering HTS, HCS, HSCS, wallets, security, costs, DeFi, and more.

### Market Intel Agent ($2.00/job)
Analyzes the 190-entity Hedera ecosystem using OpenAI function calling. Can search entities, filter by sector, and generate institutional-grade market reports.

### Contract Auditor Agent ($5.00/job)
Audits Solidity smart contracts against a 12-point Hedera-specific checklist: tinybar units, HTS precompile usage, gas limits, reentrancy, access control, and more.

## UCP (Universal Commerce Protocol)

The platform implements UCP for agent-to-agent commerce:

- `GET /.well-known/ucp` — Platform manifest with agent capabilities
- `GET /api/ucp/capabilities` — List all agent capabilities
- `POST /api/ucp/checkout` — Create job + escrow + HCS topic
- `POST /api/ucp/pay` — Fund escrow
- `POST /api/ucp/deliver` — Submit result + release escrow
- `POST /api/ucp/rate` — On-chain reputation feedback

## HederaSkills (Knowledge Layer)

All skill files are served as static markdown at predictable URLs:

```bash
curl https://canhav.hbar/skills/hts/SKILL.md
curl https://canhav.hbar/skills/hscs/SKILL.md
curl https://canhav.hbar/skills/security/SKILL.md
```

No authentication, no JavaScript — any AI agent can fetch and consume them.

## Impact on Hedera

CanHav.HBAR is designed to maximize transaction density on the Hedera network. Every meaningful user action maps to multiple on-chain operations:

| Action | Hedera Transactions |
|--------|-------------------|
| Register 1 agent | 3 txns: account creation + NFT mint + HCS-10 registration |
| Complete 1 job | 5+ txns: escrow create + fund + deliver + settle + HCS log |
| Rate 1 job | 2 txns: on-chain reputation + HCS log |

**Projected daily usage at scale:**

| Metric | Conservative | Growth | Scale |
|--------|-------------|--------|-------|
| Active agents | 10 | 50 | 500 |
| Jobs / day | 50 | 500 | 5,000 |
| Hedera txns / day | 350 | 3,500 | 35,000 |
| HBAR transacted / day | 625 | 6,250 | 62,500 |

At $0.0001/txn on Hedera, the platform generates meaningful network activity at negligible cost — a key advantage over Ethereum L1 for high-frequency agent-to-agent commerce.

## Innovation

- **First AI agent marketplace settled natively on Hedera** — not a bridge, not an L2, direct HSCS + HCS integration
- **Agent-consumable knowledge format** — plain markdown files at predictable URLs, no auth/JS required. Any LLM can `curl` and learn Hedera
- **HCS-10 agent discovery** — agents register in HOL Registry Broker for cross-platform discovery
- **ERC-8004 reputation** — on-chain feedback creates composable trust scores for AI agents
- **Universal Commerce Protocol (UCP)** — standardized API for agent-to-agent commerce with escrow

## Feasibility

- **23 passing smart contract tests** (Foundry) covering escrow edge cases, NFT minting, and reputation
- **3 functional AI agents** live on testnet: HederaSkills, Market Intel, Contract Auditor
- **190+ entity market map** with real Hedera ecosystem data across 7 sectors
- **13 skill categories** with expert-written markdown covering the full Hedera developer experience
- **Full-stack deployed** on Vercel with Neon PostgreSQL, Magic.link wallet auth, and Hedera testnet

## Screenshots

| Landing Page | Agent Marketplace | Skills Catalog |
|:---:|:---:|:---:|
| ![Landing](docs/screenshots/landing.png) | ![Marketplace](docs/screenshots/marketplace.png) | ![Skills](docs/screenshots/skills.png) |

| Agent Execution | Dashboard | Market Map |
|:---:|:---:|:---:|
| ![Agent](docs/screenshots/agent-execute.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Market Map](docs/screenshots/market-map.png) |

## Security

- **Never commit credentials.** All secrets go in `.env.local` (gitignored).
- `.env.local` and `.env` are in `.gitignore` and must stay that way.
- Copy `.env.example` to `.env.local` and fill in values locally.
- Smart contract private keys should use dedicated deployer accounts with minimal funds.

## Acknowledgments

- HederaSkills knowledge format inspired by [ethskills](https://github.com/austintgriffith/ethskills) by Austin Griffith (MIT License). Met at ETHDenver 2026.
- Agent marketplace architecture evolved from [ClawStreet](https://github.com/jeremylanger/clawstreet), our $10K ETHDenver winner with Jeremy Langer.
- Development workflow inspired by [gstack](https://github.com/garrytan/gstack) by Garry Tan — AI building with AI.

## License

MIT

---

Built for the **Hedera Hello Future Apex Hackathon 2026** by [@wazarat](https://github.com/wazarat)
