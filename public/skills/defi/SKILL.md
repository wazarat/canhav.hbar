[HederaSkills](index.html) / defi

        # DeFi on Hedera

A small but fast-growing ecosystem. SaucerSwap dominates, Bonzo Finance handles lending, and HTS tokens offer native compliance advantages.





          ## ⚠ What You Probably Got Wrong

            - **"Hedera has no DeFi."** — Wrong. SaucerSwap alone has seen $300M+ TVL at peak. There are functional DEXs, lending protocols, and liquid staking — all production and audited.
            - **"Hedera DeFi works like Ethereum DeFi."** — Partially. HSCS smart contracts are EVM, so AMM math is the same. But many Hedera DeFi protocols use HTS tokens instead of ERC-20s, which changes how transfers, approvals, and fees work.
            - **"The TVL is too small to matter."** — ~$200M total is small vs Ethereum ($50B+), but it's meaningful and growing. For enterprise use cases and fixed-cost operations, Hedera DeFi offers advantages.



        ## DeFi Protocols

        ### SaucerSwap — Dominant DEX

SaucerSwap is the leading DEX on Hedera, implementing both **Uniswap V2 (constant product AMM)** and **V3 (concentrated liquidity)** mechanics. It handles the majority of Hedera DeFi volume.


          - **TVL:** $300M+ at peak, typically $80-150M
          - **Token:** SAUCE (governance + utility)
          - **Features:** Swap, pool, farm, single-sided staking (Infinity Pool)
          - **HTS native:** Uses HTS tokens, not ERC-20


        ### Other DEXs

          - **HeliSwap:** Alternative DEX with swap, liquidity pools, and farming
          - **Pangolin:** Multi-chain DEX that expanded to Hedera


        ### Bonzo Finance — Lending

The Aave-equivalent on Hedera. Bonzo Finance provides **lending and borrowing** with variable and stable interest rates.


          - Supply assets to earn yield
          - Borrow against collateral
          - Liquidation mechanics similar to Aave
          - Supports HBAR, USDC, HBARX, and major HTS tokens


        ### Stader Labs — Liquid Staking

Stake HBAR and receive **HBARX**, a liquid staking token that accrues staking rewards while remaining usable in DeFi.


          - **APY:** ~5.61% (variable, based on network staking rewards)
          - **Token:** HBARX (1 HBARX = 1 HBAR + accrued rewards)
          - HBARX can be used as collateral in Bonzo Finance, LPs in SaucerSwap


        ## HTS Tokens vs ERC-20 in DeFi

This is the key difference. On Hedera, most DeFi protocols use **HTS tokens** rather than ERC-20 contracts. This affects how your agent interacts with them:





                Feature
                HTS Token
                ERC-20



              Approval`TokenAssociate` + `approve``approve()`
              TransferNative transfer tx or system contract`transfer()`
              ComplianceBuilt-in KYC/freeze/wipe keysCustom implementation
              Gas Cost$0.001 per transfer$0.05-0.20 per transfer
              ComposabilityVia HSCS system contractsNative EVM composability






**For AI agents building DeFi:** Use the SaucerSwap SDK or interact directly with its smart contracts via the JSON-RPC Relay. Token approvals require a two-step process: first `TokenAssociateTransaction` (one-time, ~$0.05), then the standard EVM `approve()` call. Don't forget the association step — it's the #1 error when porting Ethereum DeFi logic to Hedera.



        ## Ecosystem TVL Overview


            ~$200M
            Total Hedera DeFi TVL


            60%+
            SaucerSwap market share


            5.61%
            HBARX staking APY


            $0
            MEV extracted





      [← Tools](tools.html)
      [All Skills](index.html)
      [Enterprise →](enterprise.html)