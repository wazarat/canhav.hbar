import { NextRequest, NextResponse } from "next/server";
import {
  executeBonzoVaultBatchRun,
  executeBonzoVaultRun,
} from "@hbar/lib/execute-bonzo-vault-run";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${cronSecret}`;
}

async function resolveStrategyId(
  req: NextRequest,
  body?: Record<string, unknown>
): Promise<string | undefined> {
  const fromQuery = req.nextUrl.searchParams.get("strategyId");
  if (fromQuery?.trim()) return fromQuery.trim();

  const fromBody = body?.strategyId;
  if (typeof fromBody === "string" && fromBody.trim()) {
    return fromBody.trim();
  }

  return undefined;
}

async function handleRun(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> | undefined;
  if (req.method === "POST") {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = undefined;
    }
  }

  const strategyId = await resolveStrategyId(req, body);

  if (!strategyId) {
    const batch = await executeBonzoVaultBatchRun();
    const status =
      batch.status === "error" ? 500 : batch.status === "empty" ? 200 : 200;
    return NextResponse.json(batch, { status });
  }

  const result = await executeBonzoVaultRun({ strategyId });

  if (result.status === "error") {
    const status = result.error === "Strategy not found" ? 404 : 500;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

/** Vercel cron invokes GET with Authorization: Bearer CRON_SECRET. */
export async function GET(req: NextRequest) {
  try {
    return await handleRun(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Keeper run failed";
    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleRun(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Keeper run failed";
    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}
