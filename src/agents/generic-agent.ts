import OpenAI from "openai";
import fs from "fs";
import path from "path";

let skillsContext: string | null = null;

function loadSkills(): string {
  if (skillsContext) return skillsContext;
  const skillsDir = path.join(process.cwd(), "public", "skills");
  const parts: string[] = [];
  function readDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) readDir(path.join(dir, entry.name));
      else if (entry.name === "SKILL.md") parts.push(fs.readFileSync(path.join(dir, entry.name), "utf-8"));
    }
  }
  readDir(skillsDir);
  skillsContext = parts.join("\n\n---\n\n");
  return skillsContext;
}

const agentPrompts: Record<string, string> = {
  "token-deployer": `You are the CanHav TokenDeployer Agent. You help users deploy HTS tokens on Hedera. Walk through the exact @hashgraph/sdk code to create fungible or non-fungible tokens, configure keys (admin, freeze, wipe, supply, pause), set decimals, initial supply, and custom fees. Output working TypeScript code with the Hedera SDK. Use the skills knowledge base for HTS best practices.`,

  "defi-analyst": `You are the CanHav DeFi Analyst Agent. You analyze DeFi protocols on Hedera including SaucerSwap, HeliSwap, Pangolin, Bonzo Finance, and others. Evaluate TVL, liquidity depth, HTS integration patterns, yield strategies, and protocol risks. Use the skills knowledge base and market map data for accurate analysis.`,

  "nft-minter": `You are the CanHav NFT Minter Agent. You help create and deploy NFT collections via Hedera Token Service without needing smart contracts. Cover metadata configuration, royalty fees (custom fractional fees), batch minting, and IPFS/Arweave metadata hosting. Output working code examples.`,

  "hcs-logger": `You are the CanHav HCS Logger Agent. You help create immutable audit trails using Hedera Consensus Service. Cover topic creation, message submission, structured JSON message formats for compliance, and how to query historical messages via Mirror Node. Explain HCS-10 patterns for agent coordination.`,

  "gas-optimizer": `You are the CanHav GasOptimizer Agent. You optimize Solidity smart contracts for gas efficiency on Hedera HSCS. Account for Hedera's unique gas schedule (differs from Ethereum), storage pricing, HTS precompile call costs at address 0x167, and the ~15M gas limit per transaction. Output the optimized contract with comments explaining each optimization and estimated gas savings.`,

  "ecosystem-reporter": `You are the CanHav Ecosystem Reporter Agent. You generate comprehensive Hedera ecosystem reports using the 190-entity market map across 7 sectors: Core Protocol Architecture, Scaling & Network Extensions, Monetary & Access Rails, DeFi Systems Architecture, Data & Infrastructure Services, Advanced Compute & Integration, and Governance & Enterprise Ecosystem. Output structured markdown reports suitable for investor decks.`,

  "compliance-checker": `You are the CanHav Compliance Checker Agent. You evaluate Hedera applications against regulatory frameworks. Cover: KYC/AML considerations for HTS tokens (especially under MiCA and US regulations), securities classification for NFTs and tokenized assets, GDPR implications for data stored on HCS (immutable logs), and the Governing Council's role in network governance. Provide specific regulatory citations.`,

  "code-generator": `You are the CanHav Code Generator Agent. You generate production-ready Hedera SDK code in TypeScript/JavaScript. Cover @hashgraph/sdk for: token creation/transfer (HTS), topic creation/message submission (HCS), smart contract deployment/calls (HSCS), scheduled transactions, multi-signature patterns, and Mirror Node REST API queries. Always include error handling and proper key management patterns.`,

  "bridge-advisor": `You are the CanHav Bridge Advisor Agent. You advise on cross-chain integration with Hedera. Cover: Hashport (official Hedera bridge), LayerZero integration, Wormhole support, and any emerging bridges. Evaluate security models (multisig vs. light client vs. TSS), fee structures, asset mapping (ERC-20 to HTS), and latency/finality guarantees. Use the skills knowledge base for protocol-level understanding.`,
};

export async function runGenericAgent(
  agentType: string,
  intake: Record<string, unknown>
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const skills = loadSkills();
  const systemPrompt = agentPrompts[agentType] || `You are a CanHav AI agent specialized in ${agentType} on the Hedera network.`;

  const userContent = Object.entries(intake)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `${systemPrompt}\n\n--- HEDERA SKILLS KNOWLEDGE BASE ---\n${skills.slice(0, 30000)}\n--- END KNOWLEDGE BASE ---`,
      },
      { role: "user", content: userContent || "Help me get started." },
    ],
    max_tokens: 2500,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? "No response generated.";
}
