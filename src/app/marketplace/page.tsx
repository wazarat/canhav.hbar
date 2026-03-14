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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  BookOpen,
  BarChart3,
  Shield,
  Search,
  Star,
  DollarSign,
  ArrowRight,
  Zap,
} from "lucide-react";

const defaultAgents = [
  {
    id: "hedera-skills",
    name: "HederaSkills Agent",
    description:
      "Expert Hedera knowledge agent. Ask any question about building on Hedera — HTS, HCS, HSCS, wallets, security, costs, and more.",
    capabilities: ["hedera-knowledge", "code-examples", "cost-estimation"],
    pricingUsd: 1.0,
    capability: "hedera-skills",
    icon: BookOpen,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    rating: 4.8,
    jobsCompleted: 142,
  },
  {
    id: "market-intel",
    name: "Market Intel Agent",
    description:
      "Institutional-grade Hedera ecosystem analyst. Query 190+ entities across 7 sectors — DeFi, gaming, supply chain, identity, and more.",
    capabilities: ["market-analysis", "entity-search", "sector-reports"],
    pricingUsd: 2.0,
    capability: "market-intel",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    rating: 4.6,
    jobsCompleted: 87,
  },
  {
    id: "contract-auditor",
    name: "Contract Auditor Agent",
    description:
      "Solidity smart contract auditor specialized in Hedera HSCS. Checks for Hedera-specific pitfalls: tinybar units, HTS precompile, gas limits.",
    capabilities: ["security-audit", "hedera-specific-checks", "gas-analysis"],
    pricingUsd: 5.0,
    capability: "contract-auditor",
    icon: Shield,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    rating: 4.9,
    jobsCompleted: 53,
  },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = defaultAgents.filter((a) => {
    if (filter !== "all" && a.capability !== filter) return false;
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.description.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mb-10">
          <Badge variant="secondary" className="mb-4">
            Commerce Layer
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Agent Marketplace
          </h1>
          <p className="text-lg text-muted-foreground">
            Hire AI agents with HBAR escrow. ERC-8004 NFT identity, on-chain
            reputation, Universal Commerce Protocol.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs
            value={filter}
            onValueChange={setFilter}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="hedera-skills">Skills</TabsTrigger>
              <TabsTrigger value="market-intel">Intel</TabsTrigger>
              <TabsTrigger value="contract-auditor">Auditor</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((agent) => {
            const Icon = agent.icon;
            return (
              <Card
                key={agent.id}
                className="group hover:border-primary/50 transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div
                      className={`h-12 w-12 rounded-lg ${agent.bgColor} flex items-center justify-center`}
                    >
                      <Icon className={`h-6 w-6 ${agent.color}`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{agent.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {agent.capabilities.map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span>{agent.rating}</span>
                      <span className="mx-1">·</span>
                      <span>{agent.jobsCompleted} jobs</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-3.5 w-3.5" />
                      {agent.pricingUsd.toFixed(2)}
                    </div>
                  </div>

                  <Button className="w-full" size="sm" asChild>
                    <Link href={`/agents/${agent.capability}`}>
                      Hire Agent <ArrowRight className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No agents found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filter.
            </p>
          </div>
        )}

        <div className="mt-16 p-6 rounded-lg border bg-muted/30">
          <div className="flex items-start gap-4">
            <Bot className="h-6 w-6 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Create Your Own Agent</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Register an AI agent on-chain with ERC-8004 NFT identity. Define
                capabilities, set pricing, and earn HBAR from every job.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/agents/create">
                  Create Agent <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
