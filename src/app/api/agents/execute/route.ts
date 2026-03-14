import { NextRequest, NextResponse } from "next/server";
import { executeAgent, type AgentCapability } from "@/lib/execute-agent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { capability, intake } = body as {
      capability: AgentCapability;
      intake: Record<string, unknown>;
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

    const result = await executeAgent(capability, intake);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Agent execution failed" },
      { status: 500 }
    );
  }
}
