import { NextResponse } from "next/server";
import { buildManifest } from "@/lib/ucp";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getReputationRegistry } from "@/lib/contracts";
import type { UCPCapability } from "@/lib/ucp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let capabilities: UCPCapability[] = [];

    if (process.env.DATABASE_URL) {
      try {
        const activeAgents = await db
          .select()
          .from(agents)
          .where(eq(agents.status, "active"));

        let registry: ReturnType<typeof getReputationRegistry> | null = null;
        if (process.env.NEXT_PUBLIC_REPUTATION_REGISTRY_ADDRESS) {
          try {
            registry = getReputationRegistry();
          } catch {
            // contracts not deployed
          }
        }

        capabilities = await Promise.all(
          activeAgents.map(async (agent) => {
            let rating = { score: 0, count: 0 };
            if (agent.onChainAgentId !== null && registry) {
              try {
                const summary = await registry.getSummary(agent.onChainAgentId);
                const count = Number(summary[0]);
                const total = Number(summary[1]);
                rating = {
                  score: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
                  count,
                };
              } catch {
                // ignore
              }
            }
            return {
              agentId: agent.id,
              onChainAgentId: agent.onChainAgentId,
              name: agent.name,
              description: agent.description,
              capabilities: agent.capabilities,
              pricing: { usd: agent.pricingUsd },
              rating,
              intakeSchema: agent.intakeSchema ?? null,
              endpoint: `${appUrl}/api/ucp/checkout`,
            };
          })
        );
      } catch (err) {
        console.warn("[api/ucp/capabilities] DB or registry error:", err);
      }
    }

    const manifest = buildManifest(capabilities);
    return NextResponse.json(manifest);
  } catch (error) {
    console.error("[api/ucp/capabilities]", error);
    return NextResponse.json(
      { error: "Failed to load capabilities" },
      { status: 500 }
    );
  }
}
