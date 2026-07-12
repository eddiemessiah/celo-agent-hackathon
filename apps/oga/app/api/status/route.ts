import { NextResponse } from "next/server";
import { ogaLevel, recentDelivered, gigLabel } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    oga: ogaLevel(),
    recent: recentDelivered(5).map((g) => ({
      label: gigLabel(g.kind),
      deliverable: g.deliverable?.slice(0, 120) ?? "",
    })),
  });
}
