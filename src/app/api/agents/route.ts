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
      intakeSchema: {
        fields: [
          {
            name: "question",
            type: "text",
            required: true,
            description: "Your Hedera development question",
            placeholder: "How do I create and transfer an HTS token?",
          },
          {
            name: "context",
            type: "text",
            required: false,
            description: "Additional context for your question",
            placeholder: "I'm building a DeFi app using React...",
          },
        ],
      },
    },
    {
      id: "default-intel",
      name: "Market Intel Agent",
      description:
        "Institutional-grade Hedera ecosystem analyst. Query 190+ entities across 7 sectors — DeFi, gaming, supply chain, identity, and more.",
      capabilities: ["market-analysis", "entity-search", "sector-reports"],
      pricingUsd: "2.00",
      capability: "market-intel",
      status: "active",
      intakeSchema: {
        fields: [
          {
            name: "query",
            type: "text",
            required: true,
            description: "Your market intelligence question",
            placeholder:
              "Which DeFi projects have the deepest HTS integration?",
          },
          {
            name: "sector",
            type: "string",
            required: false,
            description: "Focus on a specific sector",
            placeholder: "DeFi",
          },
        ],
      },
    },
    {
      id: "default-auditor",
      name: "Contract Auditor Agent",
      description:
        "Solidity smart contract auditor specialized in Hedera HSCS. Checks for Hedera-specific pitfalls: tinybar units, HTS precompile, gas limits.",
      capabilities: [
        "security-audit",
        "hedera-specific-checks",
        "gas-analysis",
      ],
      pricingUsd: "5.00",
      capability: "contract-auditor",
      status: "active",
      intakeSchema: {
        fields: [
          {
            name: "contractSource",
            type: "text",
            required: true,
            description: "Solidity source code to audit",
            placeholder: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n...",
          },
          {
            name: "contractName",
            type: "string",
            required: false,
            description: "Name of the contract",
            placeholder: "MyToken",
          },
        ],
      },
    },
  ];
}
