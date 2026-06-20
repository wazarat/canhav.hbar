import { NextResponse } from "next/server";
import { getYieldScoutReadiness, validateHbarEnv } from "@hbar/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const validation = validateHbarEnv();

  return NextResponse.json({
    status: validation.ok ? "ok" : "degraded",
    network: "testnet",
    time: new Date().toISOString(),
    checks: validation.checks,
    yieldScout: getYieldScoutReadiness(validation.checks),
    warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
  });
}
