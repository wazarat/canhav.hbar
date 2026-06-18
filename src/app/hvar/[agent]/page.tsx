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
import {
  yieldScoutAgentConfig,
  YIELD_SCOUT_TASK_PRICE_HBAR,
} from "@hvar/agents/yield-scout/config.client";
import type { BudgetConfig, ApprovalConfig } from "@hvar/lib/policy-state";
import type { YieldScoutReport } from "@hvar/agents/yield-scout/types";
import { hbarSkillsUi, POLICY_BADGE } from "@hvar/lib/ui-tokens";
import { ExternalLink, Loader2, Shield, TrendingUp } from "lucide-react";

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
  report?: YieldScoutReport;
  txId?: string;
  hashScanTopicUrl?: string;
  approvalId?: string;
  recipient?: string;
  amountHbar?: number;
};

function PolicyBadge({ policyState }: { policyState: string }) {
  const badge = POLICY_BADGE[policyState] ?? POLICY_BADGE["within policy"];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${badge.className}`}
    >
      {badge.icon} {badge.label}
    </span>
  );
}

function BudgetControls({
  budget,
  onChange,
}: {
  budget: BudgetConfig;
  onChange: (b: BudgetConfig) => void;
}) {
  return (
    <Card className={`mt-8 ${hbarSkillsUi.surface}`}>
      <CardHeader>
        <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
          Budget controls
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className={hbarSkillsUi.text.secondary}>Per-task cap (HBAR)</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={budget.perTaskCapHbar}
            onChange={(e) =>
              onChange({
                ...budget,
                perTaskCapHbar: parseFloat(e.target.value) || 0,
              })
            }
            className={hbarSkillsUi.input}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className={hbarSkillsUi.text.secondary}>Daily budget (HBAR)</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={budget.dailyBudgetHbar}
            onChange={(e) =>
              onChange({
                ...budget,
                dailyBudgetHbar: parseFloat(e.target.value) || 0,
              })
            }
            className={hbarSkillsUi.input}
          />
        </label>
      </CardContent>
    </Card>
  );
}

function ApprovalModal({
  open,
  onOpenChange,
  pending,
  loading,
  onApprove,
  taskLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: PayResult | null;
  loading: boolean;
  onApprove: (approved: boolean) => void;
  taskLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${hbarSkillsUi.surface} ${hbarSkillsUi.text.primary} border-zinc-700`}>
        <DialogHeader>
          <DialogTitle>Approval required</DialogTitle>
          <DialogDescription className={hbarSkillsUi.text.secondary}>
            ContextualApprovalPolicy requires your sign-off before this payment
            proceeds.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <span className={hbarSkillsUi.text.secondary}>Task:</span> {taskLabel}
          </p>
          <p>
            <span className={hbarSkillsUi.text.secondary}>Recipient:</span>{" "}
            {pending?.recipient}
          </p>
          <p>
            <span className={hbarSkillsUi.text.secondary}>Amount:</span>{" "}
            {pending?.amountHbar} HBAR
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
            onClick={() => onApprove(false)}
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            className={hbarSkillsUi.accentButton}
            onClick={() => onApprove(true)}
            disabled={loading}
          >
            Approve Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HashScanLinks({
  txId,
  topicUrl,
}: {
  txId?: string;
  topicUrl?: string | null;
}) {
  if (!txId && !topicUrl) return null;
  return (
    <div className="mt-6 flex flex-col gap-2">
      {txId && (
        <a
          href={`https://hashscan.io/testnet/transaction/${txId}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-sm font-medium ${hbarSkillsUi.link}`}
        >
          View payment on HashScan
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {topicUrl && (
        <a
          href={topicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-sm font-medium ${hbarSkillsUi.link}`}
        >
          View audit trail on HashScan
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

function YieldScoutReportTable({ report }: { report: YieldScoutReport }) {
  return (
    <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
      <CardHeader>
        <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
          APY recommendation report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={`text-sm ${hbarSkillsUi.text.primary}`}>
          {report.recommendation}
        </p>
        {report.ranked.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-zinc-700">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className={`${hbarSkillsUi.muted} ${hbarSkillsUi.text.secondary}`}>
                <tr>
                  <th className="px-3 py-2 font-medium">Rank</th>
                  <th className="px-3 py-2 font-medium">Protocol</th>
                  <th className="px-3 py-2 font-medium">Asset</th>
                  <th className="px-3 py-2 font-medium">Raw APY</th>
                  <th className="px-3 py-2 font-medium">Risk-adj APY</th>
                  <th className="px-3 py-2 font-medium">Liquidity</th>
                  <th className="px-3 py-2 font-medium">Utilization</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {report.ranked.map((row) => (
                  <tr key={row.rank} className="border-t border-zinc-800">
                    <td className="px-3 py-2">{row.rank}</td>
                    <td className="px-3 py-2">{row.protocol}</td>
                    <td className="px-3 py-2">{row.asset}</td>
                    <td className="px-3 py-2">{row.rawApy.toFixed(2)}%</td>
                    <td className="px-3 py-2">{row.riskAdjustedApy.toFixed(2)}%</td>
                    <td className="px-3 py-2">
                      ${row.liquidity.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{row.utilization.toFixed(1)}%</td>
                    <td className={`px-3 py-2 ${hbarSkillsUi.text.secondary}`}>
                      {row.note ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm ${hbarSkillsUi.text.secondary}`}>
            No ranked markets returned.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HvarAgentPage({
  params,
}: {
  params: { agent: string };
}) {
  const agentMeta = AGENT_CATALOG.find((a) => a.id === params.agent);
  if (!agentMeta) notFound();

  if (agentMeta.status !== "active") {
    return (
      <main className={hbarSkillsUi.page}>
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">{agentMeta.name}</h1>
          <p className={`mt-2 ${hbarSkillsUi.text.secondary}`}>
            Coming soon in {agentMeta.milestone}
          </p>
          <Link href="/hvar" className={`mt-6 inline-block ${hbarSkillsUi.link}`}>
            ← Back to HBAR Skills agents
          </Link>
        </div>
      </main>
    );
  }

  if (agentMeta.id === "yield-scout") {
    return <YieldScoutRunner name={agentMeta.name} />;
  }

  return <StubAgentRunner name={agentMeta.name} />;
}

function YieldScoutRunner({ name }: { name: string }) {
  const sessionId = useMemo(() => getSessionId(), []);
  const [goal, setGoal] = useState(
    "Find the best low-risk supply yield on Bonzo for HBAR and stablecoins"
  );
  const [budget, setBudget] = useState<BudgetConfig>(
    yieldScoutAgentConfig.defaultBudget
  );
  const [approval] = useState<ApprovalConfig>(
    yieldScoutAgentConfig.defaultApproval
  );
  const [policyState, setPolicyState] = useState("within policy");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<YieldScoutReport | null>(null);
  const [lastResult, setLastResult] = useState<PayResult | null>(null);
  const [hashScanTopicUrl, setHashScanTopicUrl] = useState<string | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PayResult | null>(null);
  const [testAmount, setTestAmount] = useState(YIELD_SCOUT_TASK_PRICE_HBAR);

  const runScout = useCallback(
    async (amountHbar: number) => {
      setLoading(true);
      setReport(null);
      setLastResult(null);
      try {
        const res = await fetch("/api/hvar/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            agentId: "yield-scout",
            goal,
            sessionId,
            budget,
            approval,
            amountHbar,
            stream: false,
          }),
        });
        const data = (await res.json()) as PayResult & {
          report?: YieldScoutReport;
        };
        setPolicyState(data.policyState ?? "within policy");
        setLastResult(data);
        if (data.hashScanTopicUrl) setHashScanTopicUrl(data.hashScanTopicUrl);

        if (data.status === "pending_approval") {
          setPendingApproval(data);
          setApprovalOpen(true);
          return;
        }

        if (data.status === "success" && data.report) {
          setReport(data.report);
        }
      } finally {
        setLoading(false);
      }
    },
    [sessionId, goal, budget, approval]
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
          agentId: "yield-scout",
        }),
      });
      const data = (await res.json()) as PayResult;
      setPolicyState(data.policyState ?? (approved ? "within policy" : "rejected"));
      setLastResult(data);
      setApprovalOpen(false);
      setPendingApproval(null);

      if (approved && data.status === "success") {
        const analysisRes = await fetch("/api/hvar/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-session-id": sessionId,
          },
          body: JSON.stringify({
            agentId: "yield-scout",
            goal,
            sessionId,
            budget,
            approval,
            skipPayment: true,
            paymentTxId: data.txId,
            stream: false,
          }),
        });
        const analysisData = (await analysisRes.json()) as PayResult & {
          report?: YieldScoutReport;
        };
        setPolicyState(analysisData.policyState ?? "within policy");
        setLastResult(analysisData);
        if (analysisData.status === "success" && analysisData.report) {
          setReport(analysisData.report);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={hbarSkillsUi.page}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/hvar" className={`text-sm ${hbarSkillsUi.text.secondary} hover:text-zinc-200`}>
          ← All HBAR Skills agents
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className={`text-sm ${hbarSkillsUi.text.secondary}`}>
              Read-only yield analysis · {YIELD_SCOUT_TASK_PRICE_HBAR} HBAR per run
            </p>
          </div>
        </div>

        <Card className={`mt-8 ${hbarSkillsUi.surface}`}>
          <CardHeader>
            <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
              Yield goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className={`${hbarSkillsUi.input} w-full resize-y`}
              placeholder="Describe your yield goal, risk tolerance, and asset preferences…"
            />
          </CardContent>
        </Card>

        <BudgetControls budget={budget} onChange={setBudget} />

        <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
          <CardContent className="pt-6">
            <label className="grid gap-1 text-sm">
              <span className={hbarSkillsUi.text.secondary}>
                Test task amount (HBAR) — use &gt; cap to test SpendLimit
              </span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={testAmount}
                onChange={(e) => setTestAmount(parseFloat(e.target.value) || 1)}
                className={hbarSkillsUi.input}
              />
            </label>
          </CardContent>
        </Card>

        <div className="mt-6">
          <PolicyBadge policyState={policyState} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className={hbarSkillsUi.accentButton}
            onClick={() => runScout(YIELD_SCOUT_TASK_PRICE_HBAR)}
            disabled={loading || !goal.trim()}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run Yield Scout ({YIELD_SCOUT_TASK_PRICE_HBAR} HBAR)
          </Button>
          <Button
            variant="outline"
            className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
            onClick={() => runScout(testAmount)}
            disabled={loading || !goal.trim()}
          >
            Test custom amount
          </Button>
        </div>

        {lastResult?.reason && lastResult.status === "blocked" && (
          <p className="mt-4 text-sm text-red-400">{lastResult.reason}</p>
        )}

        {report && <YieldScoutReportTable report={report} />}

        <HashScanLinks
          txId={report?.paymentTxId ?? lastResult?.txId}
          topicUrl={hashScanTopicUrl}
        />

        <ApprovalModal
          open={approvalOpen}
          onOpenChange={setApprovalOpen}
          pending={pendingApproval}
          loading={loading}
          onApprove={handleApprove}
          taskLabel="Yield Scout task purchase"
        />
      </div>
    </main>
  );
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
          body: JSON.stringify({
            sessionId,
            budget,
            approval,
            amountHbar,
            agentId: "stub",
          }),
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
          agentId: "stub",
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

        <BudgetControls budget={budget} onChange={setBudget} />

        <label className="mt-4 grid gap-1 text-sm">
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

        <div className="mt-6">
          <PolicyBadge policyState={policyState} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => runPay(STUB_TASK_PRICE_HBAR)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Pay {STUB_TASK_PRICE_HBAR} HBAR (stub task)
          </Button>
          <Button variant="outline" onClick={() => runPay(testAmount)} disabled={loading}>
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

        <HashScanLinks txId={lastResult?.txId} topicUrl={hashScanTopicUrl} />

        <ApprovalModal
          open={approvalOpen}
          onOpenChange={setApprovalOpen}
          pending={pendingApproval}
          loading={loading}
          onApprove={handleApprove}
          taskLabel="stub task purchase"
        />
      </div>
    </main>
  );
}
