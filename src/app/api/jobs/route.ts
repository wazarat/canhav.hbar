import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, agents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ jobs: [] });
    }

    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

    const rows = await db
      .select({
        id: jobs.id,
        status: jobs.status,
        taskDescription: jobs.taskDescription,
        amountUsd: jobs.amountUsd,
        amountHbar: jobs.amountHbar,
        result: jobs.result,
        rating: jobs.rating,
        escrowTxHash: jobs.escrowTxHash,
        hcsTopicId: jobs.hcsTopicId,
        onChainJobId: jobs.onChainJobId,
        createdAt: jobs.createdAt,
        completedAt: jobs.completedAt,
        hiringAgentId: jobs.hiringAgentId,
        agentName: agents.name,
        agentCapability: agents.capability,
      })
      .from(jobs)
      .leftJoin(agents, eq(jobs.workerAgentId, agents.id))
      .orderBy(desc(jobs.createdAt))
      .limit(limit);

    const filtered = walletAddress
      ? rows.filter((r) => r.hiringAgentId === walletAddress)
      : rows;

    return NextResponse.json({ jobs: filtered });
  } catch (error) {
    console.error("[api/jobs]", error);
    return NextResponse.json({ jobs: [] });
  }
}
