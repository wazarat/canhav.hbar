import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, type NewAgent } from "@/lib/db/schema";

export async function GET() {
  try {
    const all = await db.select().from(agents);
    return NextResponse.json({ agents: all });
  } catch {
    return NextResponse.json({ agents: getDefaultAgents() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewAgent;
    const [created] = await db.insert(agents).values(body).returning();
    return NextResponse.json({ agent: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create agent" },
      { status: 500 }
    );
  }
}

function getDefaultAgents() {
  return [
    {
      id: "default-skills",
      name: "HederaSkills Agent",
      description:
        "Expert Hedera knowledge agent. Ask any question about building on Hedera — HTS, HCS, HSCS, wallets, security, costs, and more.",
      capabilities: ["hedera-knowledge", "code-examples", "cost-estimation"],
      pricingUsd: "1.00",
      capability: "hedera-skills",
      status: "active",
      rating: 4.8,
      reviewCount: 142,
      intakeSchema: {
        fields: [
          { name: "question", type: "text", required: true, description: "Your Hedera development question", placeholder: "How do I create and transfer an HTS token?" },
          { name: "context", type: "text", required: false, description: "Additional context for your question", placeholder: "I'm building a DeFi app using React..." },
        ],
      },
    },
    {
      id: "default-intel",
      name: "Market Intel Agent",
      description:
        "Institutional-grade Hedera ecosystem analyst. Query 190+ entities across 7 sectors. Generates market reports with entity data, practitioner notes, and sector analysis.",
      capabilities: ["market-analysis", "entity-search", "sector-reports"],
      pricingUsd: "2.00",
      capability: "market-intel",
      status: "active",
      rating: 4.6,
      reviewCount: 87,
      intakeSchema: {
        fields: [
          { name: "query", type: "text", required: true, description: "Your market intelligence question", placeholder: "Which DeFi projects have the deepest HTS integration?" },
          { name: "sector", type: "string", required: false, description: "Focus on a specific sector", placeholder: "DeFi Systems Architecture" },
        ],
      },
    },
    {
      id: "default-auditor",
      name: "Contract Auditor",
      description:
        "Solidity smart contract auditor specialized in Hedera HSCS. 12-point checklist covering tinybar units, HTS precompile, gas limits, reentrancy, and access control.",
      capabilities: ["security-audit", "hedera-specific-checks", "gas-analysis"],
      pricingUsd: "5.00",
      capability: "contract-auditor",
      status: "active",
      rating: 4.9,
      reviewCount: 53,
      intakeSchema: {
        fields: [
          { name: "contractSource", type: "text", required: true, description: "Solidity source code to audit", placeholder: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n..." },
          { name: "contractName", type: "string", required: false, description: "Name of the contract", placeholder: "MyToken" },
        ],
      },
    },
    {
      id: "default-token-deployer",
      name: "TokenDeployer",
      description:
        "Deploys HTS fungible and non-fungible tokens on Hedera. Specify name, symbol, supply, decimals, and key configuration. Returns the deployed token ID and HashScan link.",
      capabilities: ["hts-create", "token-config", "key-management"],
      pricingUsd: "3.00",
      capability: "token-deployer",
      status: "active",
      rating: 4.3,
      reviewCount: 28,
      intakeSchema: {
        fields: [
          { name: "tokenName", type: "string", required: true, description: "Token name", placeholder: "My Hedera Token" },
          { name: "tokenSymbol", type: "string", required: true, description: "Token symbol", placeholder: "MHT" },
          { name: "initialSupply", type: "string", required: false, description: "Initial supply (default 1000000)", placeholder: "1000000" },
          { name: "decimals", type: "string", required: false, description: "Decimal places (default 8)", placeholder: "8" },
        ],
      },
    },
    {
      id: "default-defi-analyst",
      name: "DeFi Analyst",
      description:
        "Analyzes DeFi protocols on Hedera. Covers SaucerSwap, HeliSwap, Pangolin, and other DEXs. Evaluates TVL, liquidity depth, HTS integration, and yield strategies.",
      capabilities: ["defi-analysis", "tvl-tracking", "yield-strategy"],
      pricingUsd: "2.50",
      capability: "defi-analyst",
      status: "active",
      rating: 4.5,
      reviewCount: 41,
      intakeSchema: {
        fields: [
          { name: "query", type: "text", required: true, description: "Your DeFi analysis question", placeholder: "Compare liquidity depth across Hedera DEXs" },
          { name: "protocol", type: "string", required: false, description: "Specific protocol to focus on", placeholder: "SaucerSwap" },
        ],
      },
    },
    {
      id: "default-nft-minter",
      name: "NFT Minter",
      description:
        "Creates and deploys NFT collections via Hedera Token Service. Supports metadata configuration, royalty fees, and batch minting. No smart contract needed.",
      capabilities: ["nft-create", "metadata-config", "royalty-setup"],
      pricingUsd: "1.50",
      capability: "nft-minter",
      status: "active",
      rating: 4.2,
      reviewCount: 19,
      intakeSchema: {
        fields: [
          { name: "collectionName", type: "string", required: true, description: "NFT collection name", placeholder: "Hedera Hashlings" },
          { name: "description", type: "text", required: true, description: "Collection description", placeholder: "A collection of unique digital art on Hedera" },
          { name: "maxSupply", type: "string", required: false, description: "Max supply (0 = infinite)", placeholder: "10000" },
        ],
      },
    },
    {
      id: "default-hcs-logger",
      name: "HCS Logger",
      description:
        "Creates immutable audit trails using Hedera Consensus Service. Submit structured messages to HCS topics for compliance, supply chain tracking, or agent coordination logs.",
      capabilities: ["hcs-topics", "audit-trail", "message-logging"],
      pricingUsd: "0.50",
      capability: "hcs-logger",
      status: "active",
      rating: 4.7,
      reviewCount: 63,
      intakeSchema: {
        fields: [
          { name: "message", type: "text", required: true, description: "Message to log to HCS", placeholder: "Agent completed task: audit of Escrow.sol" },
          { name: "topicId", type: "string", required: false, description: "Existing topic ID (or create new)", placeholder: "0.0.12345" },
        ],
      },
    },
    {
      id: "default-gas-optimizer",
      name: "GasOptimizer",
      description:
        "Optimizes Solidity code for gas efficiency on Hedera HSCS. Accounts for Hedera's unique gas schedule, storage pricing, and HTS precompile call costs. Returns optimized code with savings estimates.",
      capabilities: ["gas-optimization", "storage-analysis", "hedera-gas-schedule"],
      pricingUsd: "4.00",
      capability: "gas-optimizer",
      status: "active",
      rating: 4.4,
      reviewCount: 15,
      intakeSchema: {
        fields: [
          { name: "contractSource", type: "text", required: true, description: "Solidity source to optimize", placeholder: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n..." },
          { name: "focusArea", type: "string", required: false, description: "Focus area for optimization", placeholder: "storage" },
        ],
      },
    },
    {
      id: "default-ecosystem-reporter",
      name: "Ecosystem Reporter",
      description:
        "Generates comprehensive Hedera ecosystem reports. Aggregates data across 190 entities and 7 sectors. Outputs structured markdown reports suitable for investor decks or board presentations.",
      capabilities: ["report-generation", "data-aggregation", "sector-comparison"],
      pricingUsd: "3.00",
      capability: "ecosystem-reporter",
      status: "active",
      rating: 4.1,
      reviewCount: 22,
      intakeSchema: {
        fields: [
          { name: "reportType", type: "string", required: true, description: "Report type", placeholder: "sector-overview" },
          { name: "scope", type: "text", required: false, description: "Scope and requirements", placeholder: "Focus on DeFi and stablecoin adoption in Hedera" },
        ],
      },
    },
    {
      id: "default-compliance-checker",
      name: "Compliance Checker",
      description:
        "Checks Hedera applications against regulatory frameworks. Covers KYC/AML considerations for HTS tokens, securities classification for NFTs, and GDPR implications for HCS data.",
      capabilities: ["regulatory-check", "kyc-aml", "token-classification"],
      pricingUsd: "6.00",
      capability: "compliance-checker",
      status: "active",
      rating: 5.0,
      reviewCount: 8,
      intakeSchema: {
        fields: [
          { name: "projectDescription", type: "text", required: true, description: "Describe your Hedera project", placeholder: "We are building a tokenized real estate platform using HTS..." },
          { name: "jurisdiction", type: "string", required: false, description: "Target jurisdiction", placeholder: "United States" },
        ],
      },
    },
    {
      id: "default-code-generator",
      name: "Code Generator",
      description:
        "Generates production-ready Hedera SDK code. Supports TypeScript/JavaScript with @hashgraph/sdk. Covers token operations, consensus messaging, smart contract deployment, and scheduled transactions.",
      capabilities: ["code-generation", "sdk-usage", "typescript"],
      pricingUsd: "1.00",
      capability: "code-generator",
      status: "active",
      rating: 4.0,
      reviewCount: 96,
      intakeSchema: {
        fields: [
          { name: "task", type: "text", required: true, description: "What code do you need?", placeholder: "Create a function that transfers an HTS token between accounts" },
          { name: "language", type: "string", required: false, description: "Language preference", placeholder: "TypeScript" },
        ],
      },
    },
    {
      id: "default-bridge-advisor",
      name: "Bridge Advisor",
      description:
        "Advises on cross-chain integration with Hedera. Covers Hashport, LayerZero, and Wormhole bridging. Evaluates security models, fee structures, and asset mapping for EVM-to-Hedera transfers.",
      capabilities: ["cross-chain", "bridge-evaluation", "asset-mapping"],
      pricingUsd: "2.00",
      capability: "bridge-advisor",
      status: "active",
      rating: 3.9,
      reviewCount: 11,
      intakeSchema: {
        fields: [
          { name: "query", type: "text", required: true, description: "Your bridging question", placeholder: "How do I bridge USDC from Ethereum to Hedera?" },
          { name: "sourceChain", type: "string", required: false, description: "Source chain", placeholder: "Ethereum" },
        ],
      },
    },
    {
      id: "default-ai-studio",
      name: "AI Studio Agent",
      description:
        "Interactive Hedera agent powered by Agent Kit v3. Explains AND executes on-chain actions on Hedera Testnet — mint tokens, submit HCS messages, query accounts, and more via streaming chat.",
      capabilities: ["on-chain-execution", "streaming-chat", "plugin-scoping", "hts", "hcs", "evm"],
      pricingUsd: "0.00",
      capability: "ai-studio",
      status: "active",
      rating: 4.9,
      reviewCount: 34,
      intakeSchema: {
        fields: [
          { name: "query", type: "text", required: true, description: "What do you want to do on Hedera?", placeholder: "Create a fungible token on testnet" },
        ],
      },
    },
  ];
}
