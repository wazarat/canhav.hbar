"use client";

import { useState, useEffect } from "react";
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
  Coins,
  TrendingUp,
  Image,
  MessageSquare,
  Cpu,
  FileText,
  Scale,
  Code,
  GitBranch,
} from "lucide-react";

type AgentData = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  pricingUsd: string;
  capability: string;
  status: string;
  rating?: number;
  reviewCount?: number;
};

const iconMap: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  "hedera-skills": { icon: BookOpen, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  "market-intel": { icon: BarChart3, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  "contract-auditor": { icon: Shield, color: "text-orange-400", bgColor: "bg-orange-400/10" },
  "token-deployer": { icon: Coins, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  "defi-analyst": { icon: TrendingUp, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
  "nft-minter": { icon: Image, color: "text-violet-400", bgColor: "bg-violet-400/10" },
  "hcs-logger": { icon: MessageSquare, color: "text-pink-400", bgColor: "bg-pink-400/10" },
  "gas-optimizer": { icon: Cpu, color: "text-red-400", bgColor: "bg-red-400/10" },
  "ecosystem-reporter": { icon: FileText, color: "text-teal-400", bgColor: "bg-teal-400/10" },
  "compliance-checker": { icon: Scale, color: "text-amber-400", bgColor: "bg-amber-400/10" },
  "code-generator": { icon: Code, color: "text-lime-400", bgColor: "bg-lime-400/10" },
  "bridge-advisor": { icon: GitBranch, color: "text-indigo-400", bgColor: "bg-indigo-400/10" },
};

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => setAgents(data.agents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = agents.filter((a) => {
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
          <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="hedera-skills">Skills</TabsTrigger>
              <TabsTrigger value="market-intel">Intel</TabsTrigger>
              <TabsTrigger value="contract-auditor">Auditor</TabsTrigger>
              <TabsTrigger value="token-deployer">Deploy</TabsTrigger>
              <TabsTrigger value="defi-analyst">DeFi</TabsTrigger>
              <TabsTrigger value="code-generator">Code</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-muted mb-3" />
                  <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((agent) => {
              const meta = iconMap[agent.capability] || { icon: Bot, color: "text-muted-foreground", bgColor: "bg-muted" };
              const Icon = meta.icon;
              const price = parseFloat(agent.pricingUsd) || 1;
              const rating = agent.rating ?? 0;
              const reviews = agent.reviewCount ?? 0;

              return (
                <Card
                  key={agent.id}
                  className="group hover:border-primary/50 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div
                        className={`h-12 w-12 rounded-lg ${meta.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`h-6 w-6 ${meta.color}`} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {agent.status === "active" ? "Active" : agent.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-3">{agent.name}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {agent.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(agent.capabilities || []).slice(0, 3).map((cap) => (
                        <Badge
                          key={cap}
                          variant="secondary"
                          className="text-xs"
                        >
                          {cap}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {rating > 0 ? (
                          <>
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                            <span>{rating.toFixed(1)}</span>
                            <span className="text-xs">({reviews})</span>
                          </>
                        ) : (
                          <span className="text-xs">No reviews</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3.5 w-3.5" />
                        {price.toFixed(2)}
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
        )}

        {!loading && filtered.length === 0 && (
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
