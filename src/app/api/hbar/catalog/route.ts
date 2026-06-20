import { NextResponse } from "next/server";
import { getResolvedAgentCatalog } from "@hbar/lib/agent-catalog";
import { isSaucerSwapConfigured } from "@hbar/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    agents: getResolvedAgentCatalog(),
    saucerswapConfigured: isSaucerSwapConfigured(),
  });
}
