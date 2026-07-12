import { NextRequest, NextResponse } from "next/server";
import {
  buildRequirements,
  paymentRequiredBody,
  verifyAndSettle,
  settlementResponseHeader,
} from "@hack/celo-pay/x402";
import { askTutor } from "@/lib/tutor";
import { hasFreeQuestion, consumeFreeQuestion, recordAsk } from "@/lib/store";
import { queueAsk } from "@/lib/attestor";

export const runtime = "nodejs";
export const maxDuration = 60;

// ₦20 at street FX ≈ $0.013. One question = one x402 settlement.
const PRICE_USD = process.env.PADI_PRICE_USD ?? "0.013";
const PAYTO = process.env.PAYTO_ADDRESS as `0x${string}` | undefined;

export async function POST(req: NextRequest) {
  const { question, campus } = (await req.json().catch(() => ({}))) as {
    question?: string;
    campus?: string;
  };
  if (!question?.trim()) {
    return NextResponse.json({ error: "Ask something na" }, { status: 400 });
  }
  const wallet = req.headers.get("x-wallet") ?? "";

  // First question free: feel the agent before paying.
  if (wallet && hasFreeQuestion(wallet)) {
    consumeFreeQuestion(wallet);
    const result = await askTutor(question);
    return NextResponse.json({ ...result, paid: false, asks: recordAsk(wallet) });
  }

  if (!PAYTO) {
    // Demo mode without a treasury: stay usable, mark as unpaid.
    const result = await askTutor(question);
    return NextResponse.json({ ...result, paid: false, demo: true });
  }

  const accepts = buildRequirements({
    priceUsd: PRICE_USD,
    payTo: PAYTO,
    resource: new URL(req.url).origin + "/api/ask",
    description: "Padi — one exam-grade answer",
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

  const result = await askTutor(question);
  const payer = settled.payer ?? wallet;
  if (payer) queueAsk(payer, campus?.toLowerCase() || "general");

  return NextResponse.json(
    { ...result, paid: true, tx: settled.transaction, asks: wallet ? recordAsk(wallet) : undefined },
    {
      headers: {
        "X-PAYMENT-RESPONSE": settlementResponseHeader(settled),
        "Access-Control-Expose-Headers": "X-PAYMENT-RESPONSE",
      },
    },
  );
}
