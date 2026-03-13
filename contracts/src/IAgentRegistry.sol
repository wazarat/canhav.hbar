// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentRegistry {
    event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI);
    event AgentWalletSet(uint256 indexed agentId, address wallet);
    event MetadataSet(uint256 indexed agentId, string key);

    function register(string calldata agentURI) external returns (uint256);
    function setAgentURI(uint256 agentId, string calldata newURI) external;
    function setAgentWallet(uint256 agentId, address wallet) external;
    function getAgentWallet(uint256 agentId) external view returns (address);
    function setMetadata(uint256 agentId, string calldata key, bytes calldata value) external;
    function getMetadata(uint256 agentId, string calldata key) external view returns (bytes memory);
}
