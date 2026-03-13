[HederaSkills](index.html) / wallets

        # Wallets & Accounts

Hedera accounts are NOT Ethereum addresses. Understand the account model, wallet options, and key management before you build.





          ## ⚠ What You Probably Got Wrong

            - **"Hedera uses 0x addresses like Ethereum."** — Hedera native accounts use the format `0.0.XXXX` (shard.realm.number). EVM-style 0x addresses also work via alias accounts, but they're not the primary addressing system.
            - **"Anyone can create an account for free."** — No. Account creation costs ~$0.05 and requires an existing funded account to pay. Someone must bootstrap your first account.
            - **"MetaMask is the main Hedera wallet."** — MetaMask works for HSCS smart contract interactions via JSON-RPC Relay, but it doesn't support native Hedera features (HTS, HCS, account management). HashPack is the primary Hedera-native wallet.
            - **"Hedera only supports one key type."** — Hedera natively supports ED25519, ECDSA (secp256k1), and threshold/multi-sig key structures. You can even change an account's keys without changing its ID.



        ## The Account Model

Hedera accounts have a unique structure:


          - **Account ID:** `0.0.XXXX` format — shard.realm.number. Example: `0.0.1234567`
          - **Alias:** An EVM address (0x...) or public key that maps to an account ID
          - **Key:** The cryptographic key(s) that control the account — can be changed
          - **Balance:** HBAR and associated HTS tokens
          - **Token associations:** Accounts must explicitly associate with HTS tokens before receiving them (prevents spam)


        ### Auto-Created Alias Accounts

When you send HBAR or tokens to an EVM address (0x...) that doesn't have a Hedera account, the network **auto-creates an alias account**. This bridges the gap between Ethereum and Hedera addressing:

```
// Sending to an EVM address auto-creates an account
const transfer = new TransferTransaction()
  .addHbarTransfer(myAccountId, new Hbar(-10))
  .addHbarTransfer(AccountId.fromEvmAddress(0, 0, evmAddress), new Hbar(10));

await transfer.execute(client);
// A new Hedera account is created with evmAddress as alias
// The account can now be accessed via either 0.0.XXXX or 0x...
```

        ## Wallet Options




                Wallet
                Type
                Best For
                Notes




                HashPack
                Browser Extension + Mobile
                Full Hedera features
                Dominant Hedera wallet. HTS, HCS, staking, dApp browser.


                Blade Wallet
                Mobile + SDK
                Mobile-first, embeddable
                BladeSDK for dApp integration. Good UX.


                Kabila
                Mobile
                NFT-focused
                Popular in Hedera NFT community.


                MetaMask
                Browser Extension
                HSCS contracts only
                Works via JSON-RPC Relay. No native Hedera features.


                HashPack Snap
                MetaMask Snap
                MetaMask + Hedera
                Adds Hedera native support to MetaMask.





        ## Key Management

Hedera has a uniquely flexible key model:

        ### Supported Key Types

          - **ED25519:** Hedera's default key type. Smaller signatures, faster verification. Used by HashPack and most Hedera-native tooling.
          - **ECDSA (secp256k1):** Ethereum-compatible key type. Required for MetaMask / JSON-RPC Relay compatibility.


        ### Multi-Sig and Threshold Keys

```
import { KeyList, PrivateKey } from "@hashgraph/sdk";

// 2-of-3 multi-sig
const key1 = PrivateKey.generateED25519();
const key2 = PrivateKey.generateED25519();
const key3 = PrivateKey.generateED25519();

const thresholdKey = new KeyList(
  [key1.publicKey, key2.publicKey, key3.publicKey],
  2  // threshold: 2 of 3 must sign
);

const accountTx = new AccountCreateTransaction()
  .setKey(thresholdKey)
  .setInitialBalance(new Hbar(10));
```

        ### Key Rotation

Unlike Ethereum (where your address IS your key), Hedera lets you **change an account's key without changing its account ID**. This is critical for security:

```
// Rotate an account's key — the account ID stays the same
const updateTx = new AccountUpdateTransaction()
  .setAccountId(myAccountId)
  .setKey(newPublicKey);  // Replace the old key

// Must be signed by BOTH old key and new key
await updateTx
  .freezeWith(client)
  .sign(oldPrivateKey)
  .sign(newPrivateKey)
  .execute(client);
```



**For AI agents:** Use ED25519 keys for pure Hedera operations (cheaper, faster). Use ECDSA keys if you need MetaMask or EVM tool compatibility. For production systems, use threshold keys (multi-sig) to prevent single points of failure.





      [← Native Services](native-services.html)
      [All Skills](index.html)
      [Tools →](tools.html)