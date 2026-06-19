// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationRegistry.sol";
import "../src/Escrow.sol";

contract Deploy is Script {
    function run() external {
        address deployer = msg.sender;

        vm.startBroadcast();

        AgentRegistry agentRegistry = new AgentRegistry();
        ReputationRegistry reputationRegistry = new ReputationRegistry();
        Escrow escrow = new Escrow(deployer);

        vm.stopBroadcast();

        console.log("");
        console.log("=== Hedera Testnet Deployment ===");
        console.log("NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=", address(agentRegistry));
        console.log("NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS=", address(reputationRegistry));
        console.log("NEXT_PUBLIC_ESCROW_ADDRESS=", address(escrow));
        console.log("");
    }
}
