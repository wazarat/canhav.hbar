import { NextRequest, NextResponse } from "next/server";
import { getAgentRegistry, getSigner } from "@/lib/contracts";
import { registerAgentHCS10 } from "@/lib/hcs10";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentURI, walletAddress } = body as {
      agentURI: string;
      walletAddress?: string;
    };

    if (!agentURI) {
      return NextResponse.json(
        { error: "agentURI is required" },
        { status: 400 }
      );
    }

    const signer = getSigner();
    const registry = getAgentRegistry(signer);

    const tx = await registry.register(agentURI);
    const receipt = await tx.wait();

    const event = receipt.logs
      .map((log: { topics: string[]; data: string }) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(
        (e: { name: string } | null) => e?.name === "AgentRegistered"
      );

    const agentId = event?.args?.agentId
      ? Number(event.args.agentId)
      : null;

    if (agentId !== null && walletAddress) {
      const walletTx = await registry.setAgentWallet(agentId, walletAddress);
      await walletTx.wait();
    }

    let parsed: { name?: string; description?: string; capability?: string } = {};
    try {
      parsed = JSON.parse(agentURI);
    } catch {
      // agentURI may not be JSON
    }

    let holTopicId: string | null = null;
    try {
      const holResult = await registerAgentHCS10({
        name: parsed.name || `Agent #${agentId}`,
        description: parsed.description || agentURI,
        capabilities: parsed.capability ? [parsed.capability] : ["general"],
      });
      holTopicId = holResult?.topicId ?? null;
    } catch (e) {
      console.warn("[register] HCS-10/HOL registration non-fatal:", e);
    }

    return NextResponse.json({
      agentId,
      txHash: receipt.hash,
      agentURI,
      holTopicId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Registration failed" },
      { status: 500 }
    );
  }
}
