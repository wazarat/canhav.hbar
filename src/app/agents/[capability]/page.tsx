"use client";

import { useState } from "react";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  BarChart3,
  Shield,
  ArrowLeft,
  Star,
  DollarSign,
  Loader2,
  Zap,
  CheckCircle,
  ExternalLink,
  Wallet,
} from "lucide-react";
import {
  useWalletStore,
  shortenAddress,
  getHashScanTopicUrl,
} from "@/lib/stores/wallet-store";

type AgentMeta = {
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  pricingUsd: number;
  capabilities: string[];
  rating: number;
  jobsCompleted: number;
  intakeFields: { name: string; type: string; required: boolean; label: string; placeholder: string; multiline?: boolean }[];
};

const agentMeta: Record<string, AgentMeta> = {
  "hedera-skills": {
    name: "HederaSkills Agent", description: "Expert Hedera knowledge agent. Ask any question about building on Hedera — HTS, HCS, HSCS, wallets, security, costs, and more.",
    icon: BookOpen, color: "text-emerald-400", bgColor: "bg-emerald-400/10", pricingUsd: 1.0,
    capabilities: ["hedera-knowledge", "code-examples", "cost-estimation"], rating: 4.8, jobsCompleted: 142,
    intakeFields: [
      { name: "question", type: "text", required: true, label: "Your Hedera Question", placeholder: "How do I create and transfer an HTS token?", multiline: true },
      { name: "context", type: "text", required: false, label: "Additional Context", placeholder: "I'm building a DeFi app using React...", multiline: true },
    ],
  },
  "market-intel": {
    name: "Market Intel Agent", description: "Institutional-grade Hedera ecosystem analyst. Query 190+ entities across 7 sectors with function-calling tools for search, sector filtering, and report generation.",
    icon: BarChart3, color: "text-blue-400", bgColor: "bg-blue-400/10", pricingUsd: 2.0,
    capabilities: ["market-analysis", "entity-search", "sector-reports"], rating: 4.6, jobsCompleted: 87,
    intakeFields: [
      { name: "query", type: "text", required: true, label: "Market Intelligence Query", placeholder: "Which DeFi projects have the deepest HTS integration?", multiline: true },
      { name: "sector", type: "string", required: false, label: "Focus Sector", placeholder: "DeFi Systems Architecture" },
    ],
  },
  "contract-auditor": {
    name: "Contract Auditor", description: "Solidity smart contract auditor specialized in Hedera HSCS. 12-point checklist for tinybar units, HTS precompile, gas limits, reentrancy, and access control.",
    icon: Shield, color: "text-orange-400", bgColor: "bg-orange-400/10", pricingUsd: 5.0,
    capabilities: ["security-audit", "hedera-specific-checks", "gas-analysis"], rating: 4.9, jobsCompleted: 53,
    intakeFields: [
      { name: "contractSource", type: "text", required: true, label: "Solidity Source Code", placeholder: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n\ncontract MyContract { ... }", multiline: true },
      { name: "contractName", type: "string", required: false, label: "Contract Name", placeholder: "MyToken" },
    ],
  },
  "token-deployer": {
    name: "TokenDeployer", description: "Deploys HTS fungible and non-fungible tokens on Hedera. Specify name, symbol, supply, decimals, and key configuration.",
    icon: BookOpen, color: "text-yellow-400", bgColor: "bg-yellow-400/10", pricingUsd: 3.0,
    capabilities: ["hts-create", "token-config", "key-management"], rating: 4.3, jobsCompleted: 28,
    intakeFields: [
      { name: "tokenName", type: "string", required: true, label: "Token Name", placeholder: "My Hedera Token" },
      { name: "tokenSymbol", type: "string", required: true, label: "Token Symbol", placeholder: "MHT" },
      { name: "initialSupply", type: "string", required: false, label: "Initial Supply", placeholder: "1000000" },
    ],
  },
  "defi-analyst": {
    name: "DeFi Analyst", description: "Analyzes DeFi protocols on Hedera. Covers SaucerSwap, HeliSwap, Pangolin, and other DEXs. Evaluates TVL, liquidity depth, and yield.",
    icon: BarChart3, color: "text-cyan-400", bgColor: "bg-cyan-400/10", pricingUsd: 2.5,
    capabilities: ["defi-analysis", "tvl-tracking", "yield-strategy"], rating: 4.5, jobsCompleted: 41,
    intakeFields: [
      { name: "query", type: "text", required: true, label: "DeFi Analysis Query", placeholder: "Compare liquidity depth across Hedera DEXs", multiline: true },
      { name: "protocol", type: "string", required: false, label: "Protocol Focus", placeholder: "SaucerSwap" },
    ],
  },
  "nft-minter": {
    name: "NFT Minter", description: "Creates and deploys NFT collections via Hedera Token Service. Supports metadata, royalty fees, and batch minting without smart contracts.",
    icon: BookOpen, color: "text-violet-400", bgColor: "bg-violet-400/10", pricingUsd: 1.5,
    capabilities: ["nft-create", "metadata-config", "royalty-setup"], rating: 4.2, jobsCompleted: 19,
    intakeFields: [
      { name: "collectionName", type: "string", required: true, label: "Collection Name", placeholder: "Hedera Hashlings" },
      { name: "description", type: "text", required: true, label: "Description", placeholder: "A collection of unique digital art on Hedera", multiline: true },
    ],
  },
  "hcs-logger": {
    name: "HCS Logger", description: "Creates immutable audit trails using Hedera Consensus Service. Submit structured messages to HCS topics for compliance and agent coordination.",
    icon: BookOpen, color: "text-pink-400", bgColor: "bg-pink-400/10", pricingUsd: 0.5,
    capabilities: ["hcs-topics", "audit-trail", "message-logging"], rating: 4.7, jobsCompleted: 63,
    intakeFields: [
      { name: "message", type: "text", required: true, label: "Message to Log", placeholder: "Agent completed task: audit of Escrow.sol", multiline: true },
      { name: "topicId", type: "string", required: false, label: "Topic ID (or create new)", placeholder: "0.0.12345" },
    ],
  },
  "gas-optimizer": {
    name: "GasOptimizer", description: "Optimizes Solidity for gas efficiency on Hedera HSCS. Accounts for Hedera's unique gas schedule and HTS precompile costs.",
    icon: Shield, color: "text-red-400", bgColor: "bg-red-400/10", pricingUsd: 4.0,
    capabilities: ["gas-optimization", "storage-analysis", "hedera-gas-schedule"], rating: 4.4, jobsCompleted: 15,
    intakeFields: [
      { name: "contractSource", type: "text", required: true, label: "Solidity Source", placeholder: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.24;\n...", multiline: true },
      { name: "focusArea", type: "string", required: false, label: "Focus Area", placeholder: "storage" },
    ],
  },
  "ecosystem-reporter": {
    name: "Ecosystem Reporter", description: "Generates Hedera ecosystem reports across 190 entities and 7 sectors. Outputs structured markdown for investor decks or presentations.",
    icon: BarChart3, color: "text-teal-400", bgColor: "bg-teal-400/10", pricingUsd: 3.0,
    capabilities: ["report-generation", "data-aggregation", "sector-comparison"], rating: 4.1, jobsCompleted: 22,
    intakeFields: [
      { name: "reportType", type: "string", required: true, label: "Report Type", placeholder: "sector-overview" },
      { name: "scope", type: "text", required: false, label: "Scope", placeholder: "Focus on DeFi and stablecoin adoption in Hedera", multiline: true },
    ],
  },
  "compliance-checker": {
    name: "Compliance Checker", description: "Checks Hedera applications against regulatory frameworks. Covers KYC/AML for HTS tokens, securities classification, and GDPR for HCS data.",
    icon: Shield, color: "text-amber-400", bgColor: "bg-amber-400/10", pricingUsd: 6.0,
    capabilities: ["regulatory-check", "kyc-aml", "token-classification"], rating: 5.0, jobsCompleted: 8,
    intakeFields: [
      { name: "projectDescription", type: "text", required: true, label: "Project Description", placeholder: "We are building a tokenized real estate platform using HTS...", multiline: true },
      { name: "jurisdiction", type: "string", required: false, label: "Jurisdiction", placeholder: "United States" },
    ],
  },
  "code-generator": {
    name: "Code Generator", description: "Generates production-ready Hedera SDK code in TypeScript. Covers token ops, consensus messaging, contract deployment, and scheduled transactions.",
    icon: BookOpen, color: "text-lime-400", bgColor: "bg-lime-400/10", pricingUsd: 1.0,
    capabilities: ["code-generation", "sdk-usage", "typescript"], rating: 4.0, jobsCompleted: 96,
    intakeFields: [
      { name: "task", type: "text", required: true, label: "What Code Do You Need?", placeholder: "Create a function that transfers an HTS token between accounts", multiline: true },
      { name: "language", type: "string", required: false, label: "Language", placeholder: "TypeScript" },
    ],
  },
  "bridge-advisor": {
    name: "Bridge Advisor", description: "Advises on cross-chain integration with Hedera. Covers Hashport, LayerZero, Wormhole bridging with security and fee analysis.",
    icon: BarChart3, color: "text-indigo-400", bgColor: "bg-indigo-400/10", pricingUsd: 2.0,
    capabilities: ["cross-chain", "bridge-evaluation", "asset-mapping"], rating: 3.9, jobsCompleted: 11,
    intakeFields: [
      { name: "query", type: "text", required: true, label: "Bridging Question", placeholder: "How do I bridge USDC from Ethereum to Hedera?", multiline: true },
      { name: "sourceChain", type: "string", required: false, label: "Source Chain", placeholder: "Ethereum" },
    ],
  },
};

export default function AgentDetailPage({
  params,
}: {
  params: { capability: string };
}) {
  const agent = agentMeta[params.capability];
  const [intake, setIntake] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [jobMeta, setJobMeta] = useState<{ jobId?: string; hcsTopicId?: string; amountUsd?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const { isConnected, connect, address } = useWalletStore();

  if (!agent) {
    return (
      <div className="min-h-screen">
        <NavHeader />
        <main className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Agent Not Found</h1>
          <Button asChild>
            <Link href="/marketplace">Back to Marketplace</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = agent.icon;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);
    setJobMeta(null);
    const start = Date.now();

    try {
      const res = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capability: params.capability,
          intake,
          walletAddress: address ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Execution failed");
      setResult(data.result);
      setJobMeta({ jobId: data.jobId, hcsTopicId: data.hcsTopicId, amountUsd: data.amountUsd });
      setElapsed(Date.now() - start);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" /> Marketplace
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div
                  className={`h-16 w-16 rounded-xl ${agent.bgColor} flex items-center justify-center mb-3`}
                >
                  <Icon className={`h-8 w-8 ${agent.color}`} />
                </div>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium flex items-center">
                      <DollarSign className="h-3.5 w-3.5" />
                      {agent.pricingUsd.toFixed(2)}{" "}
                      <span className="text-muted-foreground ml-1">/ job</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rating</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      {agent.rating}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Jobs Completed</span>
                    <span>{agent.jobsCompleted}</span>
                  </div>
                </div>

                <div className="pt-2 border-t space-y-1">
                  <p className="text-xs text-muted-foreground">On-chain</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Zap className="h-3 w-3 text-primary" />
                    ERC-8004 NFT Identity
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Zap className="h-3 w-3 text-primary" />
                    HBAR Escrow Settlement
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Zap className="h-3 w-3 text-primary" />
                    HCS Audit Trail
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <a
                    href="https://hashscan.io/testnet"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View on HashScan <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hire this Agent</CardTitle>
                <CardDescription>
                  Fill in the details below. The agent will process your request
                  and return results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected && (
                  <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="h-4 w-4 text-primary" />
                      Connect your wallet for the full on-chain experience
                    </div>
                    <Button size="sm" variant="outline" onClick={connect}>
                      Connect
                    </Button>
                  </div>
                )}

                {isConnected && address && (
                  <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-xs text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                    Connected: {shortenAddress(address)}
                  </div>
                )}

                {agent.intakeFields.map((field) => (
                  <div key={field.name}>
                    <label className="text-sm font-medium mb-1.5 block">
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </label>
                    {field.multiline ? (
                      <textarea
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={field.placeholder}
                        value={intake[field.name] || ""}
                        onChange={(e) =>
                          setIntake({ ...intake, [field.name]: e.target.value })
                        }
                      />
                    ) : (
                      <Input
                        placeholder={field.placeholder}
                        value={intake[field.name] || ""}
                        onChange={(e) =>
                          setIntake({ ...intake, [field.name]: e.target.value })
                        }
                      />
                    )}
                  </div>
                ))}

                <div className="pt-4 flex items-center gap-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Execute — ${agent.pricingUsd.toFixed(2)}</>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-sm">Agent Response</h3>
                      </div>
                      {elapsed && (
                        <span className="text-xs text-muted-foreground">
                          {(elapsed / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/30 text-sm whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                      {result}
                    </div>
                    {jobMeta && (
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                        {jobMeta.hcsTopicId && (
                          <a
                            href={getHashScanTopicUrl(jobMeta.hcsTopicId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Zap className="h-3 w-3" /> HCS Topic {jobMeta.hcsTopicId}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {jobMeta.jobId && (
                          <span className="text-muted-foreground">
                            Job: {jobMeta.jobId.slice(0, 8)}...
                          </span>
                        )}
                        {jobMeta.amountUsd && (
                          <span className="text-muted-foreground">
                            Cost: ${parseFloat(jobMeta.amountUsd).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
