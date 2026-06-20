"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MergedCatalogEntry } from "@hbar/lib/agent-catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hbarSkillsUi } from "@hbar/lib/ui-tokens";
import type { CustomAgentSpec } from "@hbar/lib/custom-agent";
import { Sparkles } from "lucide-react";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("hbar-session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("hbar-session", id);
  }
  return id;
}

export default function HbarAgentsPage() {
  const [customAgents, setCustomAgents] = useState<CustomAgentSpec[]>([]);
  const [builtinAgents, setBuiltinAgents] = useState<MergedCatalogEntry[]>([]);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch("/api/hbar/custom-agents", {
      headers: { "x-session-id": sessionId },
    })
      .then((r) => (r.ok ? r.json() : { agents: [] }))
      .then((data: { agents?: CustomAgentSpec[] }) =>
        setCustomAgents(data.agents ?? [])
      )
      .catch(() => setCustomAgents([]));

    fetch("/api/hbar/catalog")
      .then((r) => (r.ok ? r.json() : { agents: [] }))
      .then((data: { agents?: MergedCatalogEntry[] }) =>
        setBuiltinAgents(data.agents ?? [])
      )
      .catch(() => setBuiltinAgents([]));
  }, []);

  const mergedCatalog: MergedCatalogEntry[] = [
    ...builtinAgents,
    ...customAgents.map((spec) => ({
      id: spec.id,
      name: spec.name,
      description: spec.objective.slice(0, 120) + (spec.objective.length > 120 ? "…" : ""),
      status: "active" as const,
      isCustom: true,
    })),
  ];

  return (
    <main className={hbarSkillsUi.page}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">HBAR Skills</h1>
          <p className={`mt-2 max-w-2xl ${hbarSkillsUi.text.secondary}`}>
            Policy-gated DeFi agents with spend caps, counterparty allowlists, and
            human-in-the-loop approval. Testnet only.
          </p>
        </div>

        <Card
          className={`mb-6 border-indigo-500/40 bg-gradient-to-br from-zinc-900 to-indigo-950/30 ${hbarSkillsUi.surface}`}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-indigo-400" />
              <div>
                <CardTitle className={`text-lg ${hbarSkillsUi.text.primary}`}>
                  Agent Studio — Train Your Own
                </CardTitle>
                <p className={`mt-1 text-sm ${hbarSkillsUi.text.secondary}`}>
                  Compose a custom read-or-write agent from Bonzo, Pyth, and SaucerSwap
                  building blocks. Policy-gated, no code required.
                </p>
              </div>
            </div>
            <Badge className="shrink-0 bg-indigo-600/90 text-white">Headline</Badge>
          </CardHeader>
          <CardContent>
            <Link
              href="/hbar/studio"
              className={`text-sm font-medium ${hbarSkillsUi.link}`}
            >
              Open Agent Studio →
            </Link>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {mergedCatalog.map((agent) => (
            <Card key={agent.id} className={hbarSkillsUi.surface}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className={`text-lg ${hbarSkillsUi.text.primary}`}>
                    {agent.name}
                  </CardTitle>
                  <p className={`mt-1 text-sm ${hbarSkillsUi.text.secondary}`}>
                    {agent.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {agent.isCustom && (
                    <Badge className="bg-indigo-600/80 text-white">Custom</Badge>
                  )}
                  {agent.status === "active" ? (
                    <Badge className="bg-emerald-600/90 text-white">Active</Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="border-zinc-600 bg-zinc-800 text-zinc-300"
                    >
                      Coming soon
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {agent.status === "active" ? (
                  <Link
                    href={agent.isCustom ? `/hbar/studio?agent=${agent.id}` : `/hbar/${agent.id}`}
                    className={`text-sm font-medium ${hbarSkillsUi.link}`}
                  >
                    Run agent →
                  </Link>
                ) : (
                  <span className={`text-sm ${hbarSkillsUi.text.muted}`}>
                    Demo unavailable — API key pending
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
