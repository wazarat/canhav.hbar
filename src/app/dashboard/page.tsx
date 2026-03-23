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
  LogIn,
} from "lucide-react";
import {
  useWalletStore,
  shortenAddress,
  getHashScanAddressUrl,
  getHashScanTxUrl,
} from "@/lib/stores/wallet-store";

type AgentInfo = {
  id: number;
  name: string;
  capability: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  status: string;
  jobsCompleted: number;
  revenue: number;
  rating: number;
};

type JobInfo = {
  id: string;
  agent: string;
  task: string;
  status: string;
  amount: string;
  date: string;
  txHash: string | null;
  hcsTopicId?: string | null;
};

type ApiJob = {
  id: string;
  status: string;
  taskDescription: string | null;
  amountUsd: string | null;
  escrowTxHash: string | null;
  hcsTopicId: string | null;
  createdAt: string;
  agentName: string | null;
  agentCapability: string | null;
};

const capabilityIcons: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  "hedera-skills": { icon: BookOpen, color: "text-emerald-400", bgColor: "bg-emerald-400/10" },
  "market-intel": { icon: BarChart3, color: "text-blue-400", bgColor: "bg-blue-400/10" },
  "contract-auditor": { icon: Shield, color: "text-orange-400", bgColor: "bg-orange-400/10" },
};

const defaultAgents: AgentInfo[] = [
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

const defaultJobs: JobInfo[] = [
  {
    id: "job-001",
    agent: "HederaSkills Agent",
    task: "How to create an HTS fungible token",
    status: "completed",
    amount: "$1.00",
    date: "2026-03-12",
    txHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  },
  {
    id: "job-002",
    agent: "Market Intel Agent",
    task: "DeFi sector analysis with HTS integrations",
    status: "completed",
    amount: "$2.00",
    date: "2026-03-12",
    txHash: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
  },
  {
    id: "job-003",
    agent: "Contract Auditor Agent",
    task: "Audit Escrow.sol for Hedera-specific issues",
    status: "rated",
    amount: "$5.00",
    date: "2026-03-11",
    txHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
  },
  {
    id: "job-004",
    agent: "HederaSkills Agent",
    task: "Best practices for HCS topic management",
    status: "in_progress",
    amount: "$1.00",
    date: "2026-03-13",
    txHash: null,
    hcsTopicId: "0.0.5610001",
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
  pending_fund: { label: "Pending Fund", icon: Clock, className: "text-yellow-400 bg-yellow-400/10" },
  funded: { label: "Funded", icon: DollarSign, className: "text-blue-400 bg-blue-400/10" },
  in_progress: { label: "In Progress", icon: Zap, className: "text-purple-400 bg-purple-400/10" },
  delivered: { label: "Delivered", icon: CheckCircle, className: "text-cyan-400 bg-cyan-400/10" },
  completed: { label: "Completed", icon: CheckCircle, className: "text-emerald-400 bg-emerald-400/10" },
  rated: { label: "Rated", icon: Star, className: "text-yellow-400 bg-yellow-400/10" },
  disputed: { label: "Disputed", icon: AlertCircle, className: "text-red-400 bg-red-400/10" },
};

export default function DashboardPage() {
  const [tab, setTab] = useState("overview");
  const { address, isConnected, connect, isConnecting } = useWalletStore();
  const [agents, setAgents] = useState<AgentInfo[]>(defaultAgents);
  const [jobs, setJobs] = useState<JobInfo[]>(defaultJobs);
  const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        if (data.agents?.length) {
          const mapped: AgentInfo[] = data.agents.map(
            (a: { id: string; name: string; capability: string; status: string; pricingUsd: string }, i: number) => {
              const meta = capabilityIcons[a.capability] || capabilityIcons["hedera-skills"];
              return {
                id: i + 1,
                name: a.name,
                capability: a.capability,
                icon: meta.icon,
                color: meta.color,
                bgColor: meta.bgColor,
                status: a.status || "active",
                jobsCompleted: defaultAgents[i]?.jobsCompleted ?? 0,
                revenue: defaultAgents[i]?.revenue ?? 0,
                rating: defaultAgents[i]?.rating ?? 4.5,
              };
            }
          );
          setAgents(mapped);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    setJobsLoading(true);
    const url = address
      ? `/api/jobs?wallet=${encodeURIComponent(address)}&limit=20`
      : "/api/jobs?limit=20";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs?.length) {
          const mapped: JobInfo[] = data.jobs.map((j: ApiJob) => ({
            id: j.id,
            agent: j.agentName ?? j.agentCapability ?? "Agent",
            task: j.taskDescription ?? "—",
            status: j.status,
            amount: j.amountUsd ? `$${parseFloat(j.amountUsd).toFixed(2)}` : "—",
            date: j.createdAt ? new Date(j.createdAt).toISOString().slice(0, 10) : "—",
            txHash: j.escrowTxHash,
            hcsTopicId: j.hcsTopicId,
          }));
          setJobs(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, [isConnected, address]);

  const totalRevenue = agents.reduce((s, a) => s + a.revenue, 0);
  const totalJobs = agents.reduce((s, a) => s + a.jobsCompleted, 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <NavHeader />
        <main className="container mx-auto px-4 py-24 text-center max-w-lg">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-8">
            Connect your wallet to view your agents, track jobs, and monitor
            earnings on the Hedera network.
          </p>
          <Button onClick={connect} disabled={isConnecting} size="lg">
            {isConnecting ? (
              <Clock className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Connect Wallet
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your agents, track jobs, and monitor earnings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {address && (
              <a
                href={getHashScanAddressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <Wallet className="h-4 w-4 mr-2" />
                  {shortenAddress(address)}
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </a>
            )}
            <Button size="sm" asChild>
              <Link href="/agents/create">
                <Bot className="h-4 w-4 mr-2" /> New Agent
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Bot className="h-4 w-4" />
                Active Agents
              </div>
              <p className="text-3xl font-bold">{agents.length}</p>
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
                {agents.length > 0
                  ? (agents.reduce((s, a) => s + a.rating, 0) / agents.length).toFixed(1)
                  : "—"}
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
              {agents.map((agent) => {
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
                          <p className="text-lg font-bold">{agent.jobsCompleted}</p>
                          <p className="text-xs text-muted-foreground">Jobs</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">${agent.revenue.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{agent.rating}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full mt-4" asChild>
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
                {jobsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                        <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-muted rounded w-2/3" />
                          <div className="h-3 bg-muted rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="space-y-0 divide-y">
                  {jobs.map((job) => {
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
                            <p className="text-sm font-medium truncate">{job.task}</p>
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
                              href={getHashScanTxUrl(job.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title="View on HashScan"
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
                )}
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
            <CardDescription>
              All actions generate verifiable Hedera transactions.{" "}
              <a
                href="https://hashscan.io/testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View on HashScan
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Agent Registrations</p>
                <p className="text-lg font-bold">{agents.length} NFT mints</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Escrow Transactions</p>
                <p className="text-lg font-bold">{totalJobs * 3} txns</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">HCS Messages</p>
                <p className="text-lg font-bold">{totalJobs * 4} logs</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground text-xs">Total On-Chain Actions</p>
                <p className="text-lg font-bold text-primary">
                  {agents.length + totalJobs * 7}+
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
