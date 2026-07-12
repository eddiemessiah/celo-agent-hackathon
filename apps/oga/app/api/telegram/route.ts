// Telegram intake: message → gig → pay link. Set the webhook once:
// curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<origin>/api/telegram"

import { NextRequest, NextResponse } from "next/server";
import { classifyGig, GIG_MENU } from "@/lib/gigs";
import { createGig } from "@/lib/store";
import { sendTelegram } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const update = await req.json().catch(() => null);
  const msg = update?.message;
  const text: string | undefined = msg?.text;
  const chatId: number | undefined = msg?.chat?.id;
  if (!text || !chatId) return NextResponse.json({ ok: true });

  if (text.startsWith("/start")) {
    await sendTelegram(
      chatId,
      "Oga dey here 🫡 Wetin you need?\n\n" +
        Object.values(GIG_MENU)
          .map((g) => `• ${g.label} — ${g.naira}`)
          .join("\n") +
        "\n\nJust describe am, e.g. <i>roast my profile, I be tech bro wey dey always tweet about 5am runs</i>",
    );
    return NextResponse.json({ ok: true });
  }

  const kind = classifyGig(text);
  const menu = GIG_MENU[kind];
  const gig = createGig({
    kind,
    input: text,
    priceUsd: menu.priceUsd,
    naira: menu.naira,
    source: { type: "telegram", chatId, username: msg?.from?.username },
  });

  const origin = process.env.PUBLIC_ORIGIN ?? "http://localhost:3002";
  await sendTelegram(
    chatId,
    `${menu.label} — ${menu.naira}. Oga go deliver sharp sharp once you pay 👇\n\n${origin}/gig/${gig.id}\n\n<i>Opens in MiniPay · pays with your stablecoin · link expires in 30 min</i>`,
  );
  return NextResponse.json({ ok: true });
}
