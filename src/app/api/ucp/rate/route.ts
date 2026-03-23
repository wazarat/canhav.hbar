import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getReputationRegistry, getSigner } from "@/lib/contracts";
import { logToHcs } from "@/lib/log-job-hcs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, rating, tag1 = "", tag2 = "" } = body;

    if (!sessionId || rating == null) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, rating (1-5)" },
        { status: 400 }
      );
    }

    const r = Number(rating);
    if (r < 1 || r > 5 || !Number.isInteger(r)) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, sessionId));
    if (!job) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (job.status !== "completed" && job.status !== "delivered") {
      return NextResponse.json(
        { error: `Job cannot be rated, status: ${job.status}` },
        { status: 400 }
      );
    }

    if (!job.workerAgentId) {
      return NextResponse.json(
        { error: "Job has no worker agent" },
        { status: 400 }
      );
    }

    const [worker] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, job.workerAgentId));

    if (!worker || worker.onChainAgentId === null) {
      return NextResponse.json(
        { error: "Worker not registered on-chain" },
        { status: 400 }
      );
    }

    const registry = getReputationRegistry(getSigner());
    await registry.giveFeedback(
      worker.onChainAgentId,
      r,
      String(tag1).slice(0, 32),
      String(tag2).slice(0, 32)
    );

    await db
      .update(jobs)
      .set({ status: "rated", rating: r })
      .where(eq(jobs.id, sessionId));

    await logToHcs(sessionId, job.hcsTopicId, "job_rated", {
      onChainAgentId: worker.onChainAgentId,
      rating: r,
    });

    return NextResponse.json({
      sessionId,
      rating: r,
      agentId: worker.id,
      onChainAgentId: worker.onChainAgentId,
      status: "rated",
    });
  } catch (error) {
    console.error("[api/ucp/rate]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rate failed" },
      { status: 500 }
    );
  }
}
