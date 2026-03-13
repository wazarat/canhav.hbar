# HSCS — Hedera Smart Contract Service

> Full EVM implementation via Hyperledger Besu. If you've written Solidity for Ethereum, it works on Hedera.

## What You Probably Got Wrong

- **"Hedera smart contracts are different from Ethereum smart contracts."** — They're the same. HSCS runs Hyperledger Besu (EVM). Your Solidity code works. Your Hardhat config works. The difference is that HSCS has system contracts that bridge to HTS tokens.

## What Works on HSCS

- Solidity 0.8.x contracts
- OpenZeppelin libraries
- Hardhat / Foundry deployment
- MetaMask via JSON-RPC Relay
- Ethers.js / Web3.js / Viem
- The Graph (subgraph indexing)

## Key Differences from Ethereum EVM

1. **Gas costs are different** — Hedera uses its own gas schedule. Generally cheaper than Ethereum.
2. **msg.value uses tinybars** — 1 HBAR = 10^8 tinybars (NOT 10^18 like wei). Use `amountHbar * 1e8` for all value transfers.
3. **System contracts** — HSCS provides precompiled contracts that let Solidity interact with HTS tokens natively (address `0x167`).
4. **HIP-755: Scheduled Transactions** — Smart contracts can schedule their own future executions on-chain. No external keepers needed.

## Deployment with Foundry

```bash
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"

[rpc_endpoints]
hedera_testnet = "https://testnet.hashio.io/api"
hedera_mainnet = "https://mainnet.hashio.io/api"
```

```bash
forge script script/Deploy.s.sol \
  --rpc-url https://testnet.hashio.io/api \
  --broadcast --slow \
  --verify --verifier sourcify \
  --verifier-url https://server-verify.hashscan.io/api \
  --chain-id 296
```

## HTS System Contracts (Precompile at 0x167)

Solidity contracts can interact with HTS tokens via the system contract at `0x167`:

```solidity
// Associate an HTS token with the contract
IHederaTokenService(0x167).associateToken(address(this), tokenAddress);

// Transfer HTS tokens from contract
IHederaTokenService(0x167).transferToken(tokenAddress, from, to, amount);
```

## When to Use HSCS

- DeFi composability (AMMs, lending, etc.)
- Custom logic on token transfers
- Complex multi-party agreements (escrow, governance)
- Porting existing Ethereum dApps
- ERC-8004 agent identity NFTs
