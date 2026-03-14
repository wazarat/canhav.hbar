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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bot,
  Briefcase,
  DollarSign,
  Star,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  BarChart3,
  BookOpen,
  Shield,
  Wallet,
} from "lucide-react";

const mockAgents = [
  {
    id: 1,
    name: "HederaSkills Agent",
    capability: "hedera-skills",
    icon: BookOpen,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    status: "active",
    jobsCompleted: 142,
    revenue: 142.0,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Market Intel Agent",
    capability: "market-intel",
    icon: BarChart3,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    status: "active",
    jobsCompleted: 87,
    revenue: 174.0,
    rating: 4.6,
  },
  {
    id: 3,
    name: "Contract Auditor Agent",
    capability: "contract-auditor",
    icon: Shield,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    status: "active",
    jobsCompleted: 53,
    revenue: 265.0,
    rating: 4.9,
  },
];

const mockJobs = [
  {
    id: "job-001",
    agent: "HederaSkills Agent",
    task: "How to create an HTS fungible token",
    status: "completed",
    amount: "$1.00",
    date: "2026-03-12",
    txHash: "0x1a2b..3c4d",
  },
  {
    id: "job-002",
    agent: "Market Intel Agent",
    task: "DeFi sector analysis with HTS integrations",
    status: "completed",
    amount: "$2.00",
    date: "2026-03-12",
    txHash: "0x5e6f..7g8h",
  },
  {
    id: "job-003",
    agent: "Contract Auditor Agent",
    task: "Audit Escrow.sol for Hedera-specific issues",
    status: "rated",
    amount: "$5.00",
    date: "2026-03-11",
    txHash: "0x9i0j..1k2l",
  },
  {
    id: "job-004",
    agent: "HederaSkills Agent",
    task: "Best practices for HCS topic management",
    status: "in_progress",
    amount: "$1.00",
    date: "2026-03-13",
    txHash: null,
  },
  {
    id: "job-005",
    agent: "Market Intel Agent",
    task: "Gaming sector entities using HTS",
    status: "pending_fund",
    amount: "$2.00",
    date: "2026-03-13",
    txHash: null,
  },
];

const statusConfig: Record<
  string,
  { label: string; icon: React.ElementType; className: string }
> = {
  pending_fund: {
    label: "Pending Fund",
    icon: Clock,
    className: "text-yellow-400 bg-yellow-400/10",
  },
  funded: {
    label: "Funded",
    icon: DollarSign,
    className: "text-blue-400 bg-blue-400/10",
  },
  in_progress: {
    label: "In Progress",
    icon: Zap,
    className: "text-purple-400 bg-purple-400/10",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    className: "text-cyan-400 bg-cyan-400/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "text-emerald-400 bg-emerald-400/10",
  },
  rated: {
    label: "Rated",
    icon: Star,
    className: "text-yellow-400 bg-yellow-400/10",
  },
  disputed: {
    label: "Disputed",
    icon: AlertCircle,
    className: "text-red-400 bg-red-400/10",
  },
};

export default function DashboardPage() {
  const [tab, setTab] = useState("overview");

  const totalRevenue = mockAgents.reduce((s, a) => s + a.revenue, 0);
  const totalJobs = mockAgents.reduce((s, a) => s + a.jobsCompleted, 0);

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your agents, track jobs, and monitor earnings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Wallet className="h-4 w-4 mr-2" />
              0x051b...37f8
            </Button>
            <Button size="sm" asChild>
              <Link href="/agents/create">
                <Bot className="h-4 w-4 mr-2" /> New Agent
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Bot className="h-4 w-4" />
                Active Agents
              </div>
              <p className="text-3xl font-bold">{mockAgents.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Briefcase className="h-4 w-4" />
                Total Jobs
              </div>
              <p className="text-3xl font-bold">{totalJobs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" />
                Revenue (USD)
              </div>
              <p className="text-3xl font-bold">${totalRevenue.toFixed(0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Star className="h-4 w-4" />
                Avg Rating
              </div>
              <p className="text-3xl font-bold">
                {(
                  mockAgents.reduce((s, a) => s + a.rating, 0) /
                  mockAgents.length
                ).toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">My Agents</TabsTrigger>
            <TabsTrigger value="jobs">Job History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockAgents.map((agent) => {
                const Icon = agent.icon;
                return (
                  <Card
                    key={agent.id}
                    className="hover:border-primary/50 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-lg ${agent.bgColor} flex items-center justify-center`}
                        >
                          <Icon className={`h-5 w-5 ${agent.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {agent.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            ID #{agent.id} · {agent.capability}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold">
                            {agent.jobsCompleted}
                          </p>
                          <p className="text-xs text-muted-foreground">Jobs</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">
                            ${agent.revenue.toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Revenue
                          </p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{agent.rating}</p>
                          <p className="text-xs text-muted-foreground">
                            Rating
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        asChild
                      >
                        <Link href={`/agents/${agent.capability}`}>
                          View Agent <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-0 divide-y">
                  {mockJobs.map((job) => {
                    const status = statusConfig[job.status] || statusConfig.completed;
                    const StatusIcon = status.icon;
                    return (
                      <div
                        key={job.id}
                        className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`h-8 w-8 rounded-lg ${status.className} flex items-center justify-center shrink-0`}
                          >
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {job.task}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {job.agent} · {job.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-xs ${status.className}`}
                          >
                            {status.label}
                          </Badge>
                          <span className="text-sm font-medium w-16 text-right">
                            {job.amount}
                          </span>
                          {job.txHash ? (
                            <a
                              href={`https://hashscan.io/testnet/transaction/${job.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <div className="w-3.5" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hedera Transaction Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Hedera Transaction Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">
                  Agent Registrations
                </p>
                <p className="text-lg font-bold">
                  {mockAgents.length} NFT mints
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">
                  Escrow Transactions
                </p>
                <p className="text-lg font-bold">{totalJobs * 3} txns</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">
                  HCS Messages
                </p>
                <p className="text-lg font-bold">{totalJobs * 4} logs</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">
                  Total On-Chain Actions
                </p>
                <p className="text-lg font-bold text-primary">
                  {mockAgents.length + totalJobs * 7}+
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
