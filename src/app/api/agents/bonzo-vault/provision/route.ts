import { NextRequest, NextResponse } from "next/server";
import { formatZodErrors } from "@/lib/bonzo/survey-steps";
import { provisionStrategy } from "@/lib/bonzo/provision-strategy";
import { getVaultAdapter } from "@/lib/bonzo/vault-adapter-factory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adapter = getVaultAdapter();
    const outcome = await provisionStrategy(body, adapter);

    if (!outcome.ok) {
      if (outcome.status === 400) {
        const issues = Array.isArray(outcome.errors) ? outcome.errors : [];
        return NextResponse.json(
          {
            error: "Invalid strategy config",
            errors: formatZodErrors(
              issues as Parameters<typeof formatZodErrors>[0]
            ),
            issues,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: outcome.error }, { status: 500 });
    }

    const { result } = outcome;
    return NextResponse.json({
      strategyId: result.strategyId,
      dbId: result.dbId,
      vaultAddress: result.vaultAddress,
      hcsTopicId: result.hcsTopicId,
      hcsTxId: result.hcsTxId,
      status: result.status,
      adapterMode: result.adapterMode,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Provision failed";
    if (message.includes("Phase 2 blocked")) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
