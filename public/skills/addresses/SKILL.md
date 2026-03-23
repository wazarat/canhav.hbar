[HederaSkills](index.html) / addresses

        # Key Addresses & IDs

Every address, token ID, endpoint, and URL your AI agent needs to interact with Hedera in production.





          ## ⚠ What You Probably Got Wrong

            - **"HBAR has a contract address."** — No. HBAR is the native currency. It doesn't have a token ID or contract address. It's like ETH on Ethereum — native, not a token.
            - **"I can use Ethereum-format addresses for everything."** — EVM addresses (0x...) work for HSCS smart contract interactions. But for native Hedera operations (HTS, HCS, transfers), use the `0.0.XXXX` format.
            - **"Testnet and mainnet use the same endpoints."** — No. Different mirror nodes, different relay endpoints, different chain IDs. Don't mix them up.



        ## Network Endpoints




                Service
                Mainnet
                Testnet




                Mirror Node REST API
                `mainnet-public.mirrornode.hedera.com`
                `testnet.mirrornode.hedera.com`


                JSON-RPC Relay (Hashio)
                `mainnet.hashio.io/api`
                `testnet.hashio.io/api`


                Chain ID
                `295`
                `296`


                Block Explorer
                `hashscan.io/mainnet`
                `hashscan.io/testnet`


                Testnet Faucet
                —
                `portal.hedera.com`





        ## Key Token IDs




                Token
                Token ID
                Type
                Notes




                HBAR
                *native*
                Native currency
                No token ID — it's the native gas/utility token


                USDC
                `0.0.456858`
                HTS Fungible
                Circle's native USDC on Hedera


                HBARX
                `0.0.834116`
                HTS Fungible
                Stader Labs liquid staking token


                SAUCE
                `0.0.731861`
                HTS Fungible
                SaucerSwap governance token


                KARATE
                `0.0.2283230`
                HTS Fungible
                Karate Combat token


                DOVU
                `0.0.1228330`
                HTS Fungible
                DOVU carbon credit platform token





        ## Key Protocol Addresses




                Protocol
                Contract / Account
                Description




                SaucerSwap V1 Router
                `0.0.1062784`
                V1 AMM router contract


                SaucerSwap V2 Router
                `0.0.3949406`
                V2 concentrated liquidity router


                Bonzo Finance
                `0.0.5203019`
                Lending pool core contract


                Stader HBARX
                `0.0.834116`
                Liquid staking contract





        ## MetaMask Configuration

To add Hedera to MetaMask for HSCS interactions:





                Field
                Mainnet Value
                Testnet Value



              Network NameHedera MainnetHedera Testnet
              RPC URL`https://mainnet.hashio.io/api``https://testnet.hashio.io/api`
              Chain ID`295``296`
              Currency Symbol`HBAR``HBAR`
              Block Explorer`https://hashscan.io/mainnet``https://hashscan.io/testnet`




        ## Mirror Node API Examples

```
# Account info
GET https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/{accountId}

# Token info
GET https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/{tokenId}

# Account token balances
GET https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/{accountId}/tokens

# HCS topic messages
GET https://mainnet-public.mirrornode.hedera.com/api/v1/topics/{topicId}/messages

# Transaction details
GET https://mainnet-public.mirrornode.hedera.com/api/v1/transactions/{transactionId}

# Network supply
GET https://mainnet-public.mirrornode.hedera.com/api/v1/network/supply

# NFTs for a token
GET https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/{tokenId}/nfts
```

        ## Quick Reference


**Mainnet JSON-RPC:** `https://mainnet.hashio.io/api` (Chain ID: 295)


**Testnet JSON-RPC:** `https://testnet.hashio.io/api` (Chain ID: 296)


**Mirror Node:** `https://mainnet-public.mirrornode.hedera.com`


**Explorer:** `https://hashscan.io`


**Testnet Faucet:** `https://portal.hedera.com`


**USDC Token ID:** `0.0.456858`





      [← Security](security.html)
      [All Skills](index.html)