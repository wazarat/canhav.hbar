import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { customAgents } from "@/lib/db/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = req.headers.get("x-session-id");
  if (!sessionId) {
    return NextResponse.json({ error: "x-session-id header required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured" },
      { status: 503 }
    );
  }

  try {
    const rows = await db
      .select()
      .from(customAgents)
      .where(
        and(eq(customAgents.sessionId, sessionId), eq(customAgents.id, params.id))
      )
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ error: "Custom agent not found" }, { status: 404 });
    }

    return NextResponse.json({ spec: rows[0].spec });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
