import { NextRequest, NextResponse } from "next/server";
import { getEntitiesBySector } from "@/lib/market-map";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ sector: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { sector } = await params;
    const decoded = decodeURIComponent(sector);
    const entities = getEntitiesBySector(decoded);
    return NextResponse.json(entities);
  } catch (error) {
    console.error("[api/market-map/sectors/[sector]]", error);
    return NextResponse.json(
      { error: "Failed to load sector entities" },
      { status: 500 }
    );
  }
}
