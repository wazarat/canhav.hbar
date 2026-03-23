[HederaSkills](index.html) / costs

        # Fees & Costs

Hedera fees are USD-denominated, predictable, and orders of magnitude cheaper than Ethereum mainnet. No gas auctions. No priority fees. No MEV tax.





          ## ⚠ What You Probably Got Wrong

            - **"Hedera fees are like Ethereum gas — variable and unpredictable."** — No. Hedera fees are fixed in USD and converted to HBAR at the current exchange rate. A token transfer always costs ~$0.001 regardless of network congestion.
            - **"Cheaper means less secure."** — Hedera's low costs come from algorithmic efficiency (Hashgraph), not from cutting security corners. aBFT consensus is the gold standard.
            - **"You need to estimate gas."** — For native services (HTS, HCS), there's no gas concept. Fees are flat. For HSCS smart contracts, gas exists but is far cheaper than Ethereum.



        ## Hedera Fee Schedule

All fees are **denominated in USD** and paid in HBAR at the current exchange rate. This means your costs don't fluctuate with HBAR price volatility — they fluctuate with USD.





                Operation
                Hedera Cost (USD)
                Ethereum L1 Equivalent
                Savings




                Token Transfer (HTS)
                $0.001
                $0.50 - $5.00
                500-5,000x


                HCS Message Submit
                $0.0001
                N/A (calldata: $1-10)
                10,000x+


                Token Creation (HTS)
                $1.00
                $50 - $500 (deploy ERC-20)
                50-500x


                Account Creation
                $0.05
                N/A (implicit)
                —


                Smart Contract Call
                $0.05 - $0.50
                $1 - $50+
                10-100x


                Smart Contract Deploy
                $0.50 - $5.00
                $50 - $5,000
                50-1,000x


                NFT Mint (HTS)
                $0.05
                $5 - $50
                100-1,000x


                Consensus Timestamp
                $0.0001
                N/A
                —





        ### Ethereum L2 Comparison

L2s like Arbitrum, Optimism, and Base have dramatically lowered Ethereum costs. But Hedera still wins on many operations:





                Operation
                Hedera
                Arbitrum/Base
                Notes




                Token Transfer
                $0.001
                $0.01 - $0.10
                Hedera 10-100x cheaper


                Simple Swap
                $0.05 - $0.20
                $0.05 - $0.30
                Roughly comparable


                NFT Mint
                $0.05
                $0.05 - $0.50
                Hedera via HTS is cheaper


                Data Logging
                $0.0001 (HCS)
                $0.001 - $0.01
                HCS is purpose-built for this





        ## Why Fees Are Predictable
        ### No Gas Auctions

On Ethereum, users compete for block space by bidding up gas prices. During high demand, a simple transfer can cost $50+. On Hedera, there are no blocks to fill and no auction mechanism. Every transaction pays the same fixed USD fee regardless of network load.

        ### No Priority Fees

Ethereum's EIP-1559 introduced base fee + priority tip. Hedera has neither. The fee is the fee.

        ### No MEV Tax

On Ethereum, miners/validators can reorder transactions to extract value (MEV). This adds a hidden "tax" on DeFi users through sandwich attacks, frontrunning, and backrunning. Hedera's **fair transaction ordering** (consensus timestamps) eliminates this entirely. Transactions are ordered by their consensus timestamp, not by who pays more.

        ## Fee Calculation Example

```
// Cost to create a fungible token on Hedera via HTS
// Fixed fee: $1.00 USD (paid in HBAR)
// If HBAR = $0.08, you pay 12.5 HBAR

// Cost to do 1,000 token transfers
// 1,000 × $0.001 = $1.00 total
// On Ethereum mainnet: 1,000 × $2.00 = $2,000.00

// Cost to log 10,000 messages via HCS
// 10,000 × $0.0001 = $1.00 total
// On Ethereum calldata: 10,000 × $2.00 = $20,000.00
```



**Bottom line:** For high-volume operations (IoT logging, supply chain tracking, micropayments), Hedera is 1,000-10,000x cheaper than Ethereum L1. For DeFi swaps, Hedera is comparable to L2s but with the added benefit of no MEV and native token support.





      [← Why Hedera](why-hedera.html)
      [All Skills](index.html)
      [Native Services →](native-services.html)