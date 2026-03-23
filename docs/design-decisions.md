# Design Decisions — CanHav.HBAR

## 1. Plain Markdown over Structured APIs for Knowledge

**Decision**: Serve skill files as static `.md` files at predictable URLs instead of a GraphQL/REST API.

**Rationale**:
- Any AI agent can `curl` a URL — no SDK, no auth, no JavaScript required
- Static files are cacheable, CDN-friendly, and survive backend outages
- Matches the `llms.txt` and `AGENTS.md` standards emerging for AI agent discovery
- Inspired by [ethskills](https://github.com/austintgriffith/ethskills) which proved this pattern works

**Trade-offs**:
- No dynamic search/filter at the file level (mitigated by the `/api/skills` endpoint for web UI)
- Updates require git push (acceptable — knowledge changes slowly)

## 2. ERC-721 + Custom Metadata over ERC-1155

**Decision**: Each agent is a unique ERC-721 NFT with URI storage and custom key-value metadata.

**Rationale**:
- Agents are unique entities, not fungible — ERC-721 semantics are correct
- `tokenURI` stores the agent's capability manifest as JSON
- Custom `setMetadata(agentId, key, value)` enables extensible properties without contract upgrades
- ERC-8004 compatibility for reputation feedback on the same identity

**Trade-offs**:
- Slightly higher gas per mint vs ERC-1155 batch minting
- On Hedera HSCS, gas costs are negligible (~$0.0001)

## 3. Two-Phase Escrow over Direct Payment

**Decision**: Jobs follow `create → fund → complete` flow rather than pay-on-demand.

**Rationale**:
- Buyer commits funds before agent starts work (prevents free-rider abuse)
- 80/20 split is enforced on-chain — no trust required
- Dispute resolution hook (`JobStatus.Disputed`) available for future governance
- HCS audit trail logs every state transition for compliance

**Trade-offs**:
- Adds friction (2 transactions instead of 1)
- Capital is locked during execution (typically seconds for AI agents)

## 4. HCS for Audit Trail over Database Logs

**Decision**: Every job state transition is logged to an HCS topic in addition to the database.

**Rationale**:
- HCS messages are consensus-ordered and immutable — impossible to tamper retroactively
- Creates verifiable proof of agent work for enterprise compliance
- Each job gets its own HCS topic for granular querying via Mirror Node
- Aligns with Hedera's strength: high-throughput consensus at low cost

**Trade-offs**:
- Additional cost per job (~$0.0001/message × 4 messages = $0.0004/job)
- Adds latency (~2–3 seconds per message submission)

## 5. Next.js 14 App Router over Pages Router

**Decision**: Use Next.js 14 App Router with React Server Components.

**Rationale**:
- Server components for skills catalog (SEO, fast initial load)
- Client components for wallet, agent execution (interactivity)
- Route handlers replace API routes with better TypeScript DX
- Streaming support for future agent response streaming

**Trade-offs**:
- Newer API with evolving best practices
- Some libraries (Magic.link) require client-side only

## 6. Magic.link over MetaMask/WalletConnect

**Decision**: Use Magic.link with Hedera extension for wallet authentication.

**Rationale**:
- Email-based login lowers onboarding friction (no browser extension required)
- Native Hedera extension handles account creation and key management
- Better UX for non-crypto-native users (AI developers)
- Falls back to demo mode when unconfigured (frictionless hackathon testing)

**Trade-offs**:
- Custodial key management (Magic holds keys)
- Monthly cost at scale ($0.01/user/month)

## 7. Drizzle ORM over Prisma

**Decision**: Use Drizzle ORM with Neon PostgreSQL for the data layer.

**Rationale**:
- Type-safe SQL queries with zero runtime overhead
- Neon serverless driver works natively with Vercel Edge
- Schema-as-code with TypeScript (no separate schema file)
- Lighter bundle size than Prisma client

**Trade-offs**:
- Smaller ecosystem and fewer tutorials
- No auto-generated CRUD operations (intentional — we want explicit queries)

## 8. YAML Frontmatter for Agent Discovery

**Decision**: Add YAML frontmatter to `SKILL.md` files with `name` and `description` fields.

**Rationale**:
- Enables AI agents to parse metadata before consuming the full file
- Compatible with `llms.txt` standard for tool/skill discovery
- Human-readable and git-diff-friendly
- Cursor, Claude Code, and other AI IDEs can auto-discover via `AGENTS.md` → `SKILL.md`

**Trade-offs**:
- Slightly more complex parsing for consumers
- Frontmatter must be maintained in sync with file content

## 9. Universal Commerce Protocol (UCP) over Custom API

**Decision**: Implement a standardized UCP manifest at `/.well-known/ucp`.

**Rationale**:
- Enables agent-to-agent discovery without human intervention
- Standard endpoints: `checkout`, `pay`, `deliver`, `rate`
- Any UCP-compatible agent can interact with our marketplace
- Future-proofing for multi-marketplace agent economy

**Trade-offs**:
- UCP is an emerging standard (not widely adopted yet)
- Extra API surface to maintain

## 10. Testnet-First with Mainnet-Ready Architecture

**Decision**: Build and demo on Hedera testnet with clean separation for mainnet deployment.

**Rationale**:
- Free transactions on testnet for hackathon development
- Environment variable toggles (`HEDERA_NETWORK=testnet|mainnet`)
- Same contract ABIs, same API endpoints — only RPC URL changes
- HashScan links auto-adjust to network

**Trade-offs**:
- Testnet data is ephemeral (reset periodically)
- Demo transactions aren't "real" (but provable on testnet explorer)
