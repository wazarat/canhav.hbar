// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReputationRegistry {
    event FeedbackGiven(uint256 indexed agentId, address indexed reviewer, int128 value, string tag1, string tag2);
    event FeedbackRevoked(uint256 indexed agentId, address indexed reviewer, uint64 feedbackIndex);

    function giveFeedback(uint256 agentId, int128 value, string calldata tag1, string calldata tag2) external;
    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external;
    function getSummary(uint256 agentId) external view returns (uint64 count, int128 totalValue);
    function readFeedback(uint256 agentId, address reviewer, uint64 feedbackIndex) external view returns (int128 value, string memory tag1, string memory tag2, bool revoked);
    function getFeedbackCount(uint256 agentId, address reviewer) external view returns (uint256);
}
