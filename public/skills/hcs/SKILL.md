# HCS — Hedera Consensus Service

> Decentralized, timestamped, ordered message logging. An immutable append-only log that proves when something was submitted and in what order.

## What You Probably Got Wrong

- **"HCS is a database."** — No. HCS is a consensus-ordered, timestamped log. It doesn't store state or allow queries. It's an immutable append-only record that proves *when* something was submitted and in *what order*.
- **"HCS is a messaging service."** — No. It's an ordering service. Messages are submitted, consensus-ordered, timestamped, and made available via mirror nodes.

## What HCS IS and IS NOT

- **IS:** An ordered, timestamped, immutable log of messages
- **IS:** Verifiable proof of when a message was submitted
- **IS:** Useful for audit trails, supply chain events, AI governance logs
- **IS NOT:** A database — you can't query or update messages
- **IS NOT:** Storage — messages are capped at 1KB (use IPFS/Arweave for data, HCS for hashes)
- **IS NOT:** A messaging service — it's an ordering service

## HCS Message Submission

```typescript
import { TopicCreateTransaction, TopicMessageSubmitTransaction }
  from "@hashgraph/sdk";

// Create a topic (like creating a log channel)
const topicTx = new TopicCreateTransaction()
  .setAdminKey(adminKey)
  .setSubmitKey(submitKey);  // Who can write to this topic

const topicResponse = await topicTx.execute(client);
const topicId = (await topicResponse.getReceipt(client)).topicId;
// Cost: ~$0.01

// Submit a message — $0.0001 per message
const msgTx = new TopicMessageSubmitTransaction()
  .setTopicId(topicId)
  .setMessage(JSON.stringify({
    action: "ai_decision",
    model: "gpt-4",
    input_hash: "sha256:abc123...",
    output_hash: "sha256:def456...",
    timestamp: Date.now()
  }));

await msgTx.execute(client);
// This message is now consensus-ordered and timestamped
```

## Costs

- Topic creation: ~$0.01
- Message submission: $0.0001 per message
- Reading from mirror node: free

## HCS Standards

| Standard | Purpose |
|----------|---------|
| HCS-1 | Decentralized file storage protocol |
| HCS-2 | Topic registry / discovery |
| HCS-3 | Large file chunking over HCS |
| HCS-5 | Decentralized database protocol |
| HCS-7 | Smart contract oracle integration |
| HCS-10 | AI Agent identity and communication |
| HCS-11 | AI Agent communication protocol |

## When to Use HCS

- Audit trails for AI agent actions
- Supply chain event logging
- Governance decision records
- Agent-to-agent communication (HCS-10/HCS-11)
- Immutable timestamps for compliance
