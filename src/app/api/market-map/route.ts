import { NextResponse } from "next/server";
import { getAllEntities } from "@/lib/market-map";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const entities = getAllEntities();
    return NextResponse.json({ entities });
  } catch (error) {
    console.error("[api/market-map]", error);
    return NextResponse.json(
      { error: "Failed to load market map" },
      { status: 500 }
    );
  }
}
