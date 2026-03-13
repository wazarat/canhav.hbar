import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: job.id,
      status: job.status,
      onChainJobId: job.onChainJobId,
      amountUsd: job.amountUsd,
      amountHbar: job.amountHbar,
      result: job.result,
      rating: job.rating,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("[api/jobs/[id]/status]", error);
    return NextResponse.json(
      { error: "Failed to get job status" },
      { status: 500 }
    );
  }
}
