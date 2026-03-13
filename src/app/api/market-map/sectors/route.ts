import { NextResponse } from "next/server";
import { getSectors } from "@/lib/market-map";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sectors = getSectors();
    return NextResponse.json(sectors);
  } catch (error) {
    console.error("[api/market-map/sectors]", error);
    return NextResponse.json(
      { error: "Failed to load sectors" },
      { status: 500 }
    );
  }
}
