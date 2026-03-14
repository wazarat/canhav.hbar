import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, params.id));
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json({ agent });
  } catch {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }
}
