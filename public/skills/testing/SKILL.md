# Testing — Hedera Smart Contracts & Applications

> Test HSCS contracts with Foundry, mock HTS precompiles, and validate HCS message flows. The same Solidity testing tools work — but Hedera has unique quirks.

## What You Probably Got Wrong

- **"I can use Hardhat or Foundry exactly like Ethereum."** — Mostly yes for HSCS contracts. But HTS precompile calls (address `0x167`) can't be simulated in standard Foundry unless you mock them. Plan your test strategy around this.
- **"I need a Hedera node to test."** — Not always. Pure Solidity logic tests run in Foundry's EVM. For HTS/HCS integration tests, use the Hedera Local Node (Docker).
- **"Testing on testnet is free."** — Yes, testnet HBAR is free from the faucet (`portal.hedera.com`), but testnet has rate limits and occasional instability. Use local node for CI.

## Test Strategy by Layer

| Layer | Tool | What to Test |
|-------|------|--------------|
| Solidity logic | Foundry (`forge test`) | Access control, math, escrow flows, reentrancy |
| HTS integration | Hedera Local Node | Token create, transfer, associate, KYC, freeze |
| HCS messaging | Hedera Local Node | Topic create, message submit, message ordering |
| API routes | Jest / Vitest | Route handlers, input validation, error cases |
| Frontend | Playwright / Cypress | Wallet connect flow, agent hire UX, dashboard |

## Foundry Testing for HSCS

Standard Foundry works for Solidity contracts deployed on HSCS:

```solidity
// test/Escrow.t.sol
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Escrow.sol";

contract EscrowTest is Test {
    Escrow escrow;
    address buyer = makeAddr("buyer");
    address worker = makeAddr("worker");

    function setUp() public {
        escrow = new Escrow();
        vm.deal(buyer, 100 ether);
    }

    function test_CreateAndFundJob() public {
        vm.prank(buyer);
        uint256 jobId = escrow.createJob(worker, 1 ether);

        vm.prank(buyer);
        escrow.fundJob{value: 1 ether}(jobId);

        (,, uint256 expected, uint256 amount,) = escrow.getJob(jobId);
        assertEq(amount, 1 ether);
    }

    function testFuzz_CannotOverfund(uint256 extra) public {
        vm.assume(extra > 0 && extra < 100 ether);
        vm.prank(buyer);
        uint256 jobId = escrow.createJob(worker, 1 ether);

        vm.prank(buyer);
        escrow.fundJob{value: 1 ether + extra}(jobId);
        // Verify only expected amount retained
    }
}
```

**Key difference on Hedera:** `msg.value` uses tinybars (1e8), not wei (1e18). In Foundry tests, the EVM uses wei. Write conversion helpers and test both units.

## Mocking HTS Precompile

The HTS system contract at `0x167` doesn't exist in Foundry's local EVM. Options:

1. **Mock the precompile** with a contract that simulates HTS responses
2. **Skip HTS calls in unit tests** and test them in integration tests on local node
3. **Use `vm.mockCall`** in Foundry to simulate precompile returns

```solidity
// Mock HTS precompile response
vm.mockCall(
    address(0x167),
    abi.encodeWithSignature("associateToken(address,address)"),
    abi.encode(int32(22)) // HTS success code
);
```

## Hedera Local Node for Integration Tests

```bash
# Start local Hedera node (Docker required)
npx @hashgraph/hedera-local start

# Run integration tests against local node
# Local node exposes:
# - JSON-RPC Relay: http://localhost:7546
# - Mirror Node: http://localhost:5551
# - gRPC: localhost:50211
```

## What to Test, What Not to Test

**Test these:**
- Escrow fund/release math (tinybar precision)
- Access control on all admin functions
- Agent registration with valid/invalid URIs
- Reputation feedback value ranges
- Edge cases: zero amounts, duplicate registrations, unauthorized calls

**Don't test these in unit tests:**
- OpenZeppelin internals (they're already audited)
- HTS native operations (test on local node instead)
- HCS message delivery ordering (that's Hedera's consensus guarantee)

## CI Pipeline

```yaml
# .github/workflows/test.yml
- name: Run Solidity tests
  run: cd contracts && forge test -vvv

- name: Start Hedera local node
  run: npx @hashgraph/hedera-local start --detached

- name: Run integration tests
  run: pnpm test:integration
  env:
    HEDERA_NETWORK: local
    HEDERA_ACCOUNT_ID: "0.0.1002"
    HEDERA_PRIVATE_KEY: "302..."
```
