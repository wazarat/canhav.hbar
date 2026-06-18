import Link from "next/link";
import { AGENT_CATALOG } from "@hvar/lib/agent-catalog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HvarAgentsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Hedera AI Agent Bounty</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">HVAR Skills</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Policy-gated DeFi agents with spend caps, counterparty allowlists, and
            human-in-the-loop approval. Testnet only.
          </p>
        </div>

        <div className="grid gap-4">
          {AGENT_CATALOG.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div>
                  <CardTitle className="text-lg">{agent.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                </div>
                {agent.status === "active" ? (
                  <Badge className="shrink-0 bg-emerald-600">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="shrink-0">
                    Coming soon · {agent.milestone}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {agent.status === "active" ? (
                  <Link
                    href={`/hvar/${agent.id}`}
                    className="text-sm font-medium text-emerald-500 hover:underline"
                  >
                    Run agent →
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">
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
