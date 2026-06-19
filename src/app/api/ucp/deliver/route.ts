import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getEscrow, getSigner } from "@/lib/contracts";
import { logToHcs } from "@/lib/log-job-hcs";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }
    if (!process.env.NEXT_PUBLIC_ESCROW_ADDRESS) {
      return NextResponse.json(
        { error: "Contracts not deployed; set ESCROW address" },
        { status: 503 }
      );
    }
    if (
      !process.env.HEDERA_OPERATOR_KEY &&
      !process.env.DEPLOYER_PRIVATE_KEY
    ) {
      return NextResponse.json(
        { error: "EVM signing not configured; set HEDERA_OPERATOR_KEY" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { sessionId, result } = body;

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
    if (job.status !== "funded" && job.status !== "in_progress") {
      return NextResponse.json(
        { error: `Job cannot be delivered, status: ${job.status}` },
        { status: 400 }
      );
    }

    await db
      .update(jobs)
      .set({
        status: "delivered",
        result: result != null ? String(result) : null,
        completedAt: new Date(),
      })
      .where(eq(jobs.id, sessionId));

    await logToHcs(sessionId, job.hcsTopicId, "job_delivered", {
      onChainJobId: job.onChainJobId,
    });

    if (job.onChainJobId !== null) {
      try {
        const signer = getSigner();
        const escrow = getEscrow(signer);
        await escrow.completeJob(job.onChainJobId);
        await logToHcs(sessionId, job.hcsTopicId, "escrow_released", {
          onChainJobId: job.onChainJobId,
        });
        await db
          .update(jobs)
          .set({ status: "completed" })
          .where(eq(jobs.id, sessionId));
      } catch (e) {
        console.error("[deliver] completeJob on-chain failed:", e);
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({
      sessionId,
      status: "delivered",
      resultUrl: `${appUrl}/jobs/${sessionId}`,
    });
  } catch (error) {
    console.error("[api/ucp/deliver]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Deliver failed" },
      { status: 500 }
    );
  }
}
