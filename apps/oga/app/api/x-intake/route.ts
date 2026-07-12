// Internal intake for the X listener worker.

import { NextRequest, NextResponse } from "next/server";
import { classifyGig, GIG_MENU } from "@/lib/gigs";
import { createGig } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.INTAKE_SECRET ?? "";
  if (secret && req.headers.get("x-intake-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { tweetId, author, text } = (await req.json().catch(() => ({}))) as {
    tweetId?: string;
    author?: string;
    text?: string;
  };
  if (!tweetId || !text) {
    return NextResponse.json({ error: "bad intake" }, { status: 400 });
  }
  const kind = classifyGig(text);
  const menu = GIG_MENU[kind];
  const gig = createGig({
    kind,
    input: text,
    priceUsd: menu.priceUsd,
    naira: menu.naira,
    source: { type: "x", tweetId, author: author ?? "unknown" },
  });
  return NextResponse.json({ gigId: gig.id, naira: menu.naira, label: menu.label });
}
