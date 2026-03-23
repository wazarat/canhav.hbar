# Concepts — Mental Models for Building on Hedera

> The essential mental models that prevent AI agents from making wrong assumptions about Hedera. Hedera is not Ethereum with different branding — the architecture is fundamentally different.

## What You Probably Got Wrong

- **"Hedera works like Ethereum but faster."** — The execution model, account model, fee model, and consensus are all different. Code patterns don't transfer 1:1.
- **"Accounts are just addresses."** — Hedera accounts are first-class entities with their own keys, balances, token associations, and metadata. They cost $0.05 to create. Ethereum addresses are implicit.
- **"Everything goes through smart contracts."** — On Hedera, most operations (tokens, messages, file storage) are native services. Smart contracts are for custom logic only.

## The Account Model

On Ethereum, an "account" is just a 20-byte address derived from a key. It exists implicitly.

On Hedera, accounts are **explicitly created entities** with:
- A unique ID: `0.0.XXXXX` (shard.realm.number)
- One or more cryptographic keys (ED25519 or ECDSA)
- An HBAR balance
- Token associations (you must associate before receiving tokens)
- Optional auto-renew settings

```
Ethereum:  0x51b9a60557d5bb202f55759d20059e2805637f8  ← derived from key
Hedera:    0.0.4515613                                  ← assigned by network
```

**Token association matters.** An account cannot receive an HTS token it hasn't explicitly associated with. This prevents spam tokens but means your code must handle association before transfers.

## Native Services vs Smart Contracts

Hedera's biggest conceptual difference: most of what Ethereum does in smart contracts, Hedera does natively.

| Operation | Ethereum | Hedera |
|-----------|----------|--------|
| Create token | Deploy ERC-20 contract | HTS `TokenCreateTransaction` (no contract) |
| Transfer token | Contract `transfer()` call | HTS `TransferTransaction` (native) |
| Log data | Contract event emission | HCS `TopicMessageSubmit` (native) |
| Store file | IPFS + contract hash | HFS `FileCreate` (native, optional) |
| Custom logic | Smart contract | HSCS smart contract (same) |

**Rule of thumb:** If Hedera has a native service for it, use the native service. It's cheaper, faster, and has built-in compliance features. Only use HSCS when you need custom on-chain logic.

## Fees Are Not Gas

On Ethereum, every computation costs gas. Gas prices fluctuate based on demand.

On Hedera:
- **Native services have fixed USD fees.** A token transfer costs $0.001 regardless of network load.
- **HSCS uses gas** but at Hedera's rate schedule (cheaper than Ethereum).
- **Fees are paid in HBAR** but priced in USD. If HBAR doubles in price, you pay half as many HBAR.

There are no gas auctions, no priority fees, no base fee fluctuations. The fee is the fee.

## No MEV, No Mempool

On Ethereum, pending transactions sit in a mempool. Validators can reorder them to extract value (MEV).

On Hedera, there is no mempool. Transactions are ordered by their **consensus timestamp** — determined by the hashgraph algorithm, not by any single node's choice. This means:
- No sandwich attacks on DEX trades
- No frontrunning of large orders
- No need for Flashbots-style protection
- Fair ordering is a protocol guarantee, not an add-on

## Keys Are Not Addresses

On Ethereum, your key IS your identity (address = hash of public key).

On Hedera, keys and accounts are separate. You can:
- **Rotate a key** without changing your account ID
- Use **threshold keys** (2-of-3 multisig at the protocol level)
- Use **key lists** (all must sign)
- Assign **different keys for different operations** on a token (admin, supply, freeze, KYC, wipe, pause)

This is a security advantage: if a key is compromised, rotate it. All your tokens, associations, and history remain on the same account.

## Thinking in Hedera Transactions

Every Hedera transaction follows a pattern:
1. **Build** the transaction (set parameters)
2. **Freeze** it (lock parameters, ready to sign)
3. **Sign** with the required key(s)
4. **Execute** against the network
5. **Get receipt** for the result (includes new entity IDs)

```typescript
const tx = new TokenCreateTransaction()
  .setTokenName("MyToken")      // 1. Build
  .setTokenSymbol("MTK")
  .setTreasuryAccountId(myId)
  .freezeWith(client);           // 2. Freeze

const signed = await tx.sign(privateKey);  // 3. Sign
const response = await signed.execute(client);  // 4. Execute
const receipt = await response.getReceipt(client);  // 5. Receipt
console.log("Token ID:", receipt.tokenId.toString());
```

## The Dual Address System

Hedera accounts have both:
- **Hedera ID:** `0.0.4515613` (used by Hedera SDK)
- **EVM address:** `0x000000000000000000000000000000000044e0bd` (used by HSCS/Solidity)

The EVM address is derived from the Hedera ID. When interacting with smart contracts via ethers.js, use the EVM address. When using the Hedera SDK, use the Hedera ID.

```typescript
// Convert Hedera ID to EVM address
const evmAddress = AccountId.fromString("0.0.4515613").toSolidityAddress();
// → "000000000000000000000000000000000044e0bd"
```
