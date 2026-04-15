[HederaSkills] AI Studio & Hedera Agent Kit v3

# Hedera AI Studio

> Try it here: https://canhav-hbar.vercel.app/ai-studio

Hedera AI Studio is powered by the **Hedera Agent Kit v3** — a JavaScript SDK that lets AI agents interact directly with the Hedera network. Instead of just explaining how Hedera works, agents can actually execute on-chain actions: mint tokens, submit consensus messages, query accounts, and deploy contracts.

## Architecture

The Agent Kit v3 uses a modular **adapter + plugin** architecture:

- **Adapters** connect the kit to any AI framework (Vercel AI SDK, Langchain, MCP, ElizaOS)
- **Plugins** provide scoped Hedera capabilities — you only load what you need
- One plugin works across all adapters automatically

## Core Plugins

The following plugins are available in the Hedera Agent Kit:

1. **Core Account Plugin** — Hedera Account Service operations (create, update, delete accounts)
2. **Core Account Query Plugin** — Query account balances, info, and token associations via Mirror Node
3. **Core Consensus Plugin** — Hedera Consensus Service (HCS) operations: create topics, submit messages
4. **Core Consensus Query Plugin** — Query HCS topics and message history via Mirror Node
5. **Core Token Plugin (HTS)** — Hedera Token Service operations: create, mint, transfer, burn tokens
6. **Core Token Query Plugin** — Query token info, balances, and NFT data via Mirror Node
7. **Core EVM Plugin** — Interact with EVM smart contracts on Hedera (ERC-20, ERC-721 via HSCS)
8. **Core EVM Query Plugin** — Query smart contract state and call view functions
9. **Core Transactions Plugin** — Handle general Hedera transaction operations, scheduled transactions

## Plugin Scoping

Plugins should be scoped by context. For example, when working with HTS tokens, only load the token-related plugins:

```typescript
import { HederaAgentKit } from "hedera-agent-kit";

const agentKit = new HederaAgentKit(
  process.env.HEDERA_ACCOUNT_ID,
  process.env.HEDERA_PRIVATE_KEY,
  "testnet"
);
```

On CanHav.HBAR, the AI Studio page uses a strict `TOPIC_PLUGIN_MAP` to prevent cross-capability leakage — selecting HTS will never enable EVM operations.

## Quickstart with CLI

The fastest way to build your own Hedera AI agent:

```bash
npm create hedera-agent@latest
```

This scaffolds a full-stack Next.js application. Choose your agent mode, LLM provider, and add your Hedera testnet credentials. You'll have a working AI agent in minutes.

## Integration with Vercel AI SDK

The Agent Kit provides a Vercel AI SDK adapter for streaming responses:

```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = streamText({
  model: openai("gpt-4o"),
  system: "You are a Hedera AI agent on testnet...",
  messages,
  maxSteps: 5,
});

return result.toDataStreamResponse();
```

## Framework Support

The Agent Kit v3 works with:

- **Vercel AI SDK** — Streaming chat with Next.js (used by CanHav.HBAR)
- **Langchain** — Tool-based agent chains
- **MCP (Model Context Protocol)** — Standardized tool interface
- **ElizaOS** — Open-source AI agent framework with web3 integration

## Key Links

- npm: `hedera-agent-kit`
- GitHub: github.com/hashgraph/hedera-agent-kit
- Hedera AI Studio blog: https://hedera.com/blog/whats-new-in-ai-studio/
- Create CLI: `npm create hedera-agent@latest`

## Network

All operations on CanHav.HBAR target **Hedera Testnet**. Use the Hedera Developer Portal to get free testnet HBAR for development.

## Costs

- HCS message submission: ~$0.0001 per message
- HTS token creation: ~$1.00 per token type
- HTS transfer: ~$0.001 per transfer
- Account creation: ~$0.05 per account
- Smart contract deployment: varies by contract size (gas-based)

All fees are paid in HBAR on testnet (no real cost during development).
