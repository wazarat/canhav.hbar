[HederaSkills](index.html) / why-hedera

        # Why Hedera

Hedera is NOT just another L1. Here's what makes it fundamentally different — and why your AI agent's assumptions are probably wrong.





          ## ⚠ What You Probably Got Wrong

            - **"Hedera is a blockchain."** — No. Hedera uses Hashgraph, an aBFT (asynchronous Byzantine Fault Tolerant) consensus algorithm. It's a DAG (Directed Acyclic Graph), not a chain of blocks. Transactions don't wait to be bundled into blocks.
            - **"HBAR is a governance token."** — No. HBAR is the native utility token used to pay network fees and for staking. Governance is handled by the Governing Council, not token holders.
            - **"Hedera is centralized because of the Governing Council."** — The Council has 39 term-limited members from diverse industries and geographies. No single member can control the network. Node operation is being progressively decentralized.
            - **"Smart contracts are the only way to create tokens."** — Wrong. HTS (Hedera Token Service) creates tokens at the protocol level, without smart contracts. It's faster, cheaper, and has built-in compliance features.
            - **"Hedera is proprietary."** — The Hashgraph patent existed but the code was open-sourced under the Linux Foundation as "Hiero" in late 2024. It's fully open source now.



        ## What Hedera Actually Is

Hedera is a public distributed ledger powered by the **Hashgraph consensus algorithm**. Unlike blockchains that batch transactions into blocks and use proof-of-work or proof-of-stake leader selection, Hashgraph uses **gossip-about-gossip** and **virtual voting** to achieve consensus without a leader, without blocks, and without wasted computation.



            10,000+
            TPS (native)


            3-5s
            Finality


            $0.0001
            Avg transaction


            0
            MEV exploits



        ### aBFT Consensus — The Gold Standard

Asynchronous Byzantine Fault Tolerant (aBFT) is the highest security category for distributed consensus. It means the network reaches agreement even if:


          - Up to 1/3 of nodes are malicious
          - Messages are delayed, reordered, or lost (asynchronous network)
          - There is no trusted leader or coordinator


Most blockchains achieve weaker guarantees. Ethereum's Casper FFG is *partially synchronous* BFT — it assumes messages arrive within a known time bound. Hashgraph makes no such assumption.

        ### Gossip-About-Gossip

Instead of a leader proposing blocks, every node **gossips** transactions to random other nodes. Each gossip event includes a hash of the previous gossip events it knows about — that's the "gossip about gossip." This creates a data structure (the hashgraph) that lets every node independently compute what a fair virtual vote would have been, without actually sending vote messages.


**Result:** No mining, no block proposals, no leader election, no wasted work. Every piece of communication contributes to consensus.

        ### The Governing Council

Hedera is governed by a council of up to **39 organizations**, each serving limited terms. Current members include:


          - **Tech:** Google, IBM, Dell, Wipro, Tata Communications
          - **Finance:** Standard Bank, Shinhan Bank, DBS
          - **Enterprise:** Boeing, Deutsche Telekom, Dentons, Avery Dennison
          - **Education:** University College London, IIT Madras, LSE


Each council member runs a consensus node, pays an annual fee, and has equal voting power. No single entity can own more than a proportional share. This isn't "decentralized" in the Ethereum sense, but it's a deliberate design choice: **known, accountable entities with real reputations** rather than anonymous validators.

        ### EVM Compatibility

Hedera runs **Hyperledger Besu** (the same EVM used by many Ethereum L2s) as its Smart Contract Service (HSCS). This means:


          - Solidity contracts deploy and run natively
          - Hardhat, Foundry, and MetaMask work via JSON-RPC Relay
          - OpenZeppelin contracts are compatible
          - Ethers.js and Web3.js work with the relay endpoint


**But here's the key insight:** For many use cases, you don't need smart contracts at all. HTS handles token creation, transfers, and compliance natively at the protocol level — faster and cheaper than deploying an ERC-20.

        ### Open Source Under Hiero

In late 2024, Hedera transitioned its codebase to the Linux Foundation under the project name **Hiero**. The Hashgraph consensus algorithm, previously protected by patent (owned by Swirlds, co-founded by Leemon Baird), is now open source. The patent still exists technically but is irrevocably licensed to the open source project.


This means: anyone can fork and use the code. The IP concern that kept some developers away is resolved.

        ## When to Choose Hedera


**Use Hedera when you need:** Predictable costs (USD-denominated fees), enterprise compliance (built-in KYC/freeze keys), high throughput (10k+ TPS), fair ordering (no MEV), or a governed network with known validators. **Don't use Hedera if:** You need maximum decentralization with anonymous validators, composability with the largest DeFi ecosystem (that's Ethereum), or censorship resistance against nation-state actors (Governing Council members are known entities).






      [All Skills](index.html)
      [Costs →](costs.html)