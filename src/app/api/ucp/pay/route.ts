import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getEscrow } from "@/lib/contracts";
import { logToHcs } from "@/lib/log-job-hcs";

export const dynamic = "force-dynamic";

const ESCROW_STATUS_FUNDED = 1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing required field: sessionId" },
        { status: 400 }
      );
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, sessionId));
    if (!job) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (job.status !== "pending_fund") {
      return NextResponse.json(
        { error: `Job is not pending funding, status: ${job.status}` },
        { status: 400 }
      );
    }
    if (job.onChainJobId === null) {
      return NextResponse.json(
        { error: "Job has no on-chain ID" },
        { status: 400 }
      );
    }

    const escrow = getEscrow();
    const [, , , , status] = await escrow.getJob(job.onChainJobId);
    if (Number(status) !== ESCROW_STATUS_FUNDED) {
      return NextResponse.json(
        {
          error:
            "Escrow not yet funded on-chain. Call fundJob() on the escrow contract first.",
        },
        { status: 402 }
      );
    }

    await db
      .update(jobs)
      .set({ status: "funded" })
      .where(eq(jobs.id, sessionId));

    await logToHcs(sessionId, job.hcsTopicId, "job_funded", {
      hiringAgentId: job.hiringAgentId,
      onChainJobId: job.onChainJobId,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({
      sessionId,
      onChainJobId: job.onChainJobId,
      amountUsd: job.amountUsd,
      amountHbar: job.amountHbar,
      resultUrl: `${appUrl}/jobs/${sessionId}`,
      statusUrl: `${appUrl}/api/jobs/${sessionId}/status`,
      status: "funded",
    });
  } catch (error) {
    console.error("[api/ucp/pay]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pay failed" },
      { status: 500 }
    );
  }
}
