[HederaSkills](index.html) / tools

        # Developer Tools

Official SDKs in 7 languages, Ethereum-compatible tooling via JSON-RPC Relay, and a Docker-based local dev environment.





          ## ⚠ What You Probably Got Wrong

            - **"Hedera has poor developer tooling."** — Hedera has official SDKs in Java, JavaScript, Go, Python, Swift, Rust, and C++. Plus full Ethereum tool compatibility via JSON-RPC Relay.
            - **"I can't use Hardhat/Foundry."** — You can. JSON-RPC Relay exposes an Ethereum-compatible endpoint. Configure Hardhat/Foundry to point at it and deploy Solidity contracts normally.
            - **"There's no block explorer."** — HashScan (hashscan.io) is the primary explorer. It shows accounts, transactions, tokens, contracts, and topics.



        ## Official Hedera SDKs




                Language
                Package
                Status



              JavaScript/TypeScript`@hashgraph/sdk`Primary — most examples use this
              Java`com.hedera.hashgraph:sdk`Production-grade, enterprise focus
              Go`github.com/hashgraph/hedera-sdk-go`Stable
              Python`hedera-sdk-py`Community-maintained
              Swift`HederaSwiftSDK`Mobile/iOS
              Rust`hedera-sdk-rust`Growing
              C++`hedera-sdk-cpp`IoT/embedded use cases




        ### Quick Start (JavaScript)

```
npm install @hashgraph/sdk

import { Client, AccountBalanceQuery } from "@hashgraph/sdk";

// Connect to mainnet
const client = Client.forMainnet();
client.setOperator(process.env.HEDERA_ACCOUNT_ID,
                   process.env.HEDERA_PRIVATE_KEY);

// Query an account balance
const balance = await new AccountBalanceQuery()
  .setAccountId("0.0.1234567")
  .execute(client);

console.log("HBAR:", balance.hbars.toString());
console.log("Tokens:", balance.tokens.toString());
```

        ## JSON-RPC Relay

The **Hedera JSON-RPC Relay** translates Ethereum JSON-RPC calls to Hedera transactions. This is how Ethereum-native tools work with Hedera:





                Tool
                Works via Relay?
                Configuration



              HardhatYesSet network RPC to relay endpoint
              FoundryYes`--rpc-url` flag
              MetaMaskYesAdd custom network
              Ethers.jsYes`new JsonRpcProvider(relayUrl)`
              ViemYesCustom chain config
              The GraphYesSubgraph deployment




        ### Hardhat Configuration

```
// hardhat.config.js
module.exports = {
  solidity: "0.8.24",
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [process.env.HEDERA_ECDSA_PRIVATE_KEY],
      chainId: 296  // Hedera Testnet
    },
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: [process.env.HEDERA_ECDSA_PRIVATE_KEY],
      chainId: 295  // Hedera Mainnet
    }
  }
};
```

        ## Block Explorer — HashScan

**HashScan** (`hashscan.io`) is the primary Hedera block explorer. It shows:


          - Account details, balances, and token associations
          - Transaction history with consensus timestamps
          - Token details (HTS tokens, NFTs)
          - Smart contract source code and interactions
          - HCS topic messages
          - Network statistics and node info


        ## Mirror Node API

The **Mirror Node** provides a REST API for querying historical data. It's the "read" layer — consensus nodes handle "write."

```
# Get account info
curl "https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/0.0.1234567"

# Get HCS topic messages
curl "https://mainnet-public.mirrornode.hedera.com/api/v1/topics/0.0.XXXXX/messages"

# Get token info
curl "https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/0.0.456858"

# Get transaction details
curl "https://mainnet-public.mirrornode.hedera.com/api/v1/transactions/0.0.XXXXX-TIMESTAMP"
```

        ### Third-Party Mirror Node Providers

          - **Arkhia:** Premium mirror node with enhanced APIs, WebSocket support
          - **Validation Cloud:** Enterprise-grade node infrastructure
          - **Hashio (by Swirlds Labs):** Free JSON-RPC Relay endpoint


        ## Local Development

The **Hedera Local Node** is a Docker-based local development environment that runs a full Hedera network on your machine:

```
# Install and start
npm install @hashgraph/hedera-local -g
hedera start

# Provides:
# - Consensus node on localhost
# - Mirror node REST API on localhost:5551
# - JSON-RPC Relay on localhost:7546
# - Pre-funded test accounts
```



**Recommended stack for AI agents:** Use `@hashgraph/sdk` (JavaScript) for native Hedera operations. Use Hardhat + JSON-RPC Relay for Solidity contracts. Use the Mirror Node REST API for reading data. Use HashScan for debugging.





      [← Wallets](wallets.html)
      [All Skills](index.html)
      [DeFi →](defi.html)