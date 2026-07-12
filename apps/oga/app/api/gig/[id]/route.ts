import { NextRequest, NextResponse } from "next/server";
import {
  buildRequirements,
  paymentRequiredBody,
  verifyAndSettle,
  settlementResponseHeader,
} from "@hack/celo-pay/x402";
import { GIG_MENU, fulfillGig } from "@/lib/gigs";
import { getGig, deliverGig } from "@/lib/store";
import { attestGig } from "@/lib/attestor";
import { sendTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

const PAYTO = process.env.PAYTO_ADDRESS as `0x${string}` | undefined;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gig = getGig(id);
  if (!gig) return NextResponse.json({ error: "Gig expired or not found" }, { status: 404 });
  const { source, ...pub } = gig;
  return NextResponse.json({ ...pub, label: GIG_MENU[gig.kind].label });
}

/** POST = pay + fulfill. One gig = one x402 settlement. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const gig = getGig(id);
  if (!gig) return NextResponse.json({ error: "Gig expired or not found" }, { status: 404 });
  if (gig.status === "delivered") {
    return NextResponse.json({ deliverable: gig.deliverable, tx: gig.tx });
  }

  let payer = req.headers.get("x-wallet") ?? "";
  let tx: string | undefined;
  let headers: Record<string, string> = {};

  if (PAYTO) {
    const accepts = buildRequirements({
      priceUsd: gig.priceUsd,
      payTo: PAYTO,
      resource: new URL(req.url).origin + `/api/gig/${id}`,
      description: `Oga — ${GIG_MENU[gig.kind].label}`,
    });
    const paymentHeader = req.headers.get("x-payment");
    if (!paymentHeader) {
      return NextResponse.json(paymentRequiredBody(accepts), { status: 402 });
    }
    const settled = await verifyAndSettle(paymentHeader, accepts);
    if (!settled.ok) {
      return NextResponse.json(
        { ...paymentRequiredBody(accepts), error: settled.error },
        { status: 402 },
      );
    }
    payer = settled.payer ?? payer;
    tx = settled.transaction;
    headers = {
      "X-PAYMENT-RESPONSE": settlementResponseHeader(settled),
      "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
    };
  }

  const deliverable = await fulfillGig(gig.kind, gig.input);
  deliverGig(id, { deliverable, payer, tx });

  // Fire-and-forget: onchain work history + notify the Telegram chat.
  void attestGig(gig.input, deliverable, payer || PAYTO || "0x0000000000000000000000000000000000000000");
  if (gig.source.type === "telegram") {
    void sendTelegram(
      gig.source.chatId,
      `Oga don deliver ✅\n\n${deliverable}\n\n<i>Thank you for your patronage 🫡</i>`,
    );
  }

  return NextResponse.json({ deliverable, tx, demo: !PAYTO }, { headers });
}
