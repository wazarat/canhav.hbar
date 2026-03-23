// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Escrow.sol";

contract EscrowTest is Test {
    Escrow public escrow;
    address public platform = makeAddr("platform");
    address public buyer = makeAddr("buyer");
    address public worker = makeAddr("worker");

    function setUp() public {
        escrow = new Escrow(platform);
        vm.deal(buyer, 100 ether);
        vm.deal(worker, 1 ether);
    }

    function test_createJob() public {
        vm.prank(buyer);
        uint256 jobId = escrow.createJob(worker, 1 ether);

        assertEq(jobId, 0);
        (address b, address w, uint256 expected, uint256 amount, Escrow.JobStatus status) = escrow.getJob(0);
        assertEq(b, buyer);
        assertEq(w, worker);
        assertEq(expected, 1 ether);
        assertEq(amount, 0);
        assertEq(uint256(status), 0); // PendingFund
    }

    function test_fundJob() public {
        vm.prank(buyer);
        escrow.createJob(worker, 1 ether);

        vm.prank(buyer);
        escrow.fundJob{value: 1 ether}(0);

        (, , , uint256 amount, Escrow.JobStatus status) = escrow.getJob(0);
        assertEq(amount, 1 ether);
        assertEq(uint256(status), 1); // Funded
    }

    function test_fundJob_wrongAmount() public {
        vm.prank(buyer);
        escrow.createJob(worker, 1 ether);

        vm.prank(buyer);
        vm.expectRevert("Wrong amount");
        escrow.fundJob{value: 0.5 ether}(0);
    }

    function test_completeJob() public {
        vm.prank(buyer);
        escrow.createJob(worker, 1 ether);

        vm.prank(buyer);
        escrow.fundJob{value: 1 ether}(0);

        uint256 workerBefore = worker.balance;
        uint256 platformBefore = platform.balance;

        vm.prank(buyer);
        escrow.completeJob(0);

        // 80% to worker, 20% to platform
        assertEq(worker.balance - workerBefore, 0.8 ether);
        assertEq(platform.balance - platformBefore, 0.2 ether);

        (, , , , Escrow.JobStatus status) = escrow.getJob(0);
        assertEq(uint256(status), 2); // Completed
    }

    function test_completeJob_notAuthorized() public {
        vm.prank(buyer);
        escrow.createJob(worker, 1 ether);

        vm.prank(buyer);
        escrow.fundJob{value: 1 ether}(0);

        vm.prank(worker);
        vm.expectRevert("Not authorized");
        escrow.completeJob(0);
    }

    function test_fullLifecycle() public {
        // Create
        vm.prank(buyer);
        uint256 jobId = escrow.createJob(worker, 10 ether);

        // Fund
        vm.prank(buyer);
        escrow.fundJob{value: 10 ether}(jobId);

        // Complete (owner can also complete)
        escrow.completeJob(jobId);

        (, , , , Escrow.JobStatus status) = escrow.getJob(jobId);
        assertEq(uint256(status), 2);
    }

    function test_setPlatformFee() public {
        escrow.setPlatformFeeBps(1000);
        assertEq(escrow.platformFeeBps(), 1000);
    }

    function test_setPlatformFee_tooHigh() public {
        vm.expectRevert("Fee too high");
        escrow.setPlatformFeeBps(5001);
    }

    function test_createJob_invalidWorker() public {
        vm.prank(buyer);
        vm.expectRevert("Invalid worker");
        escrow.createJob(address(0), 1 ether);
    }

    function test_createJob_invalidAmount() public {
        vm.prank(buyer);
        vm.expectRevert("Invalid amount");
        escrow.createJob(worker, 0);
    }
}
