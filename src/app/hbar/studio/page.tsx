"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { hbarSkillsUi, POLICY_BADGE } from "@hbar/lib/ui-tokens";
import type { BudgetConfig, ApprovalConfig } from "@hbar/lib/policy-state";
import type {
  CustomAgentSpec,
  DataSourceId,
} from "@hbar/lib/custom-agent";
import { CUSTOM_TASK_PRICE_HBAR } from "@hbar/lib/custom-agent";
import type { SwapExecutorIntake, SwapQuotePreview } from "@hbar/agents/swap-executor/types";
import {
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
  Wrench,
} from "lucide-react";

type Step = "build" | "preview" | "run";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("hbar-session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("hbar-session", id);
  }
  return id;
}

type RunResult = {
  status: string;
  policyState?: string;
  reason?: string;
  result?: Record<string, unknown>;
  quote?: SwapQuotePreview;
  txId?: string;
  swapTxId?: string;
  hashScanTopicUrl?: string;
  approvalId?: string;
  approvalKind?: "payment" | "swap";
  recipient?: string;
  amountHbar?: number;
  swapMetadata?: SwapQuotePreview;
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

const DATA_SOURCES: { id: DataSourceId; label: string; description: string }[] = [
  { id: "bonzo", label: "Bonzo", description: "Lending market data (read-only)" },
  { id: "pyth", label: "Pyth", description: "Oracle prices (read-only)" },
  {
    id: "saucerswap-quote",
    label: "SaucerSwap",
    description: "Pool quotes (read); enable write below for swaps",
  },
];

export function AgentStudioPage() {
  const searchParams = useSearchParams();
  const loadAgentId = searchParams.get("agent");

  const sessionId = useMemo(() => getSessionId(), []);
  const [step, setStep] = useState<Step>("build");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const [name, setName] = useState("My Yield Watcher");
  const [objective, setObjective] = useState(
    "Monitor Bonzo supply APY for HBAR and stablecoins, cross-check with Pyth prices, and summarize the best low-risk opportunity."
  );
  const [dataSources, setDataSources] = useState<DataSourceId[]>(["bonzo", "pyth"]);
  const [allowWrite, setAllowWrite] = useState(false);
  const [perTaskCap, setPerTaskCap] = useState(5);
  const [dailyBudget, setDailyBudget] = useState(20);
  const [autoApproveBelow, setAutoApproveBelow] = useState(2);
  const [maxSlippagePct, setMaxSlippagePct] = useState(0.5);

  const [tokenIn, setTokenIn] = useState("HBAR");
  const [tokenOut, setTokenOut] = useState("SAUCE");
  const [amountIn, setAmountIn] = useState(10);

  const [policyState, setPolicyState] = useState("within policy");
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<RunResult | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [hashScanTopicUrl, setHashScanTopicUrl] = useState<string | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<RunResult | null>(null);
  const [paymentTxId, setPaymentTxId] = useState<string | undefined>();

  useEffect(() => {
    if (!loadAgentId) return;
    fetch(`/api/hbar/custom-agents/${loadAgentId}`, {
      headers: { "x-session-id": sessionId },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { spec?: CustomAgentSpec } | null) => {
        if (!data?.spec) return;
        const s = data.spec;
        setName(s.name);
        setObjective(s.objective);
        setDataSources(s.dataSources);
        setAllowWrite(s.allowWrite ?? false);
        setPerTaskCap(s.budget.perTaskCapHbar);
        setDailyBudget(s.budget.dailyBudgetHbar);
        setAutoApproveBelow(s.approval.autoApproveBelowHbar);
        if (s.maxSlippagePct != null) setMaxSlippagePct(s.maxSlippagePct);
        setStep("run");
      })
      .catch(() => undefined);
  }, [loadAgentId, sessionId]);

  const writeEnabled = allowWrite && dataSources.includes("saucerswap-quote");
  const taskType = writeEnabled ? "write" : "read";

  const spec: CustomAgentSpec = useMemo(
    () => ({
      id: slugify(name) || "custom-agent",
      name,
      objective,
      dataSources,
      taskType,
      budget: { perTaskCapHbar: perTaskCap, dailyBudgetHbar: dailyBudget },
      approval: {
        autoApproveBelowHbar: autoApproveBelow,
        alwaysApproveTaskTypes: taskType === "write" ? ["write"] : ["write"],
      },
      maxSlippagePct: writeEnabled ? maxSlippagePct : undefined,
      allowWrite: writeEnabled,
      createdAt: new Date().toISOString(),
    }),
    [
      name,
      objective,
      dataSources,
      taskType,
      perTaskCap,
      dailyBudget,
      autoApproveBelow,
      maxSlippagePct,
      writeEnabled,
    ]
  );

  const swapIntake: SwapExecutorIntake | undefined = writeEnabled
    ? { tokenIn, tokenOut, amountIn, maxSlippagePct }
    : undefined;

  const policySummary = useMemo(() => {
    const lines = [
      `This agent can spend ≤ ${perTaskCap} HBAR per task (daily cap ${dailyBudget} HBAR).`,
      `Payments under ${autoApproveBelow} HBAR auto-approve; larger payments need your approval.`,
      taskType === "write"
        ? "Write mode: every swap requires your explicit approval. SlippagePolicy blocks swaps over max slippage."
        : "Read-only: no swaps or writes can execute.",
    ];
    if (writeEnabled) {
      lines.push(`Max slippage bound: ${maxSlippagePct}%.`);
    }
    return lines;
  }, [perTaskCap, dailyBudget, autoApproveBelow, taskType, writeEnabled, maxSlippagePct]);

  const toggleSource = (id: DataSourceId) => {
    setDataSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const runApi = useCallback(
    async (opts: { previewOnly?: boolean; skipPayment?: boolean; paymentTxId?: string; swapApproved?: boolean }) => {
      const res = await fetch("/api/hbar/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({
          agentId: "custom",
          sessionId,
          spec,
          userMessage: objective,
          budget: spec.budget,
          approval: spec.approval,
          amountHbar: CUSTOM_TASK_PRICE_HBAR,
          stream: false,
          swapIntake,
          previewOnly: opts.previewOnly,
          quoteOnly: opts.previewOnly && writeEnabled,
          skipPayment: opts.skipPayment,
          paymentTxId: opts.paymentTxId,
          swapApproved: opts.swapApproved,
        }),
      });
      return (await res.json()) as RunResult;
    },
    [sessionId, spec, objective, swapIntake, writeEnabled]
  );

  const handleSaveAgent = async () => {
    setSaveStatus(null);
    setLoading(true);
    try {
      const res = await fetch("/api/hbar/custom-agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId,
        },
        body: JSON.stringify({ spec }),
      });
      const data = (await res.json()) as { spec?: CustomAgentSpec; error?: string };
      if (!res.ok) {
        setSaveStatus(data.error ?? "Save failed");
        return;
      }
      setSaveStatus(`Saved as "${data.spec?.id ?? spec.id}" — visible in catalog`);
    } finally {
      setLoading(false);
    }
  };

  const handleDryRun = async () => {
    setLoading(true);
    setPreviewResult(null);
    try {
      const data = await runApi({ previewOnly: true });
      setPolicyState(data.policyState ?? "within policy");
      setPreviewResult(data);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveRun = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const data = await runApi({});
      setPolicyState(data.policyState ?? "within policy");
      setRunResult(data);
      if (data.hashScanTopicUrl) setHashScanTopicUrl(data.hashScanTopicUrl);

      if (data.status === "pending_approval") {
        setPendingApproval(data);
        setApprovalOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!pendingApproval?.approvalId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/hbar/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalId: pendingApproval.approvalId,
          approved,
          sessionId,
          budget: spec.budget,
          approval: spec.approval,
          agentId: "custom",
          spec,
          userMessage: objective,
          swapIntake,
          paymentTxId,
        }),
      });
      const data = (await res.json()) as RunResult;
      setPolicyState(data.policyState ?? (approved ? "within policy" : "rejected"));
      setRunResult(data);
      setApprovalOpen(false);
      setPendingApproval(null);

      if (!approved) return;

      if (data.txId) setPaymentTxId(data.txId);

      if (data.status === "pending_approval") {
        setPendingApproval(data);
        setApprovalOpen(true);
        return;
      }

      if (data.status === "success") {
        setRunResult(data);
      } else if (data.status === "approved") {
        const rerun = await runApi({ skipPayment: true, paymentTxId: data.txId });
        setRunResult(rerun);
      }
    } finally {
      setLoading(false);
    }
  };

  const canProceedBuild =
    name.trim() && objective.trim() && dataSources.length > 0;

  return (
    <main className={hbarSkillsUi.page}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/hbar"
          className={`text-sm ${hbarSkillsUi.text.secondary} hover:text-zinc-200`}
        >
          ← All HBAR Skills agents
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold">Agent Studio</h1>
            <p className={`text-sm ${hbarSkillsUi.text.secondary}`}>
              Train your own policy-gated agent — no code required
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-2 text-sm">
          {(["build", "preview", "run"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={
                  step === s
                    ? "font-semibold text-indigo-400"
                    : hbarSkillsUi.text.muted
                }
              >
                {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && <ChevronRight className="h-4 w-4 text-zinc-600" />}
            </div>
          ))}
        </div>

        {step === "build" && (
          <>
            <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
              <CardHeader>
                <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                  Agent identity
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <label className="grid gap-1 text-sm">
                  <span className={hbarSkillsUi.text.secondary}>Name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={hbarSkillsUi.input}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className={hbarSkillsUi.text.secondary}>Objective</span>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    rows={4}
                    className={`${hbarSkillsUi.input} w-full resize-y`}
                  />
                </label>
              </CardContent>
            </Card>

            <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
              <CardHeader>
                <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                  Data sources
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {DATA_SOURCES.map((src) => (
                  <label
                    key={src.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                      dataSources.includes(src.id)
                        ? "border-indigo-500/50 bg-indigo-500/5"
                        : "border-zinc-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={dataSources.includes(src.id)}
                      onChange={() => toggleSource(src.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className={`font-medium ${hbarSkillsUi.text.primary}`}>
                        {src.label}
                      </p>
                      <p className={`text-xs ${hbarSkillsUi.text.secondary}`}>
                        {src.description}
                      </p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
              <CardHeader>
                <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                  Task type & policy envelope
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={allowWrite}
                    disabled={!dataSources.includes("saucerswap-quote")}
                    onChange={(e) => setAllowWrite(e.target.checked)}
                  />
                  <span className={hbarSkillsUi.text.primary}>
                    Enable SaucerSwap writes (swaps)
                    {!dataSources.includes("saucerswap-quote") && (
                      <span className={`ml-2 ${hbarSkillsUi.text.muted}`}>
                        — enable SaucerSwap data source first
                      </span>
                    )}
                  </span>
                </label>
                {allowWrite && dataSources.includes("saucerswap-quote") && (
                  <p className="text-sm text-amber-400">
                    Warning: write mode requires dual approval (payment + swap) and
                    is gated by SlippagePolicy.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className={hbarSkillsUi.text.secondary}>
                      Per-task cap (HBAR)
                    </span>
                    <input
                      type="number"
                      min={0.1}
                      max={25}
                      step={0.1}
                      value={perTaskCap}
                      onChange={(e) =>
                        setPerTaskCap(parseFloat(e.target.value) || 5)
                      }
                      className={hbarSkillsUi.input}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className={hbarSkillsUi.text.secondary}>
                      Daily budget (HBAR)
                    </span>
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={dailyBudget}
                      onChange={(e) =>
                        setDailyBudget(parseFloat(e.target.value) || 20)
                      }
                      className={hbarSkillsUi.input}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className={hbarSkillsUi.text.secondary}>
                      Auto-approve below (HBAR)
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={autoApproveBelow}
                      onChange={(e) =>
                        setAutoApproveBelow(parseFloat(e.target.value) || 2)
                      }
                      className={hbarSkillsUi.input}
                    />
                  </label>
                  {writeEnabled && (
                    <label className="grid gap-1 text-sm">
                      <span className={hbarSkillsUi.text.secondary}>
                        Max slippage (%)
                      </span>
                      <input
                        type="number"
                        min={0.01}
                        step={0.1}
                        value={maxSlippagePct}
                        onChange={(e) =>
                          setMaxSlippagePct(parseFloat(e.target.value) || 0.5)
                        }
                        className={hbarSkillsUi.input}
                      />
                    </label>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className={`mt-6 border-indigo-500/30 ${hbarSkillsUi.surface}`}>
              <CardHeader>
                <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                  Live policy summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className={`list-inside list-disc space-y-1 text-sm ${hbarSkillsUi.text.secondary}`}>
                  {policySummary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className={`mt-3 text-xs ${hbarSkillsUi.text.muted}`}>
                  Task type: <strong className="text-zinc-300">{taskType}</strong> ·
                  Fee: {CUSTOM_TASK_PRICE_HBAR} HBAR/run
                </p>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button
                className={hbarSkillsUi.accentButton}
                disabled={!canProceedBuild}
                onClick={() => setStep("preview")}
              >
                Continue to Preview
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {step === "preview" && (
          <>
            <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
              <CardHeader>
                <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                  Assembled agent spec
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-300">
                  {JSON.stringify(spec, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
                onClick={() => setStep("build")}
              >
                ← Back
              </Button>
              <Button
                variant="outline"
                className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
                onClick={handleDryRun}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Dry run (no payment)
              </Button>
              <Button
                variant="outline"
                className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
                onClick={handleSaveAgent}
                disabled={loading}
              >
                Save this agent
              </Button>
              <Button
                className={hbarSkillsUi.accentButton}
                onClick={() => setStep("run")}
              >
                Continue to Run
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {saveStatus && (
              <p className={`mt-3 text-sm ${saveStatus.includes("Saved") ? "text-emerald-400" : "text-red-400"}`}>
                {saveStatus}
              </p>
            )}

            {previewResult?.result && (
              <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
                <CardHeader>
                  <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                    Dry-run result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto text-xs text-zinc-300">
                    {JSON.stringify(previewResult.result, null, 2)}
                  </pre>
                  {previewResult.quote && (
                    <p className={`mt-2 text-sm ${hbarSkillsUi.text.secondary}`}>
                      Quote: {previewResult.quote.amountIn}{" "}
                      {previewResult.quote.tokenIn} →{" "}
                      {previewResult.quote.expectedAmountOut}{" "}
                      {previewResult.quote.tokenOut}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {step === "run" && (
          <>
            {writeEnabled && (
              <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
                <CardHeader>
                  <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                    Swap parameters (write agent)
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm">
                    <span className={hbarSkillsUi.text.secondary}>Token in</span>
                    <input
                      value={tokenIn}
                      onChange={(e) => setTokenIn(e.target.value)}
                      className={hbarSkillsUi.input}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className={hbarSkillsUi.text.secondary}>Token out</span>
                    <input
                      value={tokenOut}
                      onChange={(e) => setTokenOut(e.target.value)}
                      className={hbarSkillsUi.input}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className={hbarSkillsUi.text.secondary}>Amount in</span>
                    <input
                      type="number"
                      min={0.0001}
                      value={amountIn}
                      onChange={(e) => setAmountIn(parseFloat(e.target.value) || 0)}
                      className={hbarSkillsUi.input}
                    />
                  </label>
                </CardContent>
              </Card>
            )}

            <Card className={`mt-6 border-indigo-500/30 ${hbarSkillsUi.surface}`}>
              <CardContent className="pt-6">
                <ul className={`list-inside list-disc space-y-1 text-sm ${hbarSkillsUi.text.secondary}`}>
                  {policySummary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="mt-6">
              <PolicyBadge policyState={policyState} />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
                onClick={() => setStep("preview")}
              >
                ← Back
              </Button>
              <Button
                className={hbarSkillsUi.accentButton}
                onClick={handleLiveRun}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Run agent ({CUSTOM_TASK_PRICE_HBAR} HBAR)
              </Button>
              <Button
                variant="outline"
                className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
                onClick={handleSaveAgent}
                disabled={loading}
              >
                Save this agent
              </Button>
            </div>

            {saveStatus && (
              <p className={`mt-3 text-sm ${saveStatus.includes("Saved") ? "text-emerald-400" : "text-red-400"}`}>
                {saveStatus}
              </p>
            )}

            {runResult?.reason && runResult.status === "blocked" && (
              <p className="mt-4 text-sm text-red-400">{runResult.reason}</p>
            )}

            {runResult?.result && (
              <Card className={`mt-6 ${hbarSkillsUi.surface}`}>
                <CardHeader>
                  <CardTitle className={`text-base ${hbarSkillsUi.text.primary}`}>
                    Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto text-xs text-zinc-300">
                    {JSON.stringify(runResult.result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {(runResult?.txId || runResult?.swapTxId) && (
              <div className="mt-6 flex flex-col gap-2">
                {runResult.swapTxId && (
                  <a
                    href={`https://hashscan.io/testnet/transaction/${runResult.swapTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-sm font-medium ${hbarSkillsUi.link}`}
                  >
                    View swap on HashScan
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {runResult.txId && (
                  <a
                    href={`https://hashscan.io/testnet/transaction/${runResult.txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-sm font-medium ${hbarSkillsUi.link}`}
                  >
                    View payment on HashScan
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {hashScanTopicUrl && (
                  <a
                    href={hashScanTopicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-sm font-medium ${hbarSkillsUi.link}`}
                  >
                    View audit trail on HashScan
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
          </>
        )}

        <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
          <DialogContent
            className={`${hbarSkillsUi.surface} ${hbarSkillsUi.text.primary} border-zinc-700 max-w-md`}
          >
            <DialogHeader>
              <DialogTitle>
                {pendingApproval?.approvalKind === "swap"
                  ? "Approve swap transaction"
                  : "Approval required"}
              </DialogTitle>
              <DialogDescription className={hbarSkillsUi.text.secondary}>
                ContextualApprovalPolicy requires your sign-off before this{" "}
                {pendingApproval?.approvalKind === "swap" ? "swap" : "payment"}{" "}
                proceeds.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              {pendingApproval?.swapMetadata && (
                <p className="text-lg font-semibold">
                  {pendingApproval.swapMetadata.tokenIn} →{" "}
                  {pendingApproval.swapMetadata.tokenOut}
                </p>
              )}
              <p>
                <span className={hbarSkillsUi.text.secondary}>Amount:</span>{" "}
                {pendingApproval?.amountHbar ?? CUSTOM_TASK_PRICE_HBAR} HBAR
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
                onClick={() => handleApprove(false)}
                disabled={loading}
              >
                Reject
              </Button>
              <Button
                className={hbarSkillsUi.accentButton}
                onClick={() => handleApprove(true)}
                disabled={loading}
              >
                Approve Transaction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className={`mt-12 flex items-center gap-2 text-xs ${hbarSkillsUi.text.muted}`}>
          <Wrench className="h-3.5 w-3.5" />
          Policy layer: SpendLimit · Counterparty allowlist · ContextualApproval
          {taskType === "write" ? " · SlippagePolicy" : ""}
        </div>
      </div>
    </main>
  );
}

export default function AgentStudioPageWrapper() {
  return (
    <Suspense
      fallback={
        <main className={hbarSkillsUi.page}>
          <div className="mx-auto max-w-3xl px-4 py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          </div>
        </main>
      }
    >
      <AgentStudioPage />
    </Suspense>
  );
}
