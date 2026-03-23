// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Escrow — Two-phase escrow for CanHav HBAR agent marketplace
/// @notice createJob → fundJob → completeJob with 80/20 split
/// @dev Uses tinybars (1e8) for msg.value on Hedera EVM, not wei (1e18)
contract Escrow is Ownable {
    enum JobStatus { PendingFund, Funded, Completed, Disputed }

    struct Job {
        address buyer;
        address worker;
        uint256 expectedAmount;
        uint256 amount;
        JobStatus status;
    }

    uint256 public platformFeeBps = 2000; // 20%
    address public platformWallet;
    uint256 public nextJobId;

    mapping(uint256 => Job) public jobs;

    event JobCreated(uint256 indexed jobId, address indexed buyer, address indexed worker, uint256 expectedAmount);
    event JobFunded(uint256 indexed jobId, address indexed funder, uint256 amount);
    event JobCompleted(uint256 indexed jobId, uint256 workerPayout, uint256 platformPayout);
    event JobDisputed(uint256 indexed jobId);

    constructor(address _platformWallet) Ownable(msg.sender) {
        platformWallet = _platformWallet;
    }

    function createJob(address _worker, uint256 _expectedAmount) external returns (uint256) {
        require(_worker != address(0), "Invalid worker");
        require(_expectedAmount > 0, "Invalid amount");

        uint256 jobId = nextJobId++;
        jobs[jobId] = Job({
            buyer: msg.sender,
            worker: _worker,
            expectedAmount: _expectedAmount,
            amount: 0,
            status: JobStatus.PendingFund
        });

        emit JobCreated(jobId, msg.sender, _worker, _expectedAmount);
        return jobId;
    }

    function fundJob(uint256 _jobId) external payable {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.PendingFund, "Job not pending fund");
        require(msg.value == job.expectedAmount, "Wrong amount");

        job.amount = msg.value;
        job.status = JobStatus.Funded;

        emit JobFunded(_jobId, msg.sender, msg.value);
    }

    function completeJob(uint256 _jobId) external {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Funded, "Job not funded");
        require(msg.sender == job.buyer || msg.sender == owner(), "Not authorized");

        job.status = JobStatus.Completed;

        uint256 platformCut = (job.amount * platformFeeBps) / 10000;
        uint256 workerCut = job.amount - platformCut;

        (bool s1,) = job.worker.call{value: workerCut}("");
        require(s1, "Worker payment failed");

        (bool s2,) = platformWallet.call{value: platformCut}("");
        require(s2, "Platform payment failed");

        emit JobCompleted(_jobId, workerCut, platformCut);
    }

    function getJob(uint256 _jobId) external view returns (
        address buyer,
        address worker,
        uint256 expectedAmount,
        uint256 amount,
        JobStatus status
    ) {
        Job storage job = jobs[_jobId];
        return (job.buyer, job.worker, job.expectedAmount, job.amount, job.status);
    }

    function setPlatformFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 5000, "Fee too high");
        platformFeeBps = _feeBps;
    }

    function setPlatformWallet(address _wallet) external onlyOwner {
        platformWallet = _wallet;
    }
}
