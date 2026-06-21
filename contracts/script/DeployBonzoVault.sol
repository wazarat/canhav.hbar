// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/bonzo/MockWantToken.sol";
import "../src/bonzo/MockStrategy.sol";
import "../src/bonzo/MockVaultFactory.sol";

/// @notice Deploy testnet Bonzo vault infra for chain adapter smoke tests.
contract DeployBonzoVault is Script {
    function run() external {
        vm.startBroadcast();

        MockWantToken want = new MockWantToken();
        MockStrategy strategy = new MockStrategy(address(want));
        MockVaultFactory factory = new MockVaultFactory();

        // Fund deployer (operator EVM) with want tokens for smoke deposit
        want.mint(msg.sender, 1_000_000 * 1e18);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Bonzo Vault Testnet Deploy ===");
        console.log("BONZO_VAULT_FACTORY=", address(factory));
        console.log("BONZO_SMOKE_STRATEGY_EVM=", address(strategy));
        console.log("BONZO_SMOKE_WANT_TOKEN=", address(want));
        console.log("");
        console.log("Add to .env.local:");
        console.log("BONZO_VAULT_FACTORY=", address(factory));
        console.log("BONZO_SMOKE_STRATEGY_EVM=", address(strategy));
        console.log("");
    }
}
