"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AGENT_CATALOG } from "@hvar/lib/agent-catalog";
import {
  stubAgentConfig,
  STUB_TASK_PRICE_HBAR,
} from "@hvar/agents/stub/config.client";
import type { BudgetConfig, ApprovalConfig } from "@hvar/lib/policy-state";
import { ExternalLink, Loader2, Shield } from "lucide-react";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("hvar-session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("hvar-session", id);
  }
  return id;
}

type PayResult = {
  status: string;
  policyState?: string;
  reason?: string;
  result?: unknown;
  txId?: string;
  hashScanTopicUrl?: string;
  approvalId?: string;
  recipient?: string;
  amountHbar?: number;
};

const POLICY_BADGE: Record<string, { label: string; className: string }> = {
  "within policy": {
    label: "within policy",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  "blocked by SpendLimit": {
    label: "blocked by SpendLimit",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
  },
  "counterparty not allowlisted": {
    label: "counterparty not allowlisted",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  },
  "needs your approval": {
    label: "needs your approval",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  rejected: {
    label: "rejected",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

export default function HvarAgentPage({
  params,
}: {
  params: { agent: string };
}) {
  const agentMeta = AGENT_CATALOG.find((a) => a.id === params.agent);
  if (!agentMeta) notFound();

  if (agentMeta.status !== "active") {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-bold">{agentMeta.name}</h1>
          <p className="mt-2 text-muted-foreground">Coming soon in {agentMeta.milestone}</p>
          <Link href="/hvar" className="mt-6 inline-block text-emerald-500 hover:underline">
            ← Back to agents
          </Link>
        </div>
      </main>
    );
  }

  return <StubAgentRunner name={agentMeta.name} />;
}

function StubAgentRunner({ name }: { name: string }) {
  const sessionId = useMemo(() => getSessionId(), []);
  const [budget, setBudget] = useState<BudgetConfig>(stubAgentConfig.defaultBudget);
  const [approval] = useState<ApprovalConfig>(stubAgentConfig.defaultApproval);
  const [policyState, setPolicyState] = useState("within policy");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<PayResult | null>(null);
  const [hashScanTopicUrl, setHashScanTopicUrl] = useState<string | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PayResult | null>(null);
  const [testAmount, setTestAmount] = useState(STUB_TASK_PRICE_HBAR);

  const badge = POLICY_BADGE[policyState] ?? POLICY_BADGE["within policy"];

  const runPay = useCallback(
    async (amountHbar: number) => {
      setLoading(true);
      setLastResult(null);
      try {
        const res = await fetch("/api/hvar/pay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({ sessionId, budget, approval, amountHbar }),
        });
        const data = (await res.json()) as PayResult;
        setPolicyState(data.policyState ?? "within policy");
        setLastResult(data);
        if (data.hashScanTopicUrl) setHashScanTopicUrl(data.hashScanTopicUrl);

        if (data.status === "pending_approval") {
          setPendingApproval(data);
          setApprovalOpen(true);
        }
      } finally {
        setLoading(false);
      }
    },
    [sessionId, budget, approval]
  );

  const handleApprove = async (approved: boolean) => {
    if (!pendingApproval?.approvalId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hvar/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId: pendingApproval.approvalId,
          approved,
          sessionId,
          budget,
          approval,
        }),
      });
      const data = (await res.json()) as PayResult;
      setPolicyState(data.policyState ?? (approved ? "within policy" : "rejected"));
      setLastResult(data);
      setApprovalOpen(false);
      setPendingApproval(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/hvar" className="text-sm text-muted-foreground hover:text-foreground">
          ← All agents
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <Shield className="h-8 w-8 text-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-sm text-muted-foreground">
              M1 policy rails · {STUB_TASK_PRICE_HBAR} HBAR stub task
            </p>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Budget controls</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Per-task cap (HBAR)</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={budget.perTaskCapHbar}
                onChange={(e) =>
                  setBudget((b) => ({
                    ...b,
                    perTaskCapHbar: parseFloat(e.target.value) || 0,
                  }))
                }
                className="rounded-md border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Daily budget (HBAR)</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={budget.dailyBudgetHbar}
                onChange={(e) =>
                  setBudget((b) => ({
                    ...b,
                    dailyBudgetHbar: parseFloat(e.target.value) || 0,
                  }))
                }
                className="rounded-md border bg-background px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">
                Test payment amount (HBAR) — use &gt; cap to test SpendLimit
              </span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={testAmount}
                onChange={(e) => setTestAmount(parseFloat(e.target.value) || 1)}
                className="rounded-md border bg-background px-3 py-2"
              />
            </label>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${badge.className}`}
          >
            {policyState === "within policy" && "✅ "}
            {policyState === "blocked by SpendLimit" && "⛔ "}
            {policyState === "counterparty not allowlisted" && "🚫 "}
            {policyState === "needs your approval" && "✋ "}
            {badge.label}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => runPay(STUB_TASK_PRICE_HBAR)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Pay {STUB_TASK_PRICE_HBAR} HBAR (stub task)
          </Button>
          <Button
            variant="outline"
            onClick={() => runPay(testAmount)}
            disabled={loading}
          >
            Test custom amount
          </Button>
        </div>

        {lastResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Status: <strong>{lastResult.status}</strong>
              </p>
              {lastResult.reason && (
                <p className="text-red-400">{lastResult.reason}</p>
              )}
              {lastResult.txId && (
                <p>
                  Tx:{" "}
                  <a
                    href={`https://hashscan.io/testnet/transaction/${lastResult.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-500 hover:underline"
                  >
                    {lastResult.txId}
                  </a>
                </p>
              )}
              {lastResult.result != null && (
                <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {JSON.stringify(lastResult.result, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {hashScanTopicUrl && (
          <a
            href={hashScanTopicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-sm text-emerald-500 hover:underline"
          >
            View HCS audit trail on HashScan
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approval required</DialogTitle>
              <DialogDescription>
                ContextualApprovalPolicy requires your sign-off before this payment
                proceeds.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Task:</span> stub task purchase
              </p>
              <p>
                <span className="text-muted-foreground">Recipient:</span>{" "}
                {pendingApproval?.recipient}
              </p>
              <p>
                <span className="text-muted-foreground">Amount:</span>{" "}
                {pendingApproval?.amountHbar} HBAR
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => handleApprove(false)}
                disabled={loading}
              >
                Reject
              </Button>
              <Button onClick={() => handleApprove(true)} disabled={loading}>
                Sign &amp; Execute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
