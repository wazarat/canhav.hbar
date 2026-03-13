// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IReputationRegistry.sol";

/// @title ReputationRegistry — ERC-8004 compatible reputation for CanHav HBAR
/// @notice Stores feedback from hiring agents about worker agents.
contract ReputationRegistry is IReputationRegistry {
    struct FeedbackEntry {
        address reviewer;
        int128 value;
        string tag1;
        string tag2;
        bool revoked;
        uint256 timestamp;
    }

    mapping(uint256 => mapping(address => FeedbackEntry[])) private _feedback;
    mapping(uint256 => address[]) private _clients;
    mapping(uint256 => mapping(address => bool)) private _isClient;

    function giveFeedback(
        uint256 agentId,
        int128 value,
        string calldata tag1,
        string calldata tag2
    ) external {
        require(value >= 1 && value <= 5, "Rating must be 1-5");

        if (!_isClient[agentId][msg.sender]) {
            _clients[agentId].push(msg.sender);
            _isClient[agentId][msg.sender] = true;
        }

        _feedback[agentId][msg.sender].push(FeedbackEntry({
            reviewer: msg.sender,
            value: value,
            tag1: tag1,
            tag2: tag2,
            revoked: false,
            timestamp: block.timestamp
        }));

        emit FeedbackGiven(agentId, msg.sender, value, tag1, tag2);
    }

    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external {
        FeedbackEntry[] storage entries = _feedback[agentId][msg.sender];
        require(feedbackIndex < entries.length, "Invalid index");
        require(!entries[feedbackIndex].revoked, "Already revoked");

        entries[feedbackIndex].revoked = true;
        emit FeedbackRevoked(agentId, msg.sender, feedbackIndex);
    }

    function getSummary(uint256 agentId) external view returns (uint64 count, int128 totalValue) {
        address[] storage clients = _clients[agentId];
        for (uint256 i = 0; i < clients.length; i++) {
            FeedbackEntry[] storage entries = _feedback[agentId][clients[i]];
            for (uint256 j = 0; j < entries.length; j++) {
                if (!entries[j].revoked) {
                    count++;
                    totalValue += entries[j].value;
                }
            }
        }
    }

    function getFeedbackCount(uint256 agentId, address reviewer) external view returns (uint256) {
        return _feedback[agentId][reviewer].length;
    }

    function readFeedback(
        uint256 agentId,
        address reviewer,
        uint64 feedbackIndex
    ) external view returns (int128 value, string memory tag1, string memory tag2, bool revoked) {
        FeedbackEntry storage entry = _feedback[agentId][reviewer][feedbackIndex];
        return (entry.value, entry.tag1, entry.tag2, entry.revoked);
    }

    function getClients(uint256 agentId) external view returns (address[] memory) {
        return _clients[agentId];
    }
}
