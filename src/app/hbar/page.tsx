import Link from "next/link";
import { AGENT_CATALOG } from "@hbar/lib/agent-catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hbarSkillsUi } from "@hbar/lib/ui-tokens";

export default function HbarAgentsPage() {
  return (
    <main className={hbarSkillsUi.page}>
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <p className={`text-sm ${hbarSkillsUi.text.secondary}`}>
            Hedera AI Agent Bounty
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">HBAR Skills</h1>
          <p className={`mt-2 max-w-2xl ${hbarSkillsUi.text.secondary}`}>
            Policy-gated DeFi agents with spend caps, counterparty allowlists, and
            human-in-the-loop approval. Testnet only.
          </p>
        </div>

        <div className="grid gap-4">
          {AGENT_CATALOG.map((agent) => (
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
                {agent.status === "active" ? (
                  <Badge className="shrink-0 bg-emerald-600/90 text-white">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0 border-zinc-600 bg-zinc-800 text-zinc-300">
                    Coming soon · {agent.milestone}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {agent.status === "active" ? (
                  <Link
                    href={`/hbar/${agent.id}`}
                    className={`text-sm font-medium ${hbarSkillsUi.link}`}
                  >
                    Run agent →
                  </Link>
                ) : (
                  <span className={`text-sm ${hbarSkillsUi.text.muted}`}>
                    Available in {agent.milestone}
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
