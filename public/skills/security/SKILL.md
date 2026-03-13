[HederaSkills](index.html) / security

        # Security Patterns

No MEV, no sandwich attacks, zero consensus failures since 2019. But smart contract security still matters — Solidity bugs don't care which chain you're on.





          ## ⚠ What You Probably Got Wrong

            - **"Hedera has the same MEV problems as Ethereum."** — No. Hedera's fair transaction ordering (consensus timestamps) means validators cannot reorder transactions for profit. No sandwich attacks, no frontrunning, no backrunning.
            - **"Hedera's security is untested."** — Hedera mainnet launched in September 2019 and has processed billions of transactions without a single consensus failure or chain halt. The only significant incident was a March 2023 smart contract exploit (not consensus-level).
            - **"If I'm on Hedera, my smart contracts are automatically safe."** — No. HSCS runs the EVM. All Solidity vulnerabilities (reentrancy, overflow, access control) apply exactly as they do on Ethereum. Use the same security practices.



        ## No MEV — Fair Transaction Ordering

This is Hedera's biggest security advantage for DeFi users. On Ethereum:


          - Validators see pending transactions in the mempool
          - They can reorder, insert, or censor transactions
          - Sandwich attacks cost DeFi users billions annually
          - Flashbots and MEV-boost partially mitigate but don't eliminate


On Hedera:


          - Transactions get consensus timestamps based on when they arrive
          - Ordering is determined by the hashgraph, not by validators' choices
          - No mempool to observe pending transactions
          - **Result: zero MEV extracted in Hedera's entire history**


        ## Network Reliability


            0
            Consensus failures


            0
            Chain halts


            Sept 2019
            Mainnet launch


            100%
            Consensus uptime



        ## Smart Contract Security

Since HSCS runs the EVM, all Ethereum smart contract security practices apply:

        ### Use OpenZeppelin

OpenZeppelin contracts work on Hedera via HSCS. Use them for:


          - `AccessControl` — Role-based permissions
          - `ReentrancyGuard` — Prevent reentrancy attacks
          - `Pausable` — Emergency stop
          - `Ownable` — Simple ownership


        ### Get Audited

All Hedera smart contract audit firms work with standard Solidity. Major Hedera projects use:


          - Hacken
          - CertiK
          - Runtime Verification
          - QuillAudits


        ## Key Security on Hedera

        ### Key Rotation

Unlike Ethereum, Hedera lets you **change an account's key without changing its ID**. This means:


          - If a key is compromised, rotate it immediately
          - All references to the account (0.0.XXXX) remain valid
          - Tokens, associations, and history stay attached to the account


        ### Admin Keys on Tokens


**Critical:** Before interacting with any HTS token, check its key structure. A token with an active admin key can be modified by the key holder. A token with a wipe key means your balance can be removed. A token with no admin key is immutable. Always verify via HashScan or Mirror Node API before holding significant value in any HTS token.



```
// Check token keys via Mirror Node API
const response = await fetch(
  "https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/0.0.XXXXXX"
);
const token = await response.json();

console.log("Admin Key:", token.admin_key);    // null = immutable
console.log("Freeze Key:", token.freeze_key);  // null = can't freeze
console.log("Wipe Key:", token.wipe_key);      // null = can't wipe
console.log("Pause Key:", token.pause_key);    // null = can't pause
console.log("Supply Key:", token.supply_key);  // null = fixed supply
```

        ## The March 2023 Incident

In March 2023, an attacker exploited a vulnerability in the HSCS smart contract decompiler code to drain liquidity pools on SaucerSwap, Pangolin, and HeliSwap. Key facts:


          - This was a **smart contract layer** issue, NOT a consensus failure
          - The hashgraph consensus itself was never compromised
          - Total losses were ~$570K — small vs typical Ethereum DeFi exploits
          - Hedera paused mainnet smart contracts (controversial but effective) to stop the attack
          - The vulnerability was patched within hours




**Security checklist for AI agents:** (1) Use threshold keys for any account holding significant value. (2) Check HTS token keys before holding tokens. (3) Audit all smart contracts — Solidity bugs are chain-agnostic. (4) Take advantage of no-MEV: you don't need MEV protection on Hedera. (5) Use key rotation proactively, not just reactively.





      [← AI Agents](ai-agents.html)
      [All Skills](index.html)
      [Addresses →](addresses.html)