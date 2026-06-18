import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { customAgents } from "@/lib/db/schema";
import {
  clampCustomAgentSpec,
  type CustomAgentSpec,
} from "@hbar/lib/custom-agent";

export async function GET(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id");
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id header required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured — custom agent persistence unavailable" },
      { status: 503 }
    );
  }

  try {
    const rows = await db
      .select()
      .from(customAgents)
      .where(eq(customAgents.sessionId, sessionId));

    return NextResponse.json({
      agents: rows.map((r) => r.spec),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionId = req.headers.get("x-session-id");
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id header required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured — custom agent persistence unavailable" },
      { status: 503 }
    );
  }

  const body = (await req.json()) as { spec: CustomAgentSpec };
  if (!body.spec?.name || !body.spec?.objective) {
    return NextResponse.json(
      { error: "spec with name and objective required" },
      { status: 400 }
    );
  }

  let spec: CustomAgentSpec;
  try {
    spec = clampCustomAgentSpec({
      ...body.spec,
      createdAt: body.spec.createdAt ?? new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const existing = await db
      .select()
      .from(customAgents)
      .where(
        and(eq(customAgents.sessionId, sessionId), eq(customAgents.id, spec.id))
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(customAgents)
        .set({ spec, createdAt: new Date() })
        .where(
          and(eq(customAgents.sessionId, sessionId), eq(customAgents.id, spec.id))
        );
    } else {
      await db.insert(customAgents).values({
        id: spec.id,
        sessionId,
        spec,
      });
    }

    return NextResponse.json({ spec });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
