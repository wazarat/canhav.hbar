# Indexing — Reading Data from Hedera

> Query historical transactions, token balances, HCS messages, and contract events via the Mirror Node REST API. This is Hedera's equivalent of The Graph + Etherscan combined.

## What You Probably Got Wrong

- **"I'll use The Graph or Dune for Hedera data."** — Neither supports Hedera natively. Hedera has its own Mirror Node REST API that covers 90% of indexing needs without deploying subgraphs.
- **"I can query historical state via JSON-RPC."** — The JSON-RPC Relay has limited historical data. Use the Mirror Node API for historical queries.
- **"Events work the same as Ethereum."** — HSCS contract events do work, but HTS and HCS operations emit their own structured records, not Solidity events. Query them via Mirror Node.

## Mirror Node REST API

The Mirror Node indexes all Hedera transactions and serves them via a REST API. No API key required for public endpoints.

| Endpoint | Base URL |
|----------|----------|
| Mainnet | `https://mainnet-public.mirrornode.hedera.com` |
| Testnet | `https://testnet.mirrornode.hedera.com` |

### Common Queries

```typescript
const MIRROR = "https://mainnet-public.mirrornode.hedera.com";

// Get account info
const account = await fetch(`${MIRROR}/api/v1/accounts/0.0.12345`)
  .then(r => r.json());

// Get token info (check keys, supply, name)
const token = await fetch(`${MIRROR}/api/v1/tokens/0.0.456789`)
  .then(r => r.json());

// Get account's token balances
const balances = await fetch(`${MIRROR}/api/v1/accounts/0.0.12345/tokens`)
  .then(r => r.json());

// Get recent transactions for an account
const txns = await fetch(
  `${MIRROR}/api/v1/transactions?account.id=0.0.12345&limit=25&order=desc`
).then(r => r.json());

// Get HCS messages from a topic
const messages = await fetch(
  `${MIRROR}/api/v1/topics/0.0.789/messages?limit=100`
).then(r => r.json());

// Get NFT info
const nft = await fetch(`${MIRROR}/api/v1/tokens/0.0.456789/nfts/1`)
  .then(r => r.json());
```

### Pagination

Mirror Node uses cursor-based pagination via the `next` link:

```typescript
async function getAllMessages(topicId: string) {
  let url = `${MIRROR}/api/v1/topics/${topicId}/messages?limit=100`;
  const all = [];

  while (url) {
    const data = await fetch(url).then(r => r.json());
    all.push(...(data.messages || []));
    url = data.links?.next ? `${MIRROR}${data.links.next}` : null;
  }

  return all;
}
```

## HSCS Contract Events

For Solidity contracts on HSCS, events work like Ethereum. Query them via Mirror Node:

```typescript
// Get contract logs (events) — equivalent to eth_getLogs
const logs = await fetch(
  `${MIRROR}/api/v1/contracts/${contractAddress}/results/logs` +
  `?topic0=0x${eventSignatureHash}&limit=50&order=desc`
).then(r => r.json());
```

Or use ethers.js via the JSON-RPC Relay for recent events:

```typescript
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const contract = new ethers.Contract(address, abi, provider);
const events = await contract.queryFilter("AgentRegistered", -1000);
```

## HCS Message Decoding

HCS messages are stored as base64-encoded bytes. Decode them:

```typescript
const messages = await fetch(
  `${MIRROR}/api/v1/topics/0.0.5610001/messages?limit=10`
).then(r => r.json());

for (const msg of messages.messages) {
  const decoded = Buffer.from(msg.message, "base64").toString("utf-8");
  const parsed = JSON.parse(decoded);
  console.log({
    sequenceNumber: msg.sequence_number,
    consensusTimestamp: msg.consensus_timestamp,
    content: parsed,
  });
}
```

## HashScan — The Block Explorer

[HashScan](https://hashscan.io) is Hedera's primary block explorer. Use it to:

- Verify contract deployments and source code
- View token metadata and key structures
- Trace transaction flows
- Monitor HCS topic activity

Direct URLs:
- Account: `https://hashscan.io/testnet/account/0.0.XXXXX`
- Transaction: `https://hashscan.io/testnet/transaction/0.0.XXXXX@TIMESTAMP`
- Token: `https://hashscan.io/testnet/token/0.0.XXXXX`
- Topic: `https://hashscan.io/testnet/topic/0.0.XXXXX`
- Contract: `https://hashscan.io/testnet/contract/0.0.XXXXX`

## When to Use What

| Need | Use |
|------|-----|
| Historical transactions | Mirror Node REST API |
| Token balances (current) | Mirror Node `/accounts/{id}/tokens` |
| HCS message history | Mirror Node `/topics/{id}/messages` |
| Recent contract events | JSON-RPC Relay via ethers.js |
| Full contract event history | Mirror Node `/contracts/{id}/results/logs` |
| Real-time HCS messages | Subscribe via `@hashgraph/sdk` `TopicMessageQuery` |
| Visual inspection | HashScan web UI |
