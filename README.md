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

## Security

- **Never commit credentials.** All secrets go in `.env.local` (gitignored).
- `.env.local` and `.env` are in `.gitignore` and must stay that way.
- Copy `.env.example` to `.env.local` and fill in values locally.
- Smart contract private keys should use dedicated deployer accounts with minimal funds.

## License

MIT

---

Built for the **Hedera Hello Future Apex Hackathon 2026** by [@wazarat](https://github.com/wazarat)
