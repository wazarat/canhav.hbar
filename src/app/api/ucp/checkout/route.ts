import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAgentRegistry, getEscrow, getSigner, hbarToTinybar, usdToHbar } from "@/lib/contracts";
import { createTopic } from "@/lib/hedera";
import { logToHcs } from "@/lib/log-job-hcs";
import { validateIntake } from "@/lib/ucp";
import type { IntakeSchema } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }
    if (
      !process.env.NEXT_PUBLIC_ESCROW_ADDRESS ||
      !process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS
    ) {
      return NextResponse.json(
        { error: "Contracts not deployed; set ESCROW and AGENT_REGISTRY addresses" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { workerAgentId, hiringAgentId, taskDescription } = body;

    if (!workerAgentId || !hiringAgentId || !taskDescription) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: workerAgentId, hiringAgentId, taskDescription",
        },
        { status: 400 }
      );
    }

    const [worker] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, workerAgentId));

    if (!worker) {
      return NextResponse.json(
        { error: "Worker agent not found" },
        { status: 404 }
      );
    }

    const schema = worker.intakeSchema as IntakeSchema | null;
    if (schema) {
      const intake =
        typeof taskDescription === "object" ? taskDescription : null;
      if (!intake) {
        return NextResponse.json(
          {
            error:
              "taskDescription must be a structured object matching the worker's intake schema",
            intakeSchema: schema,
          },
          { status: 400 }
        );
      }
      const missing = validateIntake(intake, schema);
      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: `Missing required intake fields: ${missing.join(", ")}`,
            missingFields: missing,
            intakeSchema: schema,
          },
          { status: 400 }
        );
      }
    }

    const amountUsd = Number(worker.pricingUsd);
    const amountHbar = usdToHbar(amountUsd);
    const amountTinybar = hbarToTinybar(amountHbar);

    let workerWallet: string;
    if (worker.walletAddress) {
      workerWallet = worker.walletAddress;
    } else if (worker.onChainAgentId !== null) {
      const registry = getAgentRegistry(getSigner());
      workerWallet = await registry.getAgentWallet(worker.onChainAgentId);
    } else {
      return NextResponse.json(
        { error: "Worker has no wallet or on-chain registration" },
        { status: 400 }
      );
    }

    const signer = getSigner();
    const escrow = getEscrow(signer);
    const tx = await escrow.createJob(workerWallet, amountTinybar);
    const receipt = await tx.wait();
    const onChainJobId = Number(await escrow.nextJobId()) - 1;

    let hcsTopicId: string | null = null;
    try {
      hcsTopicId = await createTopic();
    } catch (e) {
      console.error("[checkout] HCS topic creation failed:", e);
    }

    const [job] = await db
      .insert(jobs)
      .values({
        hiringAgentId,
        workerAgentId: worker.id,
        onChainJobId,
        taskDescription:
          typeof taskDescription === "object"
            ? JSON.stringify(taskDescription)
            : String(taskDescription),
        amountUsd: String(amountUsd),
        amountHbar: String(amountHbar),
        status: "pending_fund",
        escrowTxHash: receipt?.hash ?? null,
        hcsTopicId,
      })
      .returning();

    await logToHcs(job.id, hcsTopicId, "job_created", {
      hiringAgentId,
      workerAgentId: worker.id,
      amountUsd,
      amountHbar,
      onChainJobId,
      escrowTxHash: receipt?.hash,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.json({
      sessionId: job.id,
      onChainJobId,
      amountUsd,
      amountHbar,
      escrowAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
      escrowTxHash: receipt?.hash ?? null,
      hcsTopicId,
      resultUrl: `${appUrl}/jobs/${job.id}`,
      statusUrl: `${appUrl}/api/jobs/${job.id}/status`,
    });
  } catch (error) {
    console.error("[api/ucp/checkout]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
