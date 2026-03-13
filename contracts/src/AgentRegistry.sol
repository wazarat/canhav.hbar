// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAgentRegistry.sol";

/// @title AgentRegistry — ERC-8004 compatible agent identity for CanHav HBAR
/// @notice Each agent is an ERC-721 NFT. agentURI stores capabilities JSON.
contract AgentRegistry is ERC721, ERC721URIStorage, Ownable, IAgentRegistry {
    uint256 public nextAgentId;

    mapping(uint256 => address) public agentWallets;
    mapping(uint256 => mapping(string => bytes)) private _metadata;

    constructor() ERC721("CanHav Agent", "CHAV") Ownable(msg.sender) {}

    function register(string calldata agentURI) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        _mint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        agentWallets[agentId] = msg.sender;

        emit AgentRegistered(agentId, msg.sender, agentURI);
        return agentId;
    }

    function setAgentURI(uint256 agentId, string calldata newURI) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _setTokenURI(agentId, newURI);
    }

    function setAgentWallet(uint256 agentId, address wallet) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        agentWallets[agentId] = wallet;
        emit AgentWalletSet(agentId, wallet);
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return agentWallets[agentId];
    }

    function setMetadata(uint256 agentId, string calldata key, bytes calldata value) external {
        require(ownerOf(agentId) == msg.sender, "Not agent owner");
        _metadata[agentId][key] = value;
        emit MetadataSet(agentId, key);
    }

    function getMetadata(uint256 agentId, string calldata key) external view returns (bytes memory) {
        return _metadata[agentId][key];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
