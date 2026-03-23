// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/ReputationRegistry.sol";
import "../src/Escrow.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        AgentRegistry agentRegistry = new AgentRegistry();
        ReputationRegistry reputationRegistry = new ReputationRegistry();
        Escrow escrow = new Escrow(deployer);

        vm.stopBroadcast();

        console.log("AgentRegistry deployed at:", address(agentRegistry));
        console.log("ReputationRegistry deployed at:", address(reputationRegistry));
        console.log("Escrow deployed at:", address(escrow));
    }
}
