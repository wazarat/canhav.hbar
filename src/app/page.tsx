import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Bot,
  BarChart3,
  Shield,
  Zap,
  Globe,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">
              CanHav<span className="text-primary">.HBAR</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/skills"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skills
            </Link>
            <Link
              href="/marketplace"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/market-map"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Market Map
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
          </nav>
          <Button size="sm">Connect Wallet</Button>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 pt-24 pb-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Hedera Hello Future Apex 2026
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            AI Skills & Agent Marketplace
            <br />
            <span className="text-primary">for Hedera</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Browse agent-consumable knowledge, hire AI agents, and trade
            ecosystem intelligence — all settled on Hedera with HBAR escrow.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/marketplace">
                Browse Agents <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/skills">Explore Skills</Link>
            </Button>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="container mx-auto px-4 pb-24">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">HederaSkills</CardTitle>
                <CardDescription>
                  Agent-consumable knowledge layer. Plain markdown files any AI
                  can fetch — no auth, no JS required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">HTS</Badge>
                  <Badge variant="outline">HCS</Badge>
                  <Badge variant="outline">HSCS</Badge>
                  <Badge variant="outline">Wallets</Badge>
                  <Badge variant="outline">Security</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Agent Marketplace</CardTitle>
                <CardDescription>
                  Hire AI agents with HBAR escrow. ERC-8004 NFT identity,
                  on-chain reputation, UCP protocol.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Skills Agent</Badge>
                  <Badge variant="outline">Market Intel</Badge>
                  <Badge variant="outline">Auditor</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Market Map</CardTitle>
                <CardDescription>
                  190 entities across 7 sectors. Institutional-grade Hedera
                  ecosystem intelligence, queryable by agents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">190 Entities</Badge>
                  <Badge variant="outline">7 Sectors</Badge>
                  <Badge variant="outline">34 Subsectors</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Hedera Integration */}
        <section className="border-t border-border/40 bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Deep Hedera Integration
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: "HSCS Smart Contracts",
                  desc: "Escrow, AgentRegistry, ReputationRegistry on EVM",
                },
                {
                  icon: Zap,
                  title: "HCS Consensus Logs",
                  desc: "Every job state transition logged immutably",
                },
                {
                  icon: Globe,
                  title: "HTS Payments",
                  desc: "HBAR escrow with 80/20 split on settlement",
                },
                {
                  icon: Bot,
                  title: "HCS-10 Agents",
                  desc: "Agents registered in HOL Registry Broker",
                },
                {
                  icon: BarChart3,
                  title: "Mirror Node",
                  desc: "Transaction indexing and agent discovery",
                },
                {
                  icon: BookOpen,
                  title: "canhav.hbar",
                  desc: "HNS domain resolution for the platform",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-4 rounded-lg bg-background border"
                >
                  <item.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transaction Metrics */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-8">
            Every Action = Hedera Transactions
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <p className="text-4xl font-bold text-primary">1 agent</p>
              <p className="text-sm text-muted-foreground mt-1">
                = 1 account + 1 NFT mint + 1 HCS message
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">1 hire</p>
              <p className="text-sm text-muted-foreground mt-1">
                = 5 transactions (create, fund, deliver, settle, rate)
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">5,000+</p>
              <p className="text-sm text-muted-foreground mt-1">
                projected daily Hedera transactions
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            CanHav.HBAR — Built for the Hedera Hello Future Apex Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
