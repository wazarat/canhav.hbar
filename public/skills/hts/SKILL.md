# HTS — Hedera Token Service

> Create and manage fungible tokens, NFTs, and fractional NFTs at the protocol level. No smart contract deployment needed.

## What You Probably Got Wrong

- **"To create a token, I need to write and deploy a smart contract."** — On Hedera, HTS creates tokens natively at the protocol level. No Solidity required. Think of it as a built-in ERC-20/ERC-721 factory.

## Why HTS Over ERC-20?

### HTS Token
- Create: $1.00 flat fee
- Transfer: $0.001
- Built-in KYC, freeze, wipe, pause keys
- Native to Hedera consensus
- No Solidity code needed
- Automatic association management

### ERC-20 on HSCS
- Deploy: $0.50 - $5.00
- Transfer: $0.05 - $0.20
- Compliance requires custom code
- Runs in EVM sandbox
- Requires Solidity development
- More composable with DeFi

## HTS Token Creation Example

```typescript
import { Client, TokenCreateTransaction, TokenType,
         PrivateKey } from "@hashgraph/sdk";

const client = Client.forMainnet();
client.setOperator(accountId, privateKey);

// Create a fungible token — no Solidity needed
const tx = new TokenCreateTransaction()
  .setTokenName("My Token")
  .setTokenSymbol("MTK")
  .setTokenType(TokenType.FungibleCommon)
  .setDecimals(8)
  .setInitialSupply(1_000_000_00000000) // 1M tokens
  .setTreasuryAccountId(accountId)
  .setAdminKey(adminKey)
  .setSupplyKey(supplyKey)
  .setFreezeKey(freezeKey)       // Optional: freeze accounts
  .setKycKey(kycKey)             // Optional: KYC gating
  .setWipeKey(wipeKey)           // Optional: clawback
  .setPauseKey(pauseKey);        // Optional: emergency pause

const response = await tx.execute(client);
const receipt = await response.getReceipt(client);
console.log("Token ID:", receipt.tokenId.toString());
// Output: Token ID: 0.0.XXXXXXX
```

## HTS Key Types

| Key | Purpose | Use Case |
|-----|---------|----------|
| Admin Key | Update/delete token properties | Governance changes |
| Supply Key | Mint/burn tokens | Dynamic supply management |
| Freeze Key | Freeze/unfreeze accounts | Regulatory compliance |
| KYC Key | Grant/revoke KYC status | Securities, regulated assets |
| Wipe Key | Remove tokens from accounts | Clawback for compliance |
| Pause Key | Pause all token operations | Emergency circuit breaker |
| Fee Schedule Key | Update custom fees | Royalties, transfer fees |

**Important:** Once a key is set to null or removed, it cannot be added back. If you create a token without a freeze key, you can never add freeze capability later. Plan your key structure before deploying to mainnet.

## When to Use HTS

- Creating fungible tokens (like ERC-20 but cheaper)
- Minting NFTs (like ERC-721 but native)
- Agent identity tokens
- Payment tokens for agent marketplaces
- Any token that needs built-in compliance (KYC/freeze/wipe)
