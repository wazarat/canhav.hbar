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
  ArrowLeft,
  Bot,
  Loader2,
  CheckCircle,
  Zap,
  ExternalLink,
} from "lucide-react";

type FormState = {
  name: string;
  description: string;
  capability: string;
  pricingUsd: string;
  walletAddress: string;
};

export default function CreateAgentPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    capability: "hedera-skills",
    pricingUsd: "1.00",
    walletAddress: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    agentId: number;
    txHash: string;
    holTopicId?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    if (!form.name || !form.description || !form.capability) {
      setError("Name, description, and capability are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const agentURI = JSON.stringify({
        name: form.name,
        description: form.description,
        capability: form.capability,
        pricingUsd: form.pricingUsd,
      });

      const res = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentURI,
          walletAddress: form.walletAddress || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      setResult({ agentId: data.agentId, txHash: data.txHash, holTopicId: data.holTopicId });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <NavHeader />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" /> Marketplace
          </Link>
        </Button>

        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            On-Chain Registration
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Create an Agent</h1>
          <p className="text-muted-foreground">
            Register a new AI agent on the Hedera network. The agent receives an
            ERC-8004 NFT identity and becomes discoverable in the marketplace.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Agent Details
            </CardTitle>
            <CardDescription>
              All fields are recorded on-chain as the agent&apos;s URI metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Agent Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="My Hedera Agent"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Description <span className="text-destructive">*</span>
              </label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Describe what your agent does..."
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Capability Type <span className="text-destructive">*</span>
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.capability}
                onChange={(e) => setField("capability", e.target.value)}
              >
                <option value="hedera-skills">HederaSkills</option>
                <option value="market-intel">Market Intel</option>
                <option value="contract-auditor">Contract Auditor</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Price (USD / job)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1.00"
                  value={form.pricingUsd}
                  onChange={(e) => setField("pricingUsd", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Wallet Address
                </label>
                <Input
                  placeholder="0x..."
                  value={form.walletAddress}
                  onChange={(e) => setField("walletAddress", e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>
                  Registering an agent creates 1 on-chain NFT mint transaction
                  + 1 metadata update on the Hedera network.
                </span>
              </div>

              <Button
                onClick={handleCreate}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering on Hedera...
                  </>
                ) : (
                  "Register Agent On-Chain"
                )}
              </Button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                {error}
              </div>
            )}

            {result && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Agent Registered!</h3>
                </div>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Agent ID:</span>{" "}
                    <strong>#{result.agentId}</strong>
                  </p>
                  <p className="flex items-center gap-1">
                    <span className="text-muted-foreground">Tx:</span>{" "}
                    <a
                      href={`https://hashscan.io/testnet/transaction/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {result.txHash.slice(0, 16)}...
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  {result.holTopicId && (
                    <p className="flex items-center gap-1">
                      <span className="text-muted-foreground">HOL Registry:</span>{" "}
                      <a
                        href={`https://hashscan.io/testnet/topic/${result.holTopicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        {result.holTopicId}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
