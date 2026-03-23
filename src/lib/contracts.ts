import { ethers } from "ethers";

const HEDERA_TESTNET_RPC = "https://testnet.hashio.io/api";
const HEDERA_MAINNET_RPC = "https://mainnet.hashio.io/api";

function getRpcUrl(): string {
  return process.env.HEDERA_NETWORK === "mainnet"
    ? HEDERA_MAINNET_RPC
    : HEDERA_TESTNET_RPC;
}

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getRpcUrl());
}

export function getSigner(): ethers.Wallet {
  const key = process.env.HEDERA_PRIVATE_KEY;
  if (!key) throw new Error("HEDERA_PRIVATE_KEY required");

  // Hedera keys need to be converted to ECDSA hex for ethers.js
  // If key starts with 0x, use directly; otherwise try DER format
  let hexKey = key;
  if (!key.startsWith("0x")) {
    // DER-encoded ECDSA key: last 32 bytes
    const raw = Buffer.from(key, "hex");
    hexKey = "0x" + raw.subarray(raw.length - 32).toString("hex");
  }

  return new ethers.Wallet(hexKey, getProvider());
}

const AGENT_REGISTRY_ABI = [
  "function register(string agentURI) external returns (uint256)",
  "function setAgentURI(uint256 agentId, string newURI) external",
  "function setAgentWallet(uint256 agentId, address wallet) external",
  "function getAgentWallet(uint256 agentId) external view returns (address)",
  "function setMetadata(uint256 agentId, string key, bytes value) external",
  "function getMetadata(uint256 agentId, string key) external view returns (bytes)",
  "function nextAgentId() external view returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "event AgentRegistered(uint256 indexed agentId, address indexed owner, string agentURI)",
];

const REPUTATION_REGISTRY_ABI = [
  "function giveFeedback(uint256 agentId, int128 value, string tag1, string tag2) external",
  "function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external",
  "function getSummary(uint256 agentId) external view returns (uint64 count, int128 totalValue)",
  "function readFeedback(uint256 agentId, address reviewer, uint64 feedbackIndex) external view returns (int128 value, string tag1, string tag2, bool revoked)",
  "function getFeedbackCount(uint256 agentId, address reviewer) external view returns (uint256)",
  "event FeedbackGiven(uint256 indexed agentId, address indexed reviewer, int128 value, string tag1, string tag2)",
];

const ESCROW_ABI = [
  "function createJob(address worker, uint256 expectedAmount) external returns (uint256)",
  "function fundJob(uint256 jobId) external payable",
  "function completeJob(uint256 jobId) external",
  "function getJob(uint256 jobId) external view returns (address buyer, address worker, uint256 expectedAmount, uint256 amount, uint8 status)",
  "function nextJobId() external view returns (uint256)",
  "function platformFeeBps() external view returns (uint256)",
  "event JobCreated(uint256 indexed jobId, address indexed buyer, address indexed worker, uint256 expectedAmount)",
  "event JobFunded(uint256 indexed jobId, address indexed funder, uint256 amount)",
  "event JobCompleted(uint256 indexed jobId, uint256 workerPayout, uint256 platformPayout)",
];

export function getAgentRegistry(
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract {
  const address = process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS;
  if (!address) throw new Error("NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS required");
  return new ethers.Contract(
    address,
    AGENT_REGISTRY_ABI,
    signerOrProvider || getProvider()
  );
}

export function getReputationRegistry(
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract {
  const address = process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS;
  if (!address)
    throw new Error("NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS required");
  return new ethers.Contract(
    address,
    REPUTATION_REGISTRY_ABI,
    signerOrProvider || getProvider()
  );
}

export function getEscrow(
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract {
  const address = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
  if (!address) throw new Error("NEXT_PUBLIC_ESCROW_ADDRESS required");
  return new ethers.Contract(
    address,
    ESCROW_ABI,
    signerOrProvider || getProvider()
  );
}

// Hedera EVM uses tinybars (1e8), not wei (1e18)
export function hbarToTinybar(hbar: number): bigint {
  return BigInt(Math.round(hbar * 1e8));
}

export function tinybarToHbar(tinybar: bigint): number {
  return Number(tinybar) / 1e8;
}

const HBAR_USD_PRICE = process.env.HBAR_USD_PRICE
  ? parseFloat(process.env.HBAR_USD_PRICE)
  : 0.08;

export function usdToHbar(usd: number): number {
  return usd / HBAR_USD_PRICE;
}

export function hbarToUsd(hbar: number): number {
  return hbar * HBAR_USD_PRICE;
}
