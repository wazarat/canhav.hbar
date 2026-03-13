import { NextRequest, NextResponse } from "next/server";
import { searchEntities } from "@/lib/market-map";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? "";
    const entities = searchEntities(q);
    return NextResponse.json(entities);
  } catch (error) {
    console.error("[api/market-map/search]", error);
    return NextResponse.json(
      { error: "Failed to search market map" },
      { status: 500 }
    );
  }
}
