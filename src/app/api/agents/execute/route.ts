import { NextRequest, NextResponse } from "next/server";
import { executeAgent, type AgentCapability } from "@/lib/execute-agent";
import { db } from "@/lib/db";
import { agents, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createTopic } from "@/lib/hedera";
import { logToHcs } from "@/lib/log-job-hcs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { capability, intake, walletAddress } = body as {
      capability: AgentCapability;
      intake: Record<string, unknown>;
      walletAddress?: string;
    };

    if (!capability || !intake) {
      return NextResponse.json(
        { error: "capability and intake are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 503 }
      );
    }

    // Resolve worker agent from DB (fallback gracefully if DB not configured)
    let workerAgentId: string | null = null;
    let amountUsd: string | null = null;
    let hcsTopicId: string | null = null;
    let jobId: string | null = null;

    if (process.env.DATABASE_URL) {
      try {
        const [worker] = await db
          .select()
          .from(agents)
          .where(eq(agents.capability, capability));

        if (worker) {
          workerAgentId = worker.id;
          amountUsd = worker.pricingUsd;

          try {
            hcsTopicId = await createTopic();
          } catch {
            // Non-fatal: HCS topic creation can fail without breaking execution
          }

          const taskSummary =
            typeof intake.question === "string"
              ? intake.question
              : typeof intake.query === "string"
              ? intake.query
              : typeof intake.contractName === "string"
              ? `Audit: ${intake.contractName}`
              : capability;

          const [created] = await db
            .insert(jobs)
            .values({
              hiringAgentId: walletAddress ?? "direct-execute",
              workerAgentId: worker.id,
              taskDescription: taskSummary,
              amountUsd: worker.pricingUsd,
              status: "in_progress",
              hcsTopicId,
            })
            .returning();

          jobId = created.id;

          await logToHcs(jobId, hcsTopicId, "job_in_progress", {
            capability,
            walletAddress,
          });
        }
      } catch {
        // DB errors are non-fatal — agent still executes
      }
    }

    const result = await executeAgent(capability, intake);

    // Update job to completed and log result to HCS
    if (jobId && process.env.DATABASE_URL) {
      try {
        await db
          .update(jobs)
          .set({ status: "completed", result, completedAt: new Date() })
          .where(eq(jobs.id, jobId));

        await logToHcs(jobId, hcsTopicId, "job_delivered", { capability });
      } catch {
        // Non-fatal
      }
    }

    return NextResponse.json({
      result,
      jobId,
      amountUsd,
      hcsTopicId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Agent execution failed" },
      { status: 500 }
    );
  }
}
