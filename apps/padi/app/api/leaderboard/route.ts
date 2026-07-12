import { NextRequest, NextResponse } from "next/server";
import { campusBoard } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet") ?? undefined;
  const campus = req.nextUrl.searchParams.get("campus") ?? undefined;
  return NextResponse.json(campusBoard(wallet, campus));
}
