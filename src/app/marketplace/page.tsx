"use client";

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
import { ArrowRight, Sparkles } from "lucide-react";
import { AGENT_CATALOG } from "@hbar/lib/agent-catalog";

const hbarActiveAgents = AGENT_CATALOG.filter((a) => a.status === "active");

export default function MarketplacePage() {
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

        <section className="mb-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">DeFi Agent</h2>
              <p className="text-muted-foreground max-w-2xl">
                Test our agents&apos; knowledge against other tools in real-life
                scenarios.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
              <Button asChild>
                <Link href="/hbar">
                  View all agents <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/hbar/studio">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Agent Studio
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group border-primary/20 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Bonzo Vault Strategist</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Beta
                  </Badge>
                </div>
                <CardDescription className="text-sm line-clamp-2">
                  Survey-driven vault keeper with deterministic policy gates and
                  HCS audit trail.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/agents/bonzo-vault"
                  className="inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                >
                  Configure strategy
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </CardContent>
            </Card>
            {hbarActiveAgents.map((agent) => (
              <Card
                key={agent.id}
                className="group border-border/30 bg-card/40 hover:border-primary/30 hover:bg-card/60 transition-colors"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={`/hbar/${agent.id}`}
                    className="inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Run agent
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
