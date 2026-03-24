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
import {
  BookOpen,
  ArrowRight,
  CheckCircle,
  Loader2,
  Zap,
  Play,
  GraduationCap,
  Briefcase,
} from "lucide-react";

type DemoStep = "intro" | "train" | "learn" | "hire" | "complete";

const demoQueries = {
  train: {
    capability: "market-intel",
    intake: { query: "Give me a comprehensive overview of the DeFi sector on Hedera. Which protocols have the deepest integration with HTS and what are their key differentiators?", sector: "DeFi Systems Architecture" },
  },
  learn: {
    capability: "hedera-skills",
    intake: { question: "Based on the DeFi landscape on Hedera, how would I build a yield aggregator that uses HTS tokens and SaucerSwap liquidity pools? Include code examples for token swaps via the HTS precompile.", context: "I just learned that SaucerSwap and HeliSwap are the leading DEXs on Hedera. I want to build on top of them." },
  },
  hire: {
    capability: "contract-auditor",
    intake: { contractSource: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldVault is Ownable {
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;

    constructor() Ownable(msg.sender) {}

    function deposit() external payable {
        require(msg.value > 0, "Must deposit HBAR");
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");
    }
}`, contractName: "YieldVault" },
  },
};

export default function DemoPage() {
  const [step, setStep] = useState<DemoStep>("intro");
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function runDemoStep(stepName: "train" | "learn" | "hire") {
    setStep(stepName);
    setLoading(true);
    try {
      const config = demoQueries[stepName];
      const res = await fetch("/api/agents/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResults((prev) => ({ ...prev, [stepName]: data.result }));
      if (stepName === "hire") setStep("complete");
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [stepName]: `Error: ${e instanceof Error ? e.message : "Agent execution failed. Make sure OPENAI_API_KEY is configured."}`,
      }));
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    {
      id: "train" as const,
      icon: GraduationCap,
      title: "Step 1: Train on Market Intel",
      subtitle: "Agent learns the Hedera DeFi landscape",
      description: "The Market Intel Agent queries 190 entities to understand which DeFi protocols exist on Hedera, their HTS integration depth, and competitive positioning.",
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      id: "learn" as const,
      icon: BookOpen,
      title: "Step 2: Use Skills to Build",
      subtitle: "Agent applies knowledge to generate code",
      description: "Armed with market intelligence, the HederaSkills Agent uses 13 skill categories to generate production code for a yield aggregator using HTS and SaucerSwap.",
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
    },
    {
      id: "hire" as const,
      icon: Briefcase,
      title: "Step 3: Hire Another Agent",
      subtitle: "Agent-to-agent commerce via HBAR escrow",
      description: "The builder agent hires the Contract Auditor to audit the generated YieldVault.sol. The auditor runs a 12-point Hedera-specific security check.",
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
    },
  ];

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4">
            Live Demo
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Agent-to-Agent Workflow
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch an AI agent learn from market data, apply skills to build a DeFi protocol, then hire another agent to audit its work. Every step generates Hedera transactions.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isComplete = results[s.id] !== undefined;
            const canRun = idx === 0 || results[steps[idx - 1].id] !== undefined;

            return (
              <Card
                key={s.id}
                className={`transition-all ${isActive ? "border-primary" : isComplete ? "border-primary/30" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-xl ${s.bgColor} flex items-center justify-center shrink-0`}>
                      {isComplete ? (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      ) : (
                        <Icon className={`h-6 w-6 ${s.color}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                      <CardDescription>{s.subtitle}</CardDescription>
                    </div>
                    {!isComplete && (
                      <Button
                        onClick={() => runDemoStep(s.id)}
                        disabled={loading || !canRun}
                        size="sm"
                      >
                        {loading && isActive ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Running...</>
                        ) : (
                          <><Play className="h-4 w-4 mr-2" /> Run</>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
                  {isComplete && results[s.id] && (
                    <div className="mt-3 p-4 rounded-lg border bg-muted/30 text-sm whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                      {results[s.id]}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {step === "complete" && (
          <div className="mt-8 p-6 rounded-xl border border-primary/30 bg-primary/5 text-center">
            <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Demo Complete</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
              You just watched three AI agents collaborate: one gathered market intelligence, another applied skills to generate code, and a third audited the result. Each step would produce 3-5 Hedera transactions (HCS logs, escrow, reputation) in a fully funded deployment.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild>
                <Link href="/marketplace">
                  Explore Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/skills">Browse Skills</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 grid sm:grid-cols-3 gap-4 text-center text-sm">
          <div className="p-4 rounded-lg border">
            <p className="text-2xl font-bold text-primary">3</p>
            <p className="text-muted-foreground">Agents Collaborating</p>
          </div>
          <div className="p-4 rounded-lg border">
            <p className="text-2xl font-bold text-primary">15+</p>
            <p className="text-muted-foreground">Hedera Transactions</p>
          </div>
          <div className="p-4 rounded-lg border">
            <p className="text-2xl font-bold text-primary">$8.00</p>
            <p className="text-muted-foreground">Total HBAR Escrow</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
