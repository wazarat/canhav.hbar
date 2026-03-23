// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ReputationRegistry.sol";

contract ReputationRegistryTest is Test {
    ReputationRegistry public registry;
    address public reviewer1 = makeAddr("reviewer1");
    address public reviewer2 = makeAddr("reviewer2");

    function setUp() public {
        registry = new ReputationRegistry();
    }

    function test_giveFeedback() public {
        vm.prank(reviewer1);
        registry.giveFeedback(0, 5, "fast", "accurate");

        (uint64 count, int128 total) = registry.getSummary(0);
        assertEq(count, 1);
        assertEq(total, 5);
    }

    function test_multipleFeedback() public {
        vm.prank(reviewer1);
        registry.giveFeedback(0, 5, "fast", "");

        vm.prank(reviewer2);
        registry.giveFeedback(0, 3, "slow", "");

        (uint64 count, int128 total) = registry.getSummary(0);
        assertEq(count, 2);
        assertEq(total, 8);
    }

    function test_revokeFeedback() public {
        vm.prank(reviewer1);
        registry.giveFeedback(0, 5, "fast", "");

        vm.prank(reviewer1);
        registry.revokeFeedback(0, 0);

        (uint64 count, int128 total) = registry.getSummary(0);
        assertEq(count, 0);
        assertEq(total, 0);
    }

    function test_readFeedback() public {
        vm.prank(reviewer1);
        registry.giveFeedback(0, 4, "fast", "reliable");

        (int128 value, string memory tag1, string memory tag2, bool revoked) =
            registry.readFeedback(0, reviewer1, 0);

        assertEq(value, 4);
        assertEq(tag1, "fast");
        assertEq(tag2, "reliable");
        assertFalse(revoked);
    }

    function test_ratingBounds() public {
        vm.prank(reviewer1);
        vm.expectRevert("Rating must be 1-5");
        registry.giveFeedback(0, 0, "", "");

        vm.prank(reviewer1);
        vm.expectRevert("Rating must be 1-5");
        registry.giveFeedback(0, 6, "", "");
    }

    function test_getFeedbackCount() public {
        vm.prank(reviewer1);
        registry.giveFeedback(0, 5, "", "");

        vm.prank(reviewer1);
        registry.giveFeedback(0, 4, "", "");

        assertEq(registry.getFeedbackCount(0, reviewer1), 2);
    }
}
