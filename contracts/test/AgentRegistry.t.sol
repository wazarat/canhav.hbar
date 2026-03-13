// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        registry = new AgentRegistry();
    }

    function test_register() public {
        vm.prank(alice);
        uint256 agentId = registry.register('{"name":"Test Agent","capabilities":["test"]}');

        assertEq(agentId, 0);
        assertEq(registry.ownerOf(0), alice);
        assertEq(registry.agentWallets(0), alice);
        assertEq(registry.nextAgentId(), 1);
    }

    function test_registerMultiple() public {
        vm.prank(alice);
        registry.register("uri1");

        vm.prank(bob);
        registry.register("uri2");

        assertEq(registry.nextAgentId(), 2);
        assertEq(registry.ownerOf(0), alice);
        assertEq(registry.ownerOf(1), bob);
    }

    function test_setAgentWallet() public {
        vm.prank(alice);
        registry.register("uri");

        vm.prank(alice);
        registry.setAgentWallet(0, bob);

        assertEq(registry.getAgentWallet(0), bob);
    }

    function test_setAgentWallet_revertNotOwner() public {
        vm.prank(alice);
        registry.register("uri");

        vm.prank(bob);
        vm.expectRevert("Not agent owner");
        registry.setAgentWallet(0, bob);
    }

    function test_setAgentURI() public {
        vm.prank(alice);
        registry.register("uri1");

        vm.prank(alice);
        registry.setAgentURI(0, "uri2");

        assertEq(registry.tokenURI(0), "uri2");
    }

    function test_metadata() public {
        vm.prank(alice);
        registry.register("uri");

        vm.prank(alice);
        registry.setMetadata(0, "price", abi.encode(100));

        bytes memory val = registry.getMetadata(0, "price");
        assertEq(abi.decode(val, (uint256)), 100);
    }

    function test_name() public view {
        assertEq(registry.name(), "CanHav Agent");
        assertEq(registry.symbol(), "CHAV");
    }
}
