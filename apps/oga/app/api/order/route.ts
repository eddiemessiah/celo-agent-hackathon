// Web intake: order a gig straight from the site (for demos + livestream).

import { NextRequest, NextResponse } from "next/server";
import { GIG_MENU, type GigKind } from "@/lib/gigs";
import { createGig } from "@/lib/store";

export const runtime = "nodejs";

const KINDS: GigKind[] = ["roast", "bio", "caption", "cv_headline"];

export async function POST(req: NextRequest) {
  const { kind, input } = (await req.json().catch(() => ({}))) as {
    kind?: GigKind;
    input?: string;
  };
  if (!kind || !KINDS.includes(kind) || !input?.trim()) {
    return NextResponse.json({ error: "Pick a gig and describe am" }, { status: 400 });
  }
  const menu = GIG_MENU[kind];
  const gig = createGig({
    kind,
    input: input.trim().slice(0, 400),
    priceUsd: menu.priceUsd,
    naira: menu.naira,
    source: { type: "web" },
  });
  return NextResponse.json({ id: gig.id, naira: menu.naira, label: menu.label });
}
